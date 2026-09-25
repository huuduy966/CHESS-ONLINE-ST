import { useEffect, useState, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  Swords,
  Clock
} from 'lucide-react'
import { sfx } from '../utils/sound.js'
import { getStockfishMove } from '../utils/stockfish.js'
import { useLanguage } from '../utils/language.jsx'

// Master opening book repertoire (2100+ Elo standard lines)
const MASTER_OPENINGS = [
  {
    name: 'Ván cờ Ý (Italian Game)',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'a6']
  },
  {
    name: 'Phòng thủ Sicilian (Najdorf)',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5']
  },
  {
    name: 'Khai cuộc Ruy Lopez (Tây Ban Nha)',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6']
  },
  {
    name: 'Gambit Hậu (Queen\'s Gambit)',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'Be7', 'e3', 'O-O']
  },
  {
    name: 'Phòng thủ Caro-Kann',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6', 'h4', 'h6', 'Nf3', 'Nd7']
  },
  {
    name: 'Phòng thủ Ấn Độ cổ (King\'s Indian)',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6']
  },
  {
    name: 'Khai cuộc Anh (English Opening)',
    moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6']
  },
  {
    name: 'Phòng thủ Pháp (French Defense)',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7', 'f4', 'c5', 'Nf3', 'Nc6', 'Be3']
  }
]

