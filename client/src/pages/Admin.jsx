import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')

export default function Admin() {
  const { adminToken } = useAuth()
  const [users, setUsers] = useState([])
  const [rooms, setRooms] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${SERVER_URL}/api/admin/${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    const data = await response.json()
    if (!response.ok || !data.ok) throw new Error(data.error || 'Yêu cầu thất bại')
    return data
  }, [adminToken])

  const refresh = useCallback(async () => {
    try {
      const [accounts, activeRooms] = await Promise.all([request('users'), request('rooms')])
      setUsers(accounts.users)
      setRooms(activeRooms.rooms)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [request])

  useEffect(() => {
    if (adminToken) refresh()
  }, [adminToken, refresh])

  const remove = async (kind, id, label) => {
    if (!window.confirm(`Xóa ${label}?`)) return
    setBusy(`${kind}:${id}`)
    try {
      await request(`${kind}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  if (!adminToken) {
    return <div className="panel admin-page"><h2>Quản trị</h2><p>Đăng nhập bằng tài khoản quản trị để tiếp tục.</p><Link className="btn" to="/login">Đăng nhập</Link></div>
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div><h2>Quản trị website</h2><p className="muted">Quản lý tài khoản và phòng chơi</p></div>
        <button className="btn secondary" onClick={refresh}>Làm mới</button>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <section className="panel">
        <h3>Tài khoản ({users.length})</h3>
        <div className="admin-list">
          {users.map((account) => (
            <div className="admin-row" key={account.id}>
              <div><strong>{account.username}</strong> {account.role === 'admin' && <span className="muted">(admin)</span>}<small>Elo {account.elo} · {account.wins} thắng · {account.losses} thua · {account.draws} hòa</small></div>
              {account.role !== 'admin' && <button className="btn danger" disabled={Boolean(busy)} onClick={() => remove('users', account.id, `tài khoản ${account.username} và lịch sử ván của họ`)}>Xóa</button>}
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3>Phòng chơi ({rooms.length})</h3>
        <div className="admin-list">
          {rooms.length === 0 && <p className="muted">Chưa có phòng nào.</p>}
          {rooms.map((room) => (
            <div className="admin-row" key={room.roomId}>
              <div><strong>{room.roomId}</strong><small>{room.white || 'Chờ người chơi'} vs {room.black || 'Chờ người chơi'} · {room.moves} nước · {room.spectators} khán giả {room.ended ? '· Đã kết thúc' : ''}</small></div>
              <button className="btn danger" disabled={Boolean(busy)} onClick={() => remove('rooms', room.roomId, `phòng ${room.roomId}`)}>Đóng phòng</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
