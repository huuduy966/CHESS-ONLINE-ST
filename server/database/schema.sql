-- ==========================================================
-- CHESS APPLICATION - SQLITE DATABASE SCHEMA
-- File database: server/database/chess.db
-- ==========================================================

-- 1. Bảng lưu tài khoản người chơi
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

-- 2. Bảng lưu lịch sử các ván đấu
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  opponent_name TEXT DEFAULT 'Opponent',
  opponent_elo INTEGER DEFAULT 1200,
  score REAL NOT NULL,               -- 1 (Thắng), 0.5 (Hòa), 0 (Thua)
  delta INTEGER NOT NULL DEFAULT 0,  -- Điểm Elo thay đổi (+/-)
  new_elo INTEGER NOT NULL,          -- Điểm Elo mới sau trận
  game_mode TEXT DEFAULT 'online',   -- 'online' | 'ai'
  moves TEXT,                        -- Danh sách nước đi (JSON string)
  white_name TEXT,
  black_name TEXT,
  my_color TEXT,                     -- 'w' | 'b'
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chỉ mục tối ưu hóa tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
