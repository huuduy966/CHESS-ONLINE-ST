import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Chess } from 'chess.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STOCKFISH_PATH = path.resolve(__dirname, '../stockfish/stockfish-windows-x86-64-universal.exe')

class StockfishManager {
  constructor() {
    this.proc = null
    this.queue = []
    this.current = null
    this.ready = false
    this.destroyed = false
    this.restartTimer = null
    this.available = fs.existsSync(STOCKFISH_PATH)
    this.initProcess()

    // Clean up process on exit so no orphan stockfish processes linger
    const cleanup = () => this.destroy()
    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }

  initProcess() {
    if (this.destroyed || !this.available) return

    try {
      this.proc = spawn(STOCKFISH_PATH, [], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let buffer = ''
      this.proc.stdout.on('data', (chunk) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          this.handleLine(line.trim())
        }
      })

      this.proc.on('error', (err) => {
        console.error('[Stockfish] Process error:', err)
        this.ready = false
      })

      this.proc.on('exit', (code) => {
        this.ready = false
        this.proc = null
        if (!this.destroyed) {
          console.warn(`[Stockfish] Process exited with code ${code}. Restarting in 1s...`)
          this.restartTimer = setTimeout(() => this.initProcess(), 1000)
        }
      })

      // Send initial UCI commands
      this.proc.stdin.write('uci\n')
      this.proc.stdin.write('isready\n')
      console.log('[Stockfish 19] Process spawned successfully.')
    } catch (err) {
      console.error('[Stockfish] Failed to spawn:', err)
      this.available = false
    }
  }

  destroy() {
    this.destroyed = true
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (this.proc) {
      try {
        this.proc.stdin?.write('quit\n')
      } catch {}
      try {
        this.proc.kill('SIGKILL')
      } catch {}
      this.proc = null
    }
    this.ready = false
  }

  handleLine(line) {
    if (!line) return

    if (line === 'readyok') {
      this.ready = true
      this.next()
      return
    }

    if (this.current) {
      // Parse evaluation score & depth
      if (line.startsWith('info') && line.includes('score')) {
        const cpMatch = line.match(/score cp (-?\d+)/)
        const mateMatch = line.match(/score mate (-?\d+)/)
        const depthMatch = line.match(/depth (\d+)/)
        const pvMatch = line.match(/pv (\S+)/)

        if (cpMatch) this.current.eval = parseInt(cpMatch[1], 10)
        if (mateMatch) this.current.mate = parseInt(mateMatch[1], 10)
        if (depthMatch) this.current.depth = parseInt(depthMatch[1], 10)
        if (pvMatch) this.current.pvMove = pvMatch[1]
      }

      // Best move received
      if (line.startsWith('bestmove')) {
        const parts = line.split(' ')
        const uciMove = parts[1]
        const resolve = this.current.resolve
        const fen = this.current.fen
        const taskEval = this.current.eval
        const taskMate = this.current.mate
        const taskDepth = this.current.depth

        // Calculate move info with chess.js
        let moveObj = null
        let san = uciMove
        let turn = 'w'
        try {
          const chess = new Chess(fen)
          turn = chess.turn() // 'w' hoặc 'b'
          if (uciMove && uciMove !== '(none)') {
            const from = uciMove.slice(0, 2)
            const to = uciMove.slice(2, 4)
            const promotion = uciMove.length > 4 ? uciMove[4] : undefined
            moveObj = chess.move({ from, to, promotion })
            if (moveObj) san = moveObj.san
          }
        } catch {
          // fallback
        }

        // Chuẩn hóa điểm đánh giá luôn luôn theo góc nhìn quân Trắng (White's perspective)
        // Stockfish UCI trả về score cp theo góc nhìn của bên đến lượt đi.
        // Nếu là lượt Đen (turn === 'b'), ta đảo dấu (-taskEval) để Trắng ưu thì luôn > 0, Đen ưu thì luôn < 0.
        const whitePerspectiveEval = turn === 'w' ? taskEval : -taskEval
        const whitePerspectiveMate = taskMate !== null && taskMate !== undefined
          ? (turn === 'w' ? taskMate : -taskMate)
          : null

        const result = {
          bestmove: uciMove,
          san,
          move: moveObj,
          evalScore: whitePerspectiveEval,
          mate: whitePerspectiveMate,
          depth: taskDepth,
          engine: 'Stockfish 19'
        }

        this.current = null
        resolve(result)
        this.next()
      }
    }
  }

  next() {
    if (this.destroyed || !this.ready || this.current || this.queue.length === 0) return
    if (!this.proc || !this.proc.stdin) return

    this.current = this.queue.shift()
    const { fen, skillLevel, elo, movetime, depth } = this.current

    try {
      this.proc.stdin.write('stop\n')

      // Set skill level (0 - 20)
      if (skillLevel !== undefined && skillLevel !== null) {
        const clampedSkill = Math.max(0, Math.min(20, Number(skillLevel)))
        this.proc.stdin.write(`setoption name Skill Level value ${clampedSkill}\n`)
      }

      // Set ELO limit if specified
      if (elo && Number(elo) < 3000) {
        const clampedElo = Math.max(1320, Math.min(3190, Number(elo)))
        this.proc.stdin.write('setoption name UCI_LimitStrength value true\n')
        this.proc.stdin.write(`setoption name UCI_Elo value ${clampedElo}\n`)
      } else {
        this.proc.stdin.write('setoption name UCI_LimitStrength value false\n')
      }

      // Set board position
      this.proc.stdin.write(`position fen ${fen}\n`)

      // Go calculation
      if (movetime) {
        this.proc.stdin.write(`go movetime ${movetime}\n`)
      } else if (depth) {
        this.proc.stdin.write(`go depth ${depth}\n`)
      } else {
        this.proc.stdin.write('go movetime 400\n')
      }
    } catch (err) {
      console.error('[Stockfish] Error writing to stdin:', err)
      const reject = this.current.reject
      this.current = null
      reject(err)
      this.next()
    }
  }

  getBestMove(fen, options = {}) {
    if (!this.available || this.destroyed) {
      return Promise.reject(new Error('Stockfish binary not available'))
    }

    return new Promise((resolve, reject) => {
      // Set safety timeout in case engine hangs
      const timeoutId = setTimeout(() => {
        if (this.current && this.current.resolve === resolve) {
          console.warn('[Stockfish] Request timed out. Resetting current task.')
          this.proc?.stdin?.write('stop\n')
          this.current = null
          reject(new Error('Stockfish timed out'))
          this.next()
        }
      }, (options.movetime || 1500) + 3000)

      this.queue.push({
        fen,
        skillLevel: options.skillLevel,
        elo: options.elo,
        movetime: options.movetime || 400,
        depth: options.depth,
        eval: 0,
        mate: null,
        depthReached: 0,
        resolve: (val) => {
          clearTimeout(timeoutId)
          resolve(val)
        },
        reject: (err) => {
          clearTimeout(timeoutId)
          reject(err)
        }
      })

      this.next()
    })
  }

  getEvaluation(fen, depth = 12, movetime = 300) {
    return this.getBestMove(fen, { depth, movetime, skillLevel: 20 })
  }

  /**
   * Phân tích toàn diện ván cờ bằng Stockfish 19 UCI Engine
   * Tính toán nước hay nhất, đánh giá thế trận, độ mất centipawn (cpLoss) và độ chính xác (%)
   */
  async analyzeGame(sanMoves, options = {}) {
    if (!this.available || this.destroyed) {
      throw new Error('Stockfish binary not available')
    }
    if (!Array.isArray(sanMoves) || sanMoves.length === 0) {
      return {
        ok: true,
        moves: [],
        accuracy: { w: 100, b: 100 },
        stats: {
          w: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
          b: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
        },
        engine: 'Stockfish 19'
      }
    }

    const depth = options.depth || 10
    const movetime = options.movetime || 60
    const chess = new Chess()

    // 1. Dựng lại danh sách các vị trí FEN trong ván
    const fens = [chess.fen()]
    const playedMoves = []
    for (let i = 0; i < sanMoves.length; i++) {
      try {
        const actual = chess.move(sanMoves[i])
        if (!actual) break
        playedMoves.push(actual)
        fens.push(chess.fen())
      } catch {
        break
      }
    }

    // 2. Chạy Stockfish đánh giá từng vị trí
    const evals = []
    for (let i = 0; i < fens.length; i++) {
      try {
        const res = await this.getBestMove(fens[i], { depth, movetime, skillLevel: 20 })
        evals.push(res)
      } catch {
        evals.push({ bestmove: null, san: null, evalScore: 0, mate: null, depth: 0 })
      }
    }

    // 3. Phân loại nước cờ & tính độ chính xác chuẩn Chess.com / Lichess (Win Probability)
    const winProb = (scoreSide) => {
      const clamped = Math.max(-1000, Math.min(1000, scoreSide || 0))
      return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1)
    }

    const getWhiteCp = (evalObj) => {
      if (!evalObj) return 0
      if (evalObj.mate !== null && evalObj.mate !== undefined) {
        return evalObj.mate > 0
          ? (10000 - Math.min(Math.abs(evalObj.mate), 50) * 10)
          : (-10000 + Math.min(Math.abs(evalObj.mate), 50) * 10)
      }
      return Number(evalObj.evalScore) || 0
    }

    const moves = []
    const byColorAcc = { w: [], b: [] }
    const stats = {
      w: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      b: { brilliant: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
    }

    for (let i = 0; i < playedMoves.length; i++) {
      const actual = playedMoves[i]
      const turn = actual.color // 'w' hoặc 'b'
      const posBefore = evals[i]
      const posAfter = evals[i + 1]

      // Điểm số Stockfish (đã được getBestMove chuẩn hóa theo góc nhìn White: > 0 Trắng ưu, < 0 Đen ưu)
      const evalBeforeWhite = getWhiteCp(posBefore)
      const evalAfterWhite = getWhiteCp(posAfter)

      // Điểm số từ góc nhìn của bên thực hiện nước đi
      const scoreBeforeSide = turn === 'w' ? evalBeforeWhite : -evalBeforeWhite
      const scoreAfterSide = turn === 'w' ? evalAfterWhite : -evalAfterWhite

      // Kiểm tra có phải nước đi hay nhất do Stockfish đề xuất không
      const uciPlayed = (actual.from + actual.to + (actual.promotion || '')).toLowerCase()
      const uciBest = posBefore.bestmove ? posBefore.bestmove.toLowerCase() : ''
      const isExactBest = Boolean(
        (posBefore.san && posBefore.san === actual.san) ||
        (uciBest && uciBest.startsWith(actual.from + actual.to))
      )

      let cpLoss = isExactBest ? 0 : Math.max(0, scoreBeforeSide - scoreAfterSide)

      // Tính phần trăm chính xác (chuẩn CAPS Chess.com qua Win Probability)
      const winBefore = winProb(scoreBeforeSide)
      const winAfter = winProb(scoreAfterSide)
      const winLoss = isExactBest ? 0 : Math.max(0, winBefore - winAfter)

      let moveAcc = 100
      if (!isExactBest && winLoss > 0) {
        moveAcc = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669))
      }
      byColorAcc[turn].push(moveAcc)

      // Phân loại chất lượng nước đi chuẩn xác
      let classification = 'best'
      if (isExactBest || cpLoss <= 12 || winLoss < 1.5) {
        classification = 'best'
        // Nước Thiên tài (Brilliant): Nước tối ưu có thí quân giá trị
        const isPieceSacrifice = actual.captured && ['q', 'r', 'b', 'n'].includes(actual.piece)
        if (isPieceSacrifice && cpLoss <= 5 && scoreAfterSide > 50) {
          classification = 'brilliant'
        }
      } else if (cpLoss <= 30 || winLoss < 4) {
        classification = 'excellent'
      } else if (cpLoss <= 75 || winLoss < 8) {
        classification = 'good'
      } else if (cpLoss <= 150 || winLoss < 16) {
        classification = 'inaccuracy'
      } else if (cpLoss <= 300 || winLoss < 30) {
        classification = 'mistake'
      } else {
        classification = 'blunder'
      }

      stats[turn][classification]++

      moves.push({
        ply: i,
        san: actual.san,
        turn,
        fenBefore: fens[i],
        fenAfter: fens[i + 1],
        evalBefore: evalBeforeWhite / 100,
        evalAfter: evalAfterWhite / 100,
        bestSAN: posBefore.san || actual.san,
        bestScore: evalBeforeWhite / 100,
        cpLoss: Math.round(cpLoss),
        classification,
        accuracy: Math.round(moveAcc * 10) / 10
      })
    }

    const calcAverage = (arr) => {
      if (arr.length === 0) return 100
      const sum = arr.reduce((a, b) => a + b, 0)
      return Math.round((sum / arr.length) * 10) / 10
    }

    const accuracy = {
      w: calcAverage(byColorAcc.w),
      b: calcAverage(byColorAcc.b)
    }

    return {
      ok: true,
      moves,
      accuracy,
      stats,
      engine: 'Stockfish 19'
    }
  }
}

export const stockfishEngine = new StockfishManager()