export default function AutoChaosBoard() {
  const { t, lang } = useLanguage()
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const containerRef = useRef(null)
  const [width, setWidth] = useState(380)

  // Live match states
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1200) // ms per move
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [lastMove, setLastMove] = useState(null)
  const [moveCount, setMoveCount] = useState(0)
  const [capturesCount, setCapturesCount] = useState(0)
  const [statusType, setStatusType] = useState('normal')
  const [statusText, setStatusText] = useState(() => lang === 'en' ? 'Live 2100 ELO match in progress...' : 'Trận đấu 2100 Elo đang diễn ra...')
  const [openingName, setOpeningName] = useState('Ván cờ Ý (Italian Game)')
  const [customSquareStyles, setCustomSquareStyles] = useState({})

  // Opening book tracker
  const openingBookRef = useRef(MASTER_OPENINGS[0].moves)
  const openingIndexRef = useRef(0)

  // Auto-resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const clientW = el.clientWidth
      if (clientW > 0) {
        setWidth(Math.min(480, Math.max(220, Math.floor(clientW - 24))))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Start new master match
  const startNewMatch = useCallback(() => {
    const g = gameRef.current
    g.reset()
    const chosen = MASTER_OPENINGS[Math.floor(Math.random() * MASTER_OPENINGS.length)]
    openingBookRef.current = chosen.moves
    openingIndexRef.current = 0
    setOpeningName(chosen.name)
    setFen(g.fen())
    setLastMove(null)
    setMoveCount(0)
    setCapturesCount(0)
    setCustomSquareStyles({})
    setStatusType('normal')
    setStatusText(`Khai cuộc: ${chosen.name}`)
  }, [])

  // Make one master bot move with Stockfish 19
  const isSteppingRef = useRef(false)
  const makeStep = useCallback(async () => {
    if (isSteppingRef.current) return
    isSteppingRef.current = true

    try {
      const g = gameRef.current
      if (!g) return

      // If game ended or exceeded 90 moves, start new match after short pause
      if (g.isGameOver() || g.history().length > 90) {
        let endText = 'Ván cờ kết thúc hòa'
        if (g.isCheckmate()) {
          const winner = g.turn() === 'w' ? 'Đen' : 'Trắng'
          endText = `Chiếu hết! Bên ${winner} thắng`
        }
        setStatusType('normal')
        setStatusText(endText)
        setTimeout(startNewMatch, 3000)
        return
      }

      const currentTurn = g.turn()
      const side = currentTurn === 'w' ? 'Trắng' : 'Đen'

      let chosenMove = null

      // 1. Follow opening book if available
      const book = openingBookRef.current
      const idx = openingIndexRef.current
      if (idx < book.length) {
        const bookSan = book[idx]
        try {
          const legalMoves = g.moves()
          if (legalMoves.includes(bookSan)) {
            chosenMove = bookSan
            openingIndexRef.current = idx + 1
          }
        } catch {
          chosenMove = null
        }
      }

      // 2. Otherwise calculate using official Stockfish 19 engine
      if (!chosenMove) {
        try {
          const sfRes = await getStockfishMove(g, { depth: 8, movetime: 150, skillLevel: 16 })
          if (sfRes && sfRes.from && sfRes.to) {
            chosenMove = {
              from: sfRes.from,
              to: sfRes.to,
              promotion: sfRes.promotion || 'q'
            }
          }
        } catch {
          chosenMove = null
        }
      }

      // 3. Fallback to legal move if engine was unreachable
      if (!chosenMove) {
        const moves = g.moves({ verbose: true })
        if (moves.length === 0) {
          startNewMatch()
          return
        }
        chosenMove = moves[0]
      }

      const result = g.move(chosenMove)
      if (result) {
        setFen(g.fen())
        setLastMove(result)
        setMoveCount((prev) => prev + 1)
        if (result.captured) {
          setCapturesCount((prev) => prev + 1)
        }

        // Highlight move squares
        setCustomSquareStyles({
          [result.from]: {
            backgroundColor: 'rgba(245, 158, 11, 0.45)',
            boxShadow: 'inset 0 0 10px rgba(245, 158, 11, 0.6)'
          },
          [result.to]: {
            backgroundColor: 'rgba(16, 185, 129, 0.55)',
            boxShadow: 'inset 0 0 12px rgba(16, 185, 129, 0.8)'
          }
        })

        // Status description
        if (g.isCheckmate()) {
          setStatusType('checkmate')
          setStatusText(`Chiếu hết! Bên ${side} thắng!`)
        } else if (g.inCheck()) {
          setStatusType('check')
          setStatusText(`Chiếu tướng (${result.san})!`)
        } else if (result.captured) {
          setStatusType('capture')
          setStatusText(`Ăn quân tại ${result.to} (${result.san})`)
        } else {
          setStatusType('normal')
          setStatusText(`${side}: ${result.san}`)
        }

        if (soundEnabled && sfx.isEnabled()) {
          if (result.captured) sfx.capture()
          else sfx.move()
        }
      }
    } catch {
      startNewMatch()
    } finally {
      isSteppingRef.current = false
    }
  }, [soundEnabled, startNewMatch])

  // Timer loop
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(makeStep, speed)
    return () => clearInterval(id)
  }, [isPlaying, speed, makeStep])

  const currentTurn = gameRef.current ? gameRef.current.turn() : 'w'

  return (
    <div className="auto-chaos-container" ref={containerRef}>
      {/* Live Match Header */}
      <div className="auto-chaos-header">
        <div className="auto-chaos-title-group">
          <div className="auto-chaos-badge-live">
            <span className="pulsing-radar-dot"></span>
            <span>{t('liveMatchBadge')}</span>
          </div>
          <h3 className="auto-chaos-title">
            <Trophy size={17} className="text-yellow" />
            {t('liveMatchTitle')}
          </h3>
        </div>

        <div className="auto-chaos-indicators">
          <span className="turn-indicator-pill">
            {t('turnLabel')} <strong>{currentTurn === 'w' ? t('turnWhite') : t('turnBlack')}</strong>
          </span>
          <span className="moves-counter-pill">
            {t('moveCountLabel')} <strong>#{moveCount}</strong>
          </span>
        </div>
      </div>

      {/* Main Chessboard Frame */}
      <div className="auto-board-stage">
        <div className="board-glow-backdrop"></div>
        <div className="board-surface-box">
          <Chessboard
            position={fen}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: '#2f4858' }}
            customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
            customSquareStyles={customSquareStyles}
            boardWidth={width}
            animationDuration={Math.min(300, Math.floor(speed * 0.4))}
          />
        </div>

        {/* Live Move Bubble Overlay */}
        {lastMove && (
          <div className="live-move-ticker">
            <span className="ticker-san">{lastMove.san}</span>
            <span className="ticker-detail">
              {lastMove.from} ➔ {lastMove.to}
            </span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="auto-chaos-status">
        <div className="status-text-live">
          <span className="status-dot"></span>
          {statusType === 'check' && <Zap size={14} className="inline-icon text-amber" />}
          {statusType === 'capture' && <Swords size={14} className="inline-icon text-red" />}
          <span>{statusText}</span>
        </div>
        <div className="status-captures">
          <Swords size={14} className="inline-icon text-amber" /> {lang === 'en' ? 'Captures:' : 'Đã bắt:'} <strong>{capturesCount}</strong>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="auto-chaos-controls">
        {/* Speed Selector */}
        <div className="speed-selector">
          <span className="control-label">{lang === 'en' ? 'Speed:' : 'Tốc độ:'}</span>
          <button
            type="button"
            className={`speed-btn ${speed === 750 ? 'active' : ''}`}
            onClick={() => setSpeed(750)}
            title={lang === 'en' ? 'Fast' : 'Tốc độ nhanh'}
          >
            <Zap size={14} />
            {lang === 'en' ? 'Fast (0.8s)' : 'Nhanh (0.8s)'}
          </button>
          <button
            type="button"
            className={`speed-btn ${speed === 1200 ? 'active' : ''}`}
            onClick={() => setSpeed(1200)}
            title={lang === 'en' ? 'Normal' : 'Tốc độ chuẩn'}
          >
            <Clock size={14} />
            {lang === 'en' ? 'Normal (1.2s)' : 'Chuẩn (1.2s)'}
          </button>
          <button
            type="button"
            className={`speed-btn ${speed === 1800 ? 'active' : ''}`}
            onClick={() => setSpeed(1800)}
            title={lang === 'en' ? 'Slow' : 'Tốc độ chậm phân tích'}
          >
            {lang === 'en' ? 'Slow (1.8s)' : 'Chậm (1.8s)'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-group">
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? (lang === 'en' ? 'Pause match' : 'Tạm dừng ván cờ') : (lang === 'en' ? 'Resume match' : 'Tiếp tục ván cờ')}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? (lang === 'en' ? 'Pause' : 'Tạm dừng') : (lang === 'en' ? 'Resume' : 'Tiếp tục')}</span>
          </button>

          <button
            type="button"
            className="action-icon-btn"
            onClick={startNewMatch}
            title={lang === 'en' ? 'Start new match' : 'Bắt đầu ván đấu mới'}
          >
            <RotateCcw size={16} />
            <span>{lang === 'en' ? 'New Game' : 'Ván mới'}</span>
          </button>

          <button
            type="button"
            className={`action-icon-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? (lang === 'en' ? 'Mute sound' : 'Tắt âm thanh') : (lang === 'en' ? 'Unmute sound' : 'Bật âm thanh')}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
