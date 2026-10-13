import express from 'express'
import http from 'http'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { Server } from 'socket.io'
import { Chess } from 'chess.js'
import { stockfishEngine } from './stockfish.js'
import { chooseBestMove } from './ai.js'
import {
  getUserByUsername,
  getUserProfile,
  createUser,
  recordGameTransaction,
  updateLatestGameMoves,
  getLeaderboard
} from './database/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../client/dist')

const app = express()
app.use(cors())
app.use(express.json())
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT = process.env.PORT || 3001

// Tự động giải phóng cổng nếu có tiến trình zombie cũ đang chiếm giữ
function freePort(port) {
  if (process.platform === 'win32') {
    try {
      const stdout = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      })
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        if (line.includes('LISTENING') || line.includes('Listen')) {
          const parts = line.trim().split(/\s+/)
          const pid = parseInt(parts[parts.length - 1], 10)
          if (pid && pid !== process.pid && pid > 0) {
            console.log(`[Server] Cổng ${port} đang bị chiếm bởi PID ${pid}. Đang giải phóng...`)
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
            } catch {}
          }
        }
      }
    } catch {}
  }
}

// =================================================================
// 1. CÁC API AUTHENTICATION & SQLITE DATABASE
// =================================================================

// 1. API Đăng ký tài khoản
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body
  const u = username ? username.trim() : ''
  if (!u || !password) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập đủ thông tin' })
  }
  if (u.length < 3) {
    return res.status(400).json({ ok: false, error: 'Tên đăng nhập tối thiểu 3 ký tự' })
  }
  if (password.length < 4) {
    return res.status(400).json({ ok: false, error: 'Mật khẩu tối thiểu 4 ký tự' })
  }

  try {
    const existing = getUserByUsername(u)
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác' })
    }

    const newUser = createUser(u, password)
    res.json({ ok: true, user: { ...newUser, history: [] } })
  } catch (err) {
    console.error('[API Register Error]:', err)
    res.status(500).json({ ok: false, error: 'Lỗi server khi đăng ký: ' + err.message })
  }
})

// 2. API Đăng nhập
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const u = username ? username.trim() : ''
  if (!u || !password) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập đủ thông tin' })
  }

  try {
    const user = getUserByUsername(u)
    if (!user) {
      return res.status(400).json({ ok: false, error: 'Tài khoản không tồn tại' })
    }

    if (user.password !== password) {
      return res.status(400).json({ ok: false, error: 'Sai mật khẩu' })
    }

    const profile = getUserProfile(u)
    res.json({ ok: true, user: profile })
  } catch (err) {
    console.error('[API Login Error]:', err)
    res.status(500).json({ ok: false, error: 'Lỗi server khi đăng nhập: ' + err.message })
  }
})

