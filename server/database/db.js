import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, 'chess.db')

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true })
}

// Khởi tạo database SQLite
const db = new Database(DB_PATH)

// Tối ưu hóa hiệu năng và tính toàn vẹn dữ liệu
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Khởi tạo bảng Users và Games nếu chưa có
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1200,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opponent_name TEXT DEFAULT 'Opponent',
    opponent_elo INTEGER DEFAULT 1200,
    score REAL NOT NULL,
    delta INTEGER NOT NULL DEFAULT 0,
    new_elo INTEGER NOT NULL,
    game_mode TEXT DEFAULT 'online',
    moves TEXT,
    white_name TEXT,
    black_name TEXT,
    my_color TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
  CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
`)

console.log(`[SQLite Database] Đã khởi tạo và kết nối thành công file cơ sở dữ liệu: ${DB_PATH}`)

// Prepared statements để tối ưu tốc độ truy vấn
const stmtGetUserByUsername = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
const stmtGetUserById = db.prepare('SELECT * FROM users WHERE id = ?')
const stmtInsertUser = db.prepare(`
  INSERT INTO users (username, password, elo, wins, losses, draws, created_at)
  VALUES (?, ?, 1200, 0, 0, 0, datetime('now', 'localtime'))
`)
const stmtGetGamesByUserId = db.prepare(`
  SELECT * FROM games WHERE user_id = ? ORDER BY id DESC LIMIT ?
`)
const stmtUpdateUserStats = db.prepare(`
  UPDATE users
  SET elo = ?, wins = wins + ?, losses = losses + ?, draws = draws + ?
  WHERE id = ?
`)
const stmtInsertGame = db.prepare(`
  INSERT INTO games (user_id, opponent_name, opponent_elo, score, delta, new_elo, game_mode, moves, white_name, black_name, my_color, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
`)
const stmtGetLatestGameByUserId = db.prepare(`
  SELECT * FROM games WHERE user_id = ? ORDER BY id DESC LIMIT 1
`)
const stmtUpdateGameMoves = db.prepare(`
  UPDATE games
  SET moves = ?, white_name = COALESCE(?, white_name), black_name = COALESCE(?, black_name), my_color = COALESCE(?, my_color)
  WHERE id = ?
`)
const stmtGetLeaderboard = db.prepare(`
  SELECT id, username, elo, wins, losses, draws, created_at
  FROM users
  ORDER BY elo DESC, wins DESC
  LIMIT ?
`)

// Helper chuẩn hóa dữ liệu game cho Frontend
function formatGameRecord(g) {
  let moves = []
  if (g.moves) {
    try {
      const parsed = JSON.parse(g.moves)
      if (Array.isArray(parsed)) moves = parsed
      else if (parsed && typeof parsed === 'object') {
        moves = parsed.moves || []
      }
    } catch {
      moves = g.moves.trim().split(/\s+/).filter(Boolean)
    }
  }

  return {
    id: g.id,
    ts: new Date(g.created_at).getTime(),
    mode: g.game_mode,
    score: g.score,
    oppElo: g.opponent_elo,
    opponent: g.opponent_name,
    delta: g.delta,
    newElo: g.new_elo,
    moves,
    whiteName: g.white_name,
    blackName: g.black_name,
    myColor: g.my_color
  }
}

export function getUserByUsername(username) {
  if (!username) return null
  return stmtGetUserByUsername.get(username.trim()) || null
}

export function getUserById(id) {
  return stmtGetUserById.get(id) || null
}

export function createUser(username, password) {
  const cleanUsername = username.trim()
  const info = stmtInsertUser.run(cleanUsername, password)
  return {
    id: info.lastInsertRowid,
    username: cleanUsername,
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date().toISOString()
  }
}

export function getUserProfile(username) {
  const user = getUserByUsername(username)
  if (!user) return null
  const rawGames = stmtGetGamesByUserId.all(user.id, 50)
  const history = rawGames.map(formatGameRecord)
  return {
    id: user.id,
    username: user.username,
    elo: user.elo,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws,
    createdAt: user.created_at,
    history
  }
}

export function getLeaderboard(limit = 20) {
  return stmtGetLeaderboard.all(limit)
}

// Ghi nhận kết quả ván cờ vào DB bằng SQLite Transaction (đảm bảo an toàn)
export const recordGameTransaction = db.transaction((data) => {
  const { username, score, oppElo, opponentName, mode, moves, delta, newElo, whiteName, blackName, myColor } = data
  const user = getUserByUsername(username)
  if (!user) throw new Error('Không tìm thấy tài khoản người dùng: ' + username)

  const calculatedElo = newElo !== undefined ? newElo : user.elo
  const winInc = score === 1 ? 1 : 0
  const lossInc = score === 0 ? 1 : 0
  const drawInc = score === 0.5 ? 1 : 0

  // 1. Cập nhật bảng users
  stmtUpdateUserStats.run(calculatedElo, winInc, lossInc, drawInc, user.id)

  // 2. Chèn vào bảng games
  const movesJson = JSON.stringify(Array.isArray(moves) ? moves : [])
  const gameInfo = stmtInsertGame.run(
    user.id,
    opponentName || 'Đối thủ',
    oppElo || 1200,
    score,
    delta || 0,
    calculatedElo,
    mode || 'online',
    movesJson,
    whiteName || null,
    blackName || null,
    myColor || null
  )

  return {
    gameId: gameInfo.lastInsertRowid,
    newElo: calculatedElo,
    wins: user.wins + winInc,
    losses: user.losses + lossInc,
    draws: user.draws + drawInc
  }
})

// Cập nhật moves cho ván cờ gần nhất của user
export function updateLatestGameMoves(username, moves, extra = {}) {
  const user = getUserByUsername(username)
  if (!user) return false
  const latestGame = stmtGetLatestGameByUserId.get(user.id)
  if (!latestGame) return false

  const movesJson = JSON.stringify(Array.isArray(moves) ? moves : [])
  stmtUpdateGameMoves.run(
    movesJson,
    extra.whiteName || null,
    extra.blackName || null,
    extra.myColor || null,
    latestGame.id
  )
  return true
}

export default db
