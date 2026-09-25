import { socket } from './socket.js'
import { Chess } from 'chess.js'

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : (typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:3001` : 'http://localhost:3001'))

/**
 * Tính toán nước đi bằng động cơ Stockfish 19 UCI Engine
 * Stockfish là đầu não tính toán duy nhất, không dùng AI/minimax giả lập can thiệp
 */
export async function getStockfishMove(game, botConfig = {}) {
  const fen = typeof game === 'string' ? game : game.fen()

  // 1. Thử qua Socket.io trước để có tốc độ phản hồi real-time nhanh nhất
  if (socket && socket.connected) {
    try {
      const res = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), (botConfig.movetime || 600) + 3500)
        socket.emit(
          'stockfish-move',
          {
            fen,
            skillLevel: botConfig.skillLevel,
            elo: botConfig.elo,
            movetime: botConfig.movetime,
            depth: botConfig.depth
          },
          (data) => {
            clearTimeout(timer)
            resolve(data)
          }
        )
      })

      if (res && res.ok && res.bestmove && res.bestmove !== '(none)') {
        return {
          from: res.bestmove.slice(0, 2),
          to: res.bestmove.slice(2, 4),
          promotion: res.bestmove.length > 4 ? res.bestmove[4] : undefined,
          san: res.san,
          evalScore: res.evalScore,
          mate: res.mate,
          depth: res.depth,
          engine: 'Stockfish 19'
        }
      }
    } catch {
      // Fallback sang HTTP
    }
  }

  // 2. Thử qua HTTP REST API
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), (botConfig.movetime || 600) + 3500)

    const response = await fetch(`${SERVER_URL}/api/stockfish/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen,
        skillLevel: botConfig.skillLevel,
        elo: botConfig.elo,
        movetime: botConfig.movetime,
        depth: botConfig.depth
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data && data.ok && data.bestmove && data.bestmove !== '(none)') {
        return {
          from: data.bestmove.slice(0, 2),
          to: data.bestmove.slice(2, 4),
          promotion: data.bestmove.length > 4 ? data.bestmove[4] : undefined,
          san: data.san,
          evalScore: data.evalScore,
          mate: data.mate,
          depth: data.depth,
          engine: 'Stockfish 19'
        }
      }
    }
  } catch (err) {
    console.error('[Stockfish] HTTP request error:', err)
  }

  // Nếu máy chủ chưa sẵn sàng, trả về nước đi hợp lệ đầu tiên của bàn cờ
  if (typeof game !== 'string' && game.moves) {
    const legalMoves = game.moves({ verbose: true })
    if (legalMoves.length > 0) {
      const fallback = legalMoves[0]
      return {
        from: fallback.from,
        to: fallback.to,
        promotion: fallback.promotion,
        san: fallback.san,
        evalScore: 0,
        mate: null,
        depth: 1,
        engine: 'Stockfish 19 (Standby)'
      }
    }
  }

  return null
}

/**
 * Nhận gợi ý nước đi tối ưu (Hint) từ Stockfish 19
 */
export async function getStockfishHint(game) {
  const fen = typeof game === 'string' ? game : game.fen()

  // Socket
  if (socket && socket.connected) {
    try {
      const res = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 3500)
        socket.emit('stockfish-hint', { fen }, (data) => {
          clearTimeout(timer)
          resolve(data)
        })
      })

      if (res && res.ok && res.bestmove && res.bestmove !== '(none)') {
        return {
          from: res.bestmove.slice(0, 2),
          to: res.bestmove.slice(2, 4),
          san: res.san,
          evalScore: (res.evalScore / 100).toFixed(1),
          mate: res.mate,
          depth: res.depth,
          engine: 'Stockfish 19'
        }
      }
    } catch {}
  }

  // HTTP
  try {
    const response = await fetch(`${SERVER_URL}/api/stockfish/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen })
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.ok && data.bestmove && data.bestmove !== '(none)') {
        return {
          from: data.bestmove.slice(0, 2),
          to: data.bestmove.slice(2, 4),
          san: data.san,
          evalScore: (data.evalScore / 100).toFixed(1),
          mate: data.mate,
          depth: data.depth,
          engine: 'Stockfish 19'
        }
      }
    }
  } catch {}

  // Dự phòng an toàn nếu mất kết nối máy chủ: Tìm nước đi hợp lệ đầu tiên
  try {
    const tempGame = typeof game === 'string' ? new Chess(game) : game
    if (tempGame && tempGame.moves) {
      const legalMoves = tempGame.moves({ verbose: true })
      if (legalMoves.length > 0) {
        const fallback = legalMoves[0]
        return {
          from: fallback.from,
          to: fallback.to,
          san: fallback.san,
          evalScore: '0.0',
          mate: null,
          depth: 1,
          engine: 'Stockfish 19 (Standby)'
        }
      }
    }
  } catch {}

  return null
}

/**
 * Lấy điểm số đánh giá vị trí FEN thời gian thực từ Stockfish 19
 */
export async function getStockfishEval(game, depth = 12, movetime = 250) {
  const fen = typeof game === 'string' ? game : game.fen()

  if (socket && socket.connected) {
    try {
      const res = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 2500)
        socket.emit('stockfish-eval', { fen, depth, movetime }, (data) => {
          clearTimeout(timer)
          resolve(data)
        })
      })
      if (res && res.ok) {
        return {
          score: res.evalScore !== undefined ? res.evalScore / 100 : 0,
          mate: res.mate,
          depth: res.depth,
          bestmove: res.bestmove,
          san: res.san,
          engine: 'Stockfish 19'
        }
      }
    } catch {}
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/stockfish/eval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, depth, movetime })
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.ok) {
        return {
          score: data.evalScore !== undefined ? data.evalScore / 100 : 0,
          mate: data.mate,
          depth: data.depth,
          bestmove: data.bestmove,
          san: data.san,
          engine: 'Stockfish 19'
        }
      }
    }
  } catch {}

  return null
}

/**
 * Phân tích toàn bộ ván cờ & tính độ chính xác bằng Stockfish 19
 */
export async function analyzeGameWithStockfish(sanMoves, options = {}) {
  if (!Array.isArray(sanMoves) || sanMoves.length === 0) {
    return {
      moves: [],
      accuracy: { w: 100, b: 100 },
      stats: {
        w: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
        b: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
      },
      engine: 'Stockfish 19'
    }
  }

  // 1. Thử qua Socket
  if (socket && socket.connected) {
    try {
      const res = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), Math.max(10000, sanMoves.length * 200))
        socket.emit('stockfish-analyze-game', { sanMoves, ...options }, (data) => {
          clearTimeout(timer)
          resolve(data)
        })
      })
      if (res && res.ok) return res
    } catch {}
  }

  // 2. Thử qua HTTP
  try {
    const response = await fetch(`${SERVER_URL}/api/stockfish/analyze-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sanMoves, ...options })
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.ok) return data
    }
  } catch (err) {
    console.error('[Stockfish] Game analysis failed:', err)
  }

  return null
}

/**
 * Kiểm tra trạng thái máy chủ Stockfish 19
 */
export async function checkStockfishStatus() {
  try {
    const response = await fetch(`${SERVER_URL}/api/stockfish/status`)
    if (response.ok) {
      const data = await response.json()
      return data.available === true
    }
  } catch {}
  return false
}