// 3. API Lấy thông tin người chơi (Profile & Lịch sử ván cờ)
app.get('/api/users/:username', (req, res) => {
  const u = req.params.username ? req.params.username.trim() : ''
  if (!u) return res.status(400).json({ ok: false, error: 'Thiếu username' })

  try {
    const profile = getUserProfile(u)
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Không tìm thấy người dùng' })
    }
    res.json({ ok: true, user: profile })
  } catch (err) {
    console.error('[API Get User Error]:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// 4. API Ghi nhận kết quả ván đấu vào SQLite
app.post('/api/games/record', (req, res) => {
  const { username, score, oppElo, opponentName, mode, moves, delta, newElo, whiteName, blackName, myColor } = req.body
  const u = username ? username.trim() : ''
  if (!u) return res.status(400).json({ ok: false, error: 'Thiếu username' })

  try {
    const result = recordGameTransaction({
      username: u,
      score,
      oppElo,
      opponentName,
      mode,
      moves,
      delta,
      newElo,
      whiteName,
      blackName,
      myColor
    })
    res.json({ ok: true, ...result })
  } catch (err) {
    console.error('[API Record Game Error]:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// 5. API Cập nhật danh sách moves cho ván cờ gần nhất
app.post('/api/games/update-moves', (req, res) => {
  const { username, moves, whiteName, blackName, myColor } = req.body
  const u = username ? username.trim() : ''
  if (!u || !Array.isArray(moves)) return res.status(400).json({ ok: false, error: 'Dữ liệu không hợp lệ' })

  try {
    const ok = updateLatestGameMoves(u, moves, { whiteName, blackName, myColor })
    res.json({ ok })
  } catch (err) {
    console.error('[API Update Moves Error]:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// 6. API Bảng xếp hạng người chơi
app.get('/api/leaderboard', (_req, res) => {
  try {
    const leaderboard = getLeaderboard(30)
    res.json({ ok: true, leaderboard })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// REST API for Stockfish Engine
app.get('/api/stockfish/status', (_req, res) => {
  res.json({
    available: stockfishEngine.available,
    engine: 'Stockfish 19',
    ready: stockfishEngine.ready
  })
})

app.post('/api/stockfish/move', async (req, res) => {
  const { fen, skillLevel, elo, movetime, depth } = req.body
  if (!fen) return res.status(400).json({ ok: false, error: 'Thiếu FEN' })

  try {
    const result = await stockfishEngine.getBestMove(fen, {
      skillLevel,
      elo,
      movetime: movetime || 450,
      depth
    })
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/stockfish/eval', async (req, res) => {
  const { fen, depth, movetime } = req.body
  if (!fen) return res.status(400).json({ ok: false, error: 'Thiếu FEN' })

  try {
    const result = await stockfishEngine.getEvaluation(fen, depth || 12, movetime || 300)
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/stockfish/hint', async (req, res) => {
  const { fen } = req.body
  if (!fen) return res.status(400).json({ ok: false, error: 'Thiếu FEN' })

  try {
    const result = await stockfishEngine.getBestMove(fen, { skillLevel: 20, movetime: 500 })
    res.json({ ok: true, ...result })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/stockfish/analyze-game', async (req, res) => {
  const { sanMoves, depth, movetime } = req.body
  if (!Array.isArray(sanMoves)) return res.status(400).json({ ok: false, error: 'Thiếu danh sách sanMoves' })

  try {
    const result = await stockfishEngine.analyzeGame(sanMoves, { depth, movetime })
    res.json(result)
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Time control: { initialMs, incrementMs }. Luôn tính giờ (tối thiểu 60s, mặc định 10 phút nếu <= 0).
function normalizeTC(tc) {
  const rawMs = Number(tc?.initialMs)
  const initialMs = (!rawMs || rawMs <= 0) ? 600000 : Math.max(60000, Math.min(7200000, rawMs))
  const incrementMs = Math.max(0, Math.min(60000, Number(tc?.incrementMs) || 0))
  return { initialMs, incrementMs }
}
function tcKey(tc) { return `${tc.initialMs}_${tc.incrementMs}` }

// roomId -> { game, players, spectators, ended, tc, clocks: {w,b}, lastMoveAt, clockStarted }
const rooms = new Map()
let queue = [] // [{ id, name, elo, tc, joinedAt }]
const QUEUE_TIMEOUT_MS = 10000
const TICK_MS = 1000
const CLOCK_TICK_MS = 250

const BOT_NAMES = [
  'Oliver', 'Emma', 'Lucas', 'Sophia', 'Mateo',
  'Isabella', 'Ethan', 'Mia', 'Liam', 'Aria',
  'Noah', 'Chloe', 'Leon', 'Hana', 'Dimitri',
  'Yuki', 'Pablo', 'Elena', 'Felix', 'Nadia',
  'Magnus', 'Viktor', 'Kanade', 'Rafael', 'Ingrid',
]
const randomBotName = () => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
const randomBotElo = (e) => Math.max(400, Math.min(2400, e + Math.floor(Math.random() * 101) - 50))
const difficultyFromElo = (e) => e < 1000 ? 'easy' : e < 1500 ? 'medium' : 'hard'
const newRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

function liveClocks(r) {
  // Tính thời gian còn lại realtime cho bên đang đi
  if (!r.clockStarted || r.ended || r.tc.initialMs === 0) return { ...r.clocks }
  const turn = r.game.turn()
  const elapsed = Date.now() - r.lastMoveAt
  return {
    w: turn === 'w' ? Math.max(0, r.clocks.w - elapsed) : r.clocks.w,
    b: turn === 'b' ? Math.max(0, r.clocks.b - elapsed) : r.clocks.b,
  }
}

function roomState(roomId) {
  const r = rooms.get(roomId)
  if (!r) return null
  return {
    roomId,
    fen: r.game.fen(),
    history: r.game.history(),
    turn: r.game.turn(),
    isGameOver: r.game.isGameOver(),
    isCheckmate: r.game.isCheckmate(),
    isDraw: r.game.isDraw(),
    players: {
      w: r.players.w ? { id: r.players.w.id, name: r.players.w.name, elo: r.players.w.elo, isBot: r.players.w.isBot, engine: r.players.w.engine } : null,
      b: r.players.b ? { id: r.players.b.id, name: r.players.b.name, elo: r.players.b.elo, isBot: r.players.b.isBot, engine: r.players.b.engine } : null,
    },
    spectatorCount: r.spectators.size,
    tc: r.tc,
    clocks: liveClocks(r),
    clockRunning: r.clockStarted && !r.ended,
    serverTime: Date.now(),
  }
}

function broadcast(roomId) {
  const s = roomState(roomId)
  if (s) io.to(roomId).emit('state', s)
}

function emitResult(roomId, outcome) {
  const r = rooms.get(roomId)
  if (!r || r.ended) return
  r.ended = true
  io.to(roomId).emit('game-result', {
    outcome,
    history: r.game.history(),
    fen: r.game.fen(),
    players: {
      w: r.players.w ? { id: r.players.w.id, name: r.players.w.name, elo: r.players.w.elo, isBot: r.players.w.isBot } : null,
      b: r.players.b ? { id: r.players.b.id, name: r.players.b.name, elo: r.players.b.elo, isBot: r.players.b.isBot } : null,
    },
    clocks: liveClocks(r),
  })
}

function maybeEmitNaturalResult(roomId) {
  const r = rooms.get(roomId)
  if (!r || r.ended) return
  const g = r.game
  if (!g.isGameOver()) return
  let outcome
  if (g.isCheckmate()) outcome = g.turn() === 'w' ? 'black_win' : 'white_win'
  else outcome = 'draw'
  emitResult(roomId, outcome)
}

// Tick clocks mỗi 250ms để bắt timeout
setInterval(() => {
  for (const [roomId, r] of rooms) {
    if (r.ended || !r.clockStarted || r.tc.initialMs === 0) continue
    const live = liveClocks(r)
    if (live.w <= 0) {
      r.clocks = { w: 0, b: live.b }
      emitResult(roomId, 'white_timeout')
    } else if (live.b <= 0) {
      r.clocks = { w: live.w, b: 0 }
      emitResult(roomId, 'black_timeout')
    }
  }
}, CLOCK_TICK_MS)

// Cấu hình tham số Stockfish 19 làm đầu não tính toán dựa trên mức Elo của Bot
function getStockfishConfigForElo(elo) {
  const clamped = Math.max(600, Math.min(3200, Number(elo) || 1200))
  // Skill Level (0 - 20) của Stockfish
  const skillLevel = Math.max(0, Math.min(20, Math.round((clamped - 600) / 110)))
  // Thời gian suy nghĩ của engine: từ 200ms đến 500ms
  const movetime = Math.min(500, Math.max(200, 200 + Math.round((clamped / 3000) * 300)))
  const depth = Math.min(18, Math.max(3, Math.round(clamped / 170)))
  return {
    elo: clamped >= 1320 ? clamped : undefined,
    skillLevel,
    movetime,
    depth
  }
}

function maybeBotMove(roomId) {
  const r = rooms.get(roomId)
  if (!r || r.ended) return
  const turn = r.game.turn()
  const seat = r.players[turn]
  if (!seat?.isBot) return
  if (r.botThinking) return // Đang có tác vụ bot tính nước, tránh chạy lặp song song
  r.botThinking = true

  const difficulty = seat.difficulty || 'medium'
  const delay = 450 + Math.floor(Math.random() * 450)
  setTimeout(async () => {
    try {
      const cur = rooms.get(roomId)
      if (!cur || cur.ended || cur.game.turn() !== turn || cur.game.isGameOver()) {
        if (cur) cur.botThinking = false
        return
      }

      let move = null

      // 1. DÙNG STOCKFISH 19 LÀM ĐẦU NÃO TÍNH TOÁN
      if (stockfishEngine.available) {
        try {
          const sfConfig = getStockfishConfigForElo(seat.elo)
          const sfRes = await stockfishEngine.getBestMove(cur.game.fen(), sfConfig)
          if (sfRes?.bestmove && sfRes.bestmove !== '(none)') {
            move = {
              from: sfRes.bestmove.slice(0, 2),
              to: sfRes.bestmove.slice(2, 4),
              promotion: sfRes.bestmove.length > 4 ? sfRes.bestmove[4] : undefined
            }
          }
        } catch (err) {
          console.warn('[maybeBotMove] Stockfish engine error:', err.message)
        }
      }

      // Kiểm tra lại sau khi chờ Stockfish bất đồng bộ
      if (!cur || cur.ended || cur.game.turn() !== turn || cur.game.isGameOver()) {
        if (cur) cur.botThinking = false
        return
      }

      // 2. Nếu Stockfish chưa kịp trả về hoặc chưa khả dụng, dùng Minimax AI Engine
      if (!move) {
        try {
          const difficulty = seat.elo >= 1600 ? 'hard' : seat.elo <= 1200 ? 'easy' : 'medium'
          const aiMove = chooseBestMove(cur.game, difficulty)
          if (aiMove) {
            move = {
              from: aiMove.from,
              to: aiMove.to,
              promotion: aiMove.promotion
            }
          }
        } catch (err) {
          console.warn('[maybeBotMove] AI fallback error:', err.message)
        }
      }

      // 3. Dự phòng an toàn cuối cùng: chọn nước đi hợp lệ ngẫu nhiên
      if (!move) {
        const legalMoves = cur.game.moves({ verbose: true })
        if (legalMoves.length > 0) {
          const randomLegal = legalMoves[Math.floor(Math.random() * legalMoves.length)]
          move = {
            from: randomLegal.from,
            to: randomLegal.to,
            promotion: randomLegal.promotion
          }
        }
      }

      if (!move) {
        cur.botThinking = false
        return
      }

      const applied = applyMove(cur, move)
      cur.botThinking = false

      if (applied) {
        broadcast(roomId)
        maybeEmitNaturalResult(roomId)
        maybeBotMove(roomId)
      }
    } catch (err) {
      console.error('[maybeBotMove error]:', err)
      const cur = rooms.get(roomId)
      if (cur) cur.botThinking = false
    }
  }, delay)
}

// Áp dụng nước đi + cập nhật clock an toàn, không để crash server
function applyMove(r, move) {
  const turnBefore = r.game.turn()
  let result = null

  try {
    const movePayload = typeof move === 'object'
      ? { from: move.from, to: move.to, promotion: move.promotion || 'q' }
      : move
    result = r.game.move(movePayload)
  } catch (err) {
    console.warn(`[applyMove] Invalid move rejected:`, move, err.message)
    return null
  }

  if (!result) return null

  if (r.tc.initialMs > 0) {
    if (r.clockStarted) {
      const elapsed = Date.now() - r.lastMoveAt
      r.clocks[turnBefore] = Math.max(0, r.clocks[turnBefore] - elapsed)
    }
    // Cộng increment kể cả nước đầu (chuẩn Fischer), trừ khi nước này kết thúc ván
    if (!r.game.isGameOver()) r.clocks[turnBefore] += r.tc.incrementMs
    r.clockStarted = true
    r.lastMoveAt = Date.now()
  }
  return result
}

function createMatchedRoom(p1, p2) {
  const roomId = newRoomId()
  const [w, b] = Math.random() < 0.5 ? [p1, p2] : [p2, p1]
  const tc = normalizeTC(p1.tc)
  rooms.set(roomId, {
    roomId,
    createdAt: Date.now(),
    game: new Chess(),
    players: {
      w: { id: w.id, name: w.name, elo: w.elo, isBot: false },
      b: { id: b.id, name: b.name, elo: b.elo, isBot: false },
    },
    spectators: new Set(),
    ended: false,
    tc,
    clocks: { w: tc.initialMs, b: tc.initialMs },
    lastMoveAt: 0,
    clockStarted: false,
  })
  io.sockets.sockets.get(w.id)?.join(roomId)
  io.sockets.sockets.get(b.id)?.join(roomId)
  io.to(w.id).emit('match-found', { roomId, color: 'w', opponent: { name: b.name, elo: b.elo } })
  io.to(b.id).emit('match-found', { roomId, color: 'b', opponent: { name: w.name, elo: w.elo } })
  broadcast(roomId)
}

function createBotMatch(player) {
  const roomId = newRoomId()
  const botName = randomBotName()
  const botElo = randomBotElo(player.elo)
  const difficulty = difficultyFromElo(player.elo)
  const tc = normalizeTC(player.tc)
  const playerSeat = { id: player.id, name: player.name, elo: player.elo, isBot: false }
  const botSeat = { id: null, name: botName, elo: botElo, isBot: true, difficulty, engine: 'Stockfish 19' }
  const [w, b] = Math.random() < 0.5 ? [playerSeat, botSeat] : [botSeat, playerSeat]
  rooms.set(roomId, {
    roomId,
    createdAt: Date.now(),
    game: new Chess(),
    players: { w, b },
    spectators: new Set(),
    ended: false,
    botThinking: false,
    tc,
    clocks: { w: tc.initialMs, b: tc.initialMs },
    lastMoveAt: 0,
    clockStarted: false,
  })
  io.sockets.sockets.get(player.id)?.join(roomId)
  const myColor = w.id === player.id ? 'w' : 'b'
  const oppColor = myColor === 'w' ? 'b' : 'w'
  io.to(player.id).emit('match-found', {
    roomId, color: myColor,
    opponent: { name: rooms.get(roomId).players[oppColor].name, elo: rooms.get(roomId).players[oppColor].elo },
  })
  broadcast(roomId)
  maybeBotMove(roomId)
}

// Matchmaking tick: chỉ ghép cùng time control
setInterval(() => {
  const now = Date.now()
  outer: for (let i = 0; i < queue.length; i++) {
    const a = queue[i]
    if (!io.sockets.sockets.get(a.id)) { queue.splice(i, 1); i--; continue }
    const waited = now - a.joinedAt
    const range = Math.min(800, 100 + Math.floor(waited / 1000) * 50)
    for (let j = i + 1; j < queue.length; j++) {
      const b = queue[j]
      if (tcKey(a.tc) !== tcKey(b.tc)) continue
      if (Math.abs(a.elo - b.elo) <= range) {
        queue.splice(j, 1); queue.splice(i, 1)
        createMatchedRoom(a, b)
        i--; continue outer
      }
    }
    // Random timeout 10 - 20s cho mỗi lượt ghép trận
    const maxWait = a.timeoutMs || 15000
    if (waited >= maxWait) {
      queue.splice(i, 1)
      createBotMatch(a)
      i--
    }
  }
}, TICK_MS)

io.on('connection', (socket) => {
  let joined = null

  // Stockfish 19 AI Engine events
  socket.on('stockfish-move', async ({ fen, skillLevel, elo, movetime, depth }, ack) => {
    if (!fen) return ack?.({ ok: false, error: 'Thiếu FEN' })
    try {
      const result = await stockfishEngine.getBestMove(fen, {
        skillLevel,
        elo,
        movetime: movetime || 450,
        depth
      })
      ack?.({ ok: true, ...result })
    } catch (err) {
      ack?.({ ok: false, error: err.message })
    }
  })

  socket.on('stockfish-hint', async ({ fen }, ack) => {
    if (!fen) return ack?.({ ok: false, error: 'Thiếu FEN' })
    try {
      const result = await stockfishEngine.getBestMove(fen, { skillLevel: 20, movetime: 500 })
      ack?.({ ok: true, ...result })
    } catch (err) {
      ack?.({ ok: false, error: err.message })
    }
  })

  socket.on('stockfish-eval', async ({ fen, depth, movetime }, ack) => {
    if (!fen) return ack?.({ ok: false, error: 'Thiếu FEN' })
    try {
      const result = await stockfishEngine.getEvaluation(fen, depth || 12, movetime || 300)
      ack?.({ ok: true, ...result })
    } catch (err) {
      ack?.({ ok: false, error: err.message })
    }
  })

  socket.on('stockfish-analyze-game', async ({ sanMoves, depth, movetime }, ack) => {
    try {
      const result = await stockfishEngine.analyzeGame(sanMoves, { depth, movetime })
      ack?.(result)
    } catch (err) {
      ack?.({ ok: false, error: err.message })
    }
  })

  socket.on('find-match', ({ name, elo, tc }, ack) => {
    queue = queue.filter(q => q.id !== socket.id)
    // Random timeout từ 10s đến 20s (10000ms - 20000ms), nếu không tìm được người sẽ ghép bot
    const timeoutMs = Math.floor(10000 + Math.random() * 10000)
    queue.push({
      id: socket.id,
      name: name || 'Player',
      elo: Number(elo) || 1200,
      tc: normalizeTC(tc),
      joinedAt: Date.now(),
      timeoutMs,
    })
    ack?.({ ok: true, queueSize: queue.length, timeoutMs })
  })

  socket.on('cancel-match', (_, ack) => {
    queue = queue.filter(q => q.id !== socket.id)
    ack?.({ ok: true })
  })

  socket.on('create-room', ({ name, elo, tc }, ack) => {
    const roomId = newRoomId()
    const ntc = normalizeTC(tc)
    rooms.set(roomId, {
      game: new Chess(),
      players: { w: { id: socket.id, name: name || 'Player 1', elo: Number(elo) || 1200, isBot: false }, b: null },
      spectators: new Set(),
      ended: false,
      tc: ntc,
      clocks: { w: ntc.initialMs, b: ntc.initialMs },
      lastMoveAt: 0,
      clockStarted: false,
    })
    socket.join(roomId)
    joined = { roomId, color: 'w' }
    ack?.({ ok: true, roomId, color: 'w' })
    broadcast(roomId)
  })

  socket.on('join-room', ({ roomId, name, elo }, ack) => {
    // Luôn xóa khỏi hàng chờ matchmaking khi đã vào phòng
    queue = queue.filter(q => q.id !== socket.id)
    const r = rooms.get(roomId)
    if (!r) return ack?.({ ok: false, error: 'Phòng không tồn tại' })
    socket.join(roomId)
    let color = null
    const eloVal = Number(elo) || 1200
    // Nhận diện người chơi bằng socket.id hoặc tên hiển thị để không bao giờ bị gán nhầm làm khán giả
    if (r.players.w?.id === socket.id || (r.players.w?.name === name && !r.players.w.isBot)) {
      r.players.w.id = socket.id
      color = 'w'
    } else if (r.players.b?.id === socket.id || (r.players.b?.name === name && !r.players.b.isBot)) {
      r.players.b.id = socket.id
      color = 'b'
    } else if (!r.players.w) {
      r.players.w = { id: socket.id, name: name || 'Player 1', elo: eloVal, isBot: false }
      color = 'w'
    } else if (!r.players.b) {
      r.players.b = { id: socket.id, name: name || 'Player 2', elo: eloVal, isBot: false }
      color = 'b'
    } else {
      r.spectators.add(socket.id)
      color = 'spectator'
    }
    joined = { roomId, color }
    const st = roomState(roomId)
    ack?.({ ok: true, roomId, color, state: st })
    broadcast(roomId)
    maybeBotMove(roomId)
  })

  socket.on('leave-room', ({ roomId }, ack) => {
    queue = queue.filter(q => q.id !== socket.id)
    if (roomId) {
      socket.leave(roomId)
      const r = rooms.get(roomId)
      if (r) {
        // Nếu người chơi rời phòng khi trận đấu đang diễn ra thì bị tính là đầu hàng
        const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
        if (seat && !r.ended && (r.players.w && r.players.b)) {
          emitResult(roomId, seat === 'w' ? 'white_resign' : 'black_resign')
        }

        if (r.players.w?.id === socket.id) {
          r.players.w = null
        } else if (r.players.b?.id === socket.id) {
          r.players.b = null
        } else {
          r.spectators.delete(socket.id)
        }

        const remainingHuman = (r.players.w && !r.players.w.isBot) || (r.players.b && !r.players.b.isBot)
        if (!remainingHuman && r.spectators.size === 0) {
          const isFresh = (Date.now() - (r.createdAt || 0)) < 15000
          if (!isFresh || r.ended) {
            rooms.delete(roomId)
          }
        } else {
          broadcast(roomId)
        }
      }
    }
    joined = null
    ack?.({ ok: true })
  })

  socket.on('move', ({ roomId, move }, ack) => {
    const r = rooms.get(roomId)
    if (!r) return ack?.({ ok: false, error: 'Phòng không tồn tại' })
    if (r.ended) return ack?.({ ok: false, error: 'Ván đã kết thúc' })
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (!seat) return ack?.({ ok: false, error: 'Bạn là khán giả' })
    if (r.game.turn() !== seat) return ack?.({ ok: false, error: 'Chưa đến lượt' })
    // Check timeout trước khi cho đi
    if (r.tc.initialMs > 0 && r.clockStarted) {
      const live = liveClocks(r)
      if (live[seat] <= 0) {
        emitResult(roomId, seat === 'w' ? 'white_timeout' : 'black_timeout')
        return ack?.({ ok: false, error: 'Hết giờ' })
      }
    }
    try {
      const result = applyMove(r, move)
      if (!result) return ack?.({ ok: false, error: 'Nước đi không hợp lệ' })
      ack?.({ ok: true })
      broadcast(roomId)
      maybeEmitNaturalResult(roomId)
      maybeBotMove(roomId)
    } catch {
      ack?.({ ok: false, error: 'Nước đi không hợp lệ' })
    }
  })

  socket.on('resign', ({ roomId }) => {
    const r = rooms.get(roomId)
    if (!r) return
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (!seat) return
    io.to(roomId).emit('resigned', { color: seat })
    emitResult(roomId, seat === 'w' ? 'white_resign' : 'black_resign')
  })

  socket.on('rematch-request', ({ roomId }) => {
    const r = rooms.get(roomId)
    if (!r) return
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (!seat) return
    const oppSeat = seat === 'w' ? 'b' : 'w'
    const opp = r.players[oppSeat]
    if (!opp) return
    const from = { name: r.players[seat].name, elo: r.players[seat].elo }
    if (opp.isBot) {
      resetRoomForRematch(roomId)
      io.to(roomId).emit('rematch-accepted')
      broadcast(roomId)
      maybeBotMove(roomId)
      return
    }
    io.to(opp.id).emit('rematch-offer', { from })
  })

  socket.on('rematch-accept', ({ roomId }) => {
    const r = rooms.get(roomId)
    if (!r) return
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (!seat) return
    resetRoomForRematch(roomId)
    io.to(roomId).emit('rematch-accepted')
    broadcast(roomId)
    maybeBotMove(roomId)
  })

  socket.on('rematch-decline', ({ roomId }) => {
    const r = rooms.get(roomId)
    if (!r) return
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (!seat) return
    const oppSeat = seat === 'w' ? 'b' : 'w'
    const opp = r.players[oppSeat]
    if (opp && !opp.isBot) io.to(opp.id).emit('rematch-declined')
  })

  socket.on('chat', ({ roomId, message }) => {
    const r = rooms.get(roomId)
    if (!r) return
    const senderSeat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    const name = senderSeat ? r.players[senderSeat].name : 'Khán giả'
    const cleanMsg = String(message).slice(0, 200)
    io.to(roomId).emit('chat', { name, message: cleanMsg, seat: senderSeat, ts: Date.now() })

    // Bot reply nếu đối thủ trong phòng là bot và trận đấu chưa kết thúc
    if (senderSeat && !r.ended) {
      const oppSeat = senderSeat === 'w' ? 'b' : 'w'
      const opp = r.players[oppSeat]
      if (opp && opp.isBot) {
        setTimeout(() => {
          const currentRoom = rooms.get(roomId)
          if (!currentRoom || currentRoom.ended) return
          const lower = cleanMsg.toLowerCase()
          let reply = 'Chúc bạn có một ván cờ vui vẻ! 😊'
          if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) {
            reply = `Chào bạn ${name}! Chúc bạn có một trận đấu thật hay!`
          } else if (lower.includes('may mắn') || lower.includes('luck')) {
            reply = 'Cảm ơn bạn! Chúc bạn thi đấu tập trung và may mắn nhé!'
          } else if (lower.includes('hay') || lower.includes('good') || lower.includes('nice')) {
            reply = 'Cảm ơn bạn rất nhiều! Ván đấu đang rất hấp dẫn.'
          } else if (lower.includes('hòa') || lower.includes('draw')) {
            reply = 'Chúng ta hãy cùng thi đấu hết sức mình trước nhé!'
          } else if (lower.includes('căng') || lower.includes('tense')) {
            reply = 'Đúng vậy, từng nước đi đều rất quan trọng!'
          } else if (lower.includes('gg')) {
            reply = 'Good game! Cảm ơn bạn vì một ván cờ tuyệt vời.'
          } else {
            const genericReplies = [
              'Nước cờ rất đáng học hỏi!',
              'Ván cờ này đang diễn ra vô cùng cân não.',
              'Tôi đang suy nghĩ rất kỹ cho từng nước đi đây.',
              'Cố gắng lên nhé!'
            ]
            reply = genericReplies[Math.floor(Math.random() * genericReplies.length)]
          }
          io.to(roomId).emit('chat', { name: opp.name, message: reply, seat: oppSeat, ts: Date.now() })
        }, 1100 + Math.random() * 600)
      }
    }
  })

  socket.on('disconnect', () => {
    queue = queue.filter(q => q.id !== socket.id)
    if (!joined) return
    const r = rooms.get(joined.roomId)
    if (!r) return
    const seat = r.players.w?.id === socket.id ? 'w' : r.players.b?.id === socket.id ? 'b' : null
    if (seat && !r.ended && (r.players.w && r.players.b)) {
      emitResult(joined.roomId, seat === 'w' ? 'white_resign' : 'black_resign')
    }
    if (r.players.w?.id === socket.id) r.players.w = null
    else if (r.players.b?.id === socket.id) r.players.b = null
    else r.spectators.delete(socket.id)
    const remainingHuman = (r.players.w && !r.players.w.isBot) || (r.players.b && !r.players.b.isBot)
    if (!remainingHuman && r.spectators.size === 0) rooms.delete(joined.roomId)
    else broadcast(joined.roomId)
  })
})

function resetRoomForRematch(roomId) {
  const r = rooms.get(roomId)
  if (!r) return
  r.game = new Chess()
  r.ended = false
  r.botThinking = false
  const tmp = r.players.w
  r.players.w = r.players.b
  r.players.b = tmp
  r.clocks = { w: r.tc.initialMs, b: r.tc.initialMs }
  r.lastMoveAt = 0
  r.clockStarted = false
}

// Serve client build nếu tồn tại
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => res.send('Chess server is running (no client build found)'))
}

// Giải phóng cổng 3001 trước khi listen nếu có tiến trình cũ chiếm dụng
freePort(PORT)

let startRetries = 0
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Server] Cổng ${PORT} đang bận (thử lần ${startRetries + 1}). Đang giải phóng và thử lại...`)
    freePort(PORT)
    startRetries++
    if (startRetries <= 5) {
      setTimeout(() => {
        try { server.close() } catch {}
        server.listen(PORT, '0.0.0.0')
      }, 500)
    } else {
      console.error(`[Server] Không thể mở cổng ${PORT} sau nhiều lần thử.`)
      process.exit(1)
    }
  } else {
    console.error('[Server] Lỗi server:', err)
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chess server listening on :${PORT}`)
})

// Đảm bảo đóng server và dọn dẹp Stockfish sạch sẽ khi thoát
const gracefulShutdown = () => {
  console.log('[Server] Đang tắt máy chủ an toàn...')
  try { stockfishEngine?.destroy() } catch {}
  try { io.close() } catch {}
  try {
    server.close(() => {
      process.exit(0)
    })
  } catch {}
  setTimeout(() => process.exit(0), 800)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
