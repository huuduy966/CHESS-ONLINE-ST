import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { io } from 'socket.io-client'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { unlinkSync } from 'node:fs'

const serverDir = dirname(fileURLToPath(import.meta.url))

test('admin permissions protect accounts and rooms', async () => {
  const port = await new Promise((resolve) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const assigned = server.address().port
      server.close(() => resolve(assigned))
    })
  })
  const dbPath = join(tmpdir(), `chess-admin-test-${randomUUID()}.db`)
  const child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(port), DATABASE_PATH: dbPath, ADMIN_PASSWORD: 'test-secret' },
    stdio: 'ignore'
  })
  const base = `http://127.0.0.1:${port}`
  let socket

  async function api(path, options = {}) {
    const response = await fetch(base + path, options)
    return { status: response.status, body: await response.json() }
  }

  try {
    let ready = false
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await api('/api/stockfish/status')
        ready = true
        break
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    assert.ok(ready, 'server started')

    const normal = await api('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'testpass' })
    })
    assert.equal(normal.status, 200)
    assert.equal((await api('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ADMIN', password: 'otherpass' })
    })).status, 400)
    const login = await api('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'test-secret' })
    })
    assert.equal(login.body.user.role, 'admin')
    const auth = { Authorization: `Bearer ${login.body.adminToken}` }
    assert.equal((await api('/api/admin/users')).status, 403)
    assert.equal((await api('/api/admin/users', { headers: auth })).body.users.length, 2)
    assert.equal((await api(`/api/admin/users/${login.body.user.id}`, { method: 'DELETE', headers: auth })).status, 403)

    socket = io(base, { transports: ['websocket'] })
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('connect_error', reject)
    })
    const room = await new Promise(resolve => socket.emit('create-room', { name: 'testuser' }, resolve))
    assert.equal(room.ok, true)
    assert.equal((await api('/api/admin/rooms', { headers: auth })).body.rooms.length, 1)
    assert.equal((await api(`/api/admin/rooms/${room.roomId}`, { method: 'DELETE' })).status, 403)
    assert.equal((await api(`/api/admin/users/${normal.body.user.id}`, { method: 'DELETE', headers: auth })).status, 409)
    const closed = new Promise(resolve => socket.once('room-closed', resolve))
    assert.equal((await api(`/api/admin/rooms/${room.roomId}`, { method: 'DELETE', headers: auth })).status, 200)
    await closed
    assert.equal((await api('/api/admin/rooms', { headers: auth })).body.rooms.length, 0)
    assert.equal((await api(`/api/admin/users/${normal.body.user.id}`, { method: 'DELETE', headers: auth })).status, 200)
  } finally {
    socket?.disconnect()
    child.kill()
    for (const suffix of ['', '-wal', '-shm']) {
      try { unlinkSync(dbPath + suffix) } catch {}
    }
  }
})
