import { Chessboard } from 'react-chessboard'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { X, Zap } from 'lucide-react'
import { BOARD_DARK, BOARD_LIGHT, LAST_MOVE_FROM, LAST_MOVE_TO } from '../utils/boardTheme.js'
import { useLanguage } from '../utils/language.jsx'

const EMPTY_ARROWS = []
const PROMOTION_CHOICES = [
  { type: 'q', white: '♕', black: '♛', vi: 'Hậu', en: 'Queen' },
  { type: 'r', white: '♖', black: '♜', vi: 'Xe', en: 'Rook' },
  { type: 'b', white: '♗', black: '♝', vi: 'Tượng', en: 'Bishop' },
  { type: 'n', white: '♘', black: '♞', vi: 'Mã', en: 'Knight' }
]

export default function Board({
  game,
  onMove,
  orientation = 'white',
  disabled = false,
  mode,
  hint = null,
  customArrows = null,
  onDismissHint = null,
  topBar = null,
  bottomBar = null
}) {
  const { lang } = useLanguage()
  const [moveFrom, setMoveFrom] = useState('')
  const [optionSquares, setOptionSquares] = useState({})
  const [premoves, setPremoves] = useState([])
  const [promotionMove, setPromotionMove] = useState(null)

  useEffect(() => {
    if (promotionMove && promotionMove.fen !== game.fen()) setPromotionMove(null)
  }, [game.fen(), promotionMove])

  const premovesRef = useRef([])
  premovesRef.current = premoves

  const myColor = orientation === 'black' ? 'b' : 'w'
  const isMyTurn = !disabled && (mode === 'local' ? true : game.turn() === myColor)

  // Tìm ô của Vua đang bị chiếu để tạo hiệu ứng cảnh báo đỏ neon
  const kingCheckSquare = useMemo(() => {
    if (!game || !game.inCheck()) return null
    try {
      const turn = game.turn()
      const board = game.board()
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c]
          if (piece && piece.type === 'k' && piece.color === turn) {
            const file = String.fromCharCode(97 + c)
            const rank = 8 - r
            return `${file}${rank}`
          }
        }
      }
    } catch {}
    return null
  }, [game.fen()])

  // Lấy nước đi gần nhất vừa đi để highlight nhẹ
  const lastMove = useMemo(() => {
    try {
      const history = game.history({ verbose: true })
      return history.length > 0 ? history[history.length - 1] : null
    } catch {
      return null
    }
  }, [game.fen()])

  // Mũi tên chỉ nước đi gợi ý từ Stockfish
  const boardArrows = useMemo(() => {
    if (Array.isArray(customArrows)) {
      return customArrows
    }
    if (hint && hint.from && hint.to) {
      return [[hint.from, hint.to, 'rgb(245, 158, 11)']]
    }
    return EMPTY_ARROWS
  }, [customArrows, hint?.from, hint?.to])

  // Style highlight các ô: kết hợp gợi ý từ Stockfish và tùy chọn nước đi
  const customSquareStyles = useMemo(() => {
    const styles = {}

    // Hiển thị highlight nước đi gần nhất vừa hoàn thành
    if (lastMove && !hint) {
      styles[lastMove.from] = LAST_MOVE_FROM
      styles[lastMove.to] = LAST_MOVE_TO
    }

    // Hiệu ứng cảnh báo ô Vua khi bị chiếu
    if (kingCheckSquare) {
      styles[kingCheckSquare] = {
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.5) 60%, transparent 95%)',
        borderRadius: '50%',
        boxShadow: '0 0 16px rgba(239, 68, 68, 0.9), inset 0 0 10px rgba(239, 68, 68, 0.95)'
      }
    }

    // Hiển thị ô xuất phát và ô đích của nước đi gợi ý từ Stockfish
    if (hint && hint.from && hint.to) {
      styles[hint.from] = {
        backgroundColor: 'rgba(245, 158, 11, 0.3)',
        boxShadow: 'inset 0 0 10px rgba(245, 158, 11, 0.7)',
        borderRadius: '6px'
      }
      styles[hint.to] = {
        backgroundColor: 'rgba(245, 158, 11, 0.45)',
        boxShadow: 'inset 0 0 14px rgba(245, 158, 11, 0.95)',
        borderRadius: '6px'
      }
    }

    // Gộp với các ô gợi ý nước đi người dùng bấm vào hoặc premoves
    Object.keys(optionSquares).forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        ...optionSquares[sq]
      }
    })

    return styles
  }, [optionSquares, hint, lastMove, kingCheckSquare])

  const highlightPremoves = useCallback((queue) => {
    const newSquares = {}
    queue.forEach((pm) => {
      newSquares[pm.from] = {
        backgroundColor: 'rgba(239, 68, 68, 0.45)',
        boxShadow: 'inset 0 0 10px rgba(239, 68, 68, 0.8)',
        borderRadius: '6px'
      }
      newSquares[pm.to] = {
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
        boxShadow: 'inset 0 0 12px rgba(239, 68, 68, 0.9)',
        borderRadius: '6px'
      }
    })
    setOptionSquares(newSquares)
  }, [])

  const cancelAllPremoves = useCallback(() => {
    premovesRef.current = []
    setPremoves([])
    setMoveFrom('')
    setOptionSquares({})
  }, [])

  // Clear premoves on game reset or game over
  useEffect(() => {
    if (game.history().length === 0 || game.isGameOver()) {
      cancelAllPremoves()
    }
  }, [game, cancelAllPremoves])

  // Execute pre-move as soon as opponent moves and it becomes our turn
  useEffect(() => {
    if (isMyTurn && premovesRef.current.length > 0) {
      const nextMove = premovesRef.current[0]

      // Validate on the new board position using chess.js
      let validMove = null
      try {
        const test = new Chess(game.fen())
        validMove = test.move({
          from: nextMove.from,
          to: nextMove.to,
          promotion: nextMove.promotion || 'q'
        })
      } catch {
        validMove = null
      }

      if (validMove) {
        const remaining = premovesRef.current.slice(1)
        premovesRef.current = remaining
        setPremoves(remaining)
        if (remaining.length > 0) {
          highlightPremoves(remaining)
        } else {
          setOptionSquares({})
        }
        onMove({
          from: nextMove.from,
          to: nextMove.to,
          promotion: nextMove.promotion || 'q'
        })
      } else {
        // Premove is invalid on new position -> cancel all queued premoves
        cancelAllPremoves()
      }
    }
  }, [game.fen(), isMyTurn, onMove, highlightPremoves, cancelAllPremoves])

  // Normal turn legal move indicators
  const getMoveOptions = (square) => {
    const moves = game.moves({ square, verbose: true })
    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }
    const newSquares = {}
    moves.forEach((m) => {
      newSquares[m.to] = {
        background:
          game.get(m.to) && game.get(m.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(231, 76, 60, 0.6) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.55) 25%, transparent 25%)',
        borderRadius: '50%'
      }
    })
    newSquares[square] = {
      backgroundColor: 'rgba(245, 158, 11, 0.35)',
      boxShadow: 'inset 0 0 8px rgba(245, 158, 11, 0.6)'
    }
    setOptionSquares(newSquares)
    return true
  }

  // Pre-move potential options (showing theoretical legal moves for that piece)
  const getPremoveOptions = (square) => {
    const piece = game.get(square)
    if (!piece || piece.color !== myColor) {
      highlightPremoves(premovesRef.current)
      return false
    }

    let moves = []
    try {
      const tokens = game.fen().split(' ')
      tokens[1] = myColor
      tokens[3] = '-'
      const flipped = new Chess(tokens.join(' '))
      moves = flipped.moves({ square, verbose: true })
    } catch {
      moves = []
    }

    const newSquares = {}
    // Retain existing premoves highlight
    premovesRef.current.forEach((pm) => {
      newSquares[pm.from] = {
        backgroundColor: 'rgba(239, 68, 68, 0.45)',
        boxShadow: 'inset 0 0 10px rgba(239, 68, 68, 0.8)',
        borderRadius: '6px'
      }
      newSquares[pm.to] = {
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
        boxShadow: 'inset 0 0 12px rgba(239, 68, 68, 0.9)',
        borderRadius: '6px'
      }
    })

    moves.forEach((m) => {
      newSquares[m.to] = {
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 28%, transparent 28%)',
        borderRadius: '50%'
      }
    })
    newSquares[square] = {
      backgroundColor: 'rgba(239, 68, 68, 0.35)',
      boxShadow: 'inset 0 0 8px rgba(239, 68, 68, 0.6)'
    }
    setOptionSquares(newSquares)
    return true
  }

  const requestPromotion = (from, to, premove = false) => {
    const piece = game.get(from)
    if (piece?.type !== 'p' || to[1] !== (piece.color === 'w' ? '8' : '1')) return false
    try {
      let position = game
      if (premove) {
        const tokens = game.fen().split(' ')
        tokens[1] = piece.color
        tokens[3] = '-'
        position = new Chess(tokens.join(' '))
      }
      if (!position.moves({ square: from, verbose: true }).some((move) => move.to === to && move.promotion)) return false
    } catch {
      return false
    }
    setPromotionMove({ from, to, color: piece.color, premove, fen: game.fen() })
    setMoveFrom('')
    setOptionSquares({})
    return true
  }

  // Record a premove input
  const handlePremoveInput = (from, to, promotion) => {
    if (from === to) return
    const piece = game.get(from)
    if (!piece || piece.color !== myColor) return
    if (!promotion && requestPromotion(from, to, true)) return

    const newPremove = { from, to, promotion: promotion || 'q' }
    // Replace if this piece already had a premove, otherwise append to queue
    const filtered = premovesRef.current.filter((pm) => pm.from !== from)
    const newQueue = [...filtered, newPremove]

    premovesRef.current = newQueue
    setPremoves(newQueue)
    highlightPremoves(newQueue)
    setMoveFrom('')
  }

  const onSquareClick = (square) => {
    if (promotionMove) return
    const clickedPiece = game.get(square)

    // ---- NORMAL TURN ----
    if (isMyTurn) {
      if (!moveFrom) {
        if (clickedPiece && clickedPiece.color === game.turn()) {
          setMoveFrom(square)
          getMoveOptions(square)
        }
        return
      }

      if (clickedPiece && clickedPiece.color === game.turn() && square !== moveFrom) {
        setMoveFrom(square)
        getMoveOptions(square)
        return
      }

      if (square === moveFrom) {
        setMoveFrom('')
        setOptionSquares({})
        return
      }

      if (requestPromotion(moveFrom, square)) return
      const ok = onMove({ from: moveFrom, to: square, promotion: 'q' })
      if (ok) {
        setMoveFrom('')
        setOptionSquares({})
        if (onDismissHint) onDismissHint()
      }
      return
    }

    // ---- PREMOVE MODE (Opponent's turn) ----
    if (!moveFrom) {
      if (clickedPiece && clickedPiece.color === myColor) {
        setMoveFrom(square)
        getPremoveOptions(square)
      }
      return
    }

    if (clickedPiece && clickedPiece.color === myColor && square !== moveFrom) {
      setMoveFrom(square)
      getPremoveOptions(square)
      return
    }

    if (square === moveFrom) {
      setMoveFrom('')
      highlightPremoves(premovesRef.current)
      return
    }

    handlePremoveInput(moveFrom, square)
  }

  const onSquareRightClick = () => {
    cancelAllPremoves()
    if (onDismissHint) {
      onDismissHint()
    }
  }

  const onPieceDrop = (from, to) => {
    if (promotionMove) return false
    if (from === to) return false
    const piece = game.get(from)
    if (!piece) return false

    if (mode === 'local') {
      if (piece.color !== game.turn()) return false
      if (requestPromotion(from, to)) return false
      const ok = onMove({ from, to, promotion: 'q' })
      if (ok) {
        setMoveFrom('')
        setOptionSquares({})
        if (onDismissHint) onDismissHint()
      }
      return Boolean(ok)
    }

    // Normal move
    if (isMyTurn) {
      if (piece.color !== game.turn()) return false
      if (requestPromotion(from, to)) return false
      const ok = onMove({ from, to, promotion: 'q' })
      if (ok) {
        setMoveFrom('')
        setOptionSquares({})
        if (onDismissHint) onDismissHint()
      }
      return Boolean(ok)
    }

    // Premove
    if (piece.color === myColor) {
      handlePremoveInput(from, to)
    }
    return false
  }

  const choosePromotion = (promotion) => {
    if (!promotionMove) return
    const { from, to, premove } = promotionMove
    setPromotionMove(null)
    if (premove && !isMyTurn) {
      handlePremoveInput(from, to, promotion)
      return
    }
    const ok = onMove({ from, to, promotion })
    if (ok) {
      setMoveFrom('')
      setOptionSquares({})
      if (onDismissHint) onDismissHint()
    }
  }

  const isDraggablePiece = ({ piece }) => {
    if (promotionMove || game.isGameOver()) return false
    if (mode === 'local') {
      return piece[0] === game.turn()
    }
    return piece[0] === myColor
  }

  return (
    <div className="board-wrap">
      {topBar && <div className="board-player-bar top-bar">{topBar}</div>}
      <div className="board-inner">
        <Chessboard
          position={game.fen()}
          onSquareClick={onSquareClick}
          onSquareRightClick={onSquareRightClick}
          onPieceDrop={onPieceDrop}
          isDraggablePiece={isDraggablePiece}
          boardOrientation={orientation}
          customSquareStyles={customSquareStyles}
          customArrows={boardArrows}
          customArrowColor="rgb(245, 158, 11)"
          customDarkSquareStyle={BOARD_DARK}
          customLightSquareStyle={BOARD_LIGHT}
          arePiecesDraggable={true}
          autoPromoteToQueen={true}
          animationDuration={200}
        />
        {promotionMove && (
          <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label={lang === 'en' ? 'Choose promotion piece' : 'Chọn quân phong cấp'} onKeyDown={(event) => { if (event.key === 'Escape') setPromotionMove(null) }}>
            <div className="promotion-picker">
              <div className="promotion-picker-heading">
                <div>
                  <span className="promotion-eyebrow">{lang === 'en' ? 'Pawn promotion' : 'Phong cấp tốt'}</span>
                  <h3>{lang === 'en' ? 'Choose a piece' : 'Chọn quân cờ'}</h3>
                </div>
                <button type="button" className="promotion-cancel" onClick={() => setPromotionMove(null)} aria-label={lang === 'en' ? 'Cancel' : 'Hủy'}>
                  <X size={18} />
                </button>
              </div>
              <div className="promotion-options">
                {PROMOTION_CHOICES.map((choice) => (
                  <button key={choice.type} type="button" autoFocus={choice.type === 'q'} onClick={() => choosePromotion(choice.type)} aria-label={choice[lang]}>
                    <span className="promotion-piece" aria-hidden="true">{choice[promotionMove.color === 'w' ? 'white' : 'black']}</span>
                    <span className="promotion-label">{choice[lang]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {bottomBar && <div className="board-player-bar bottom-bar">{bottomBar}</div>}
      {premoves.length > 0 && (
        <div className="premove-active-banner">
          <span>
            <Zap size={14} className="inline-icon text-amber" /> Premove
            {premoves.length > 1 ? ` (${premoves.length})` : ''}:{' '}
            {premoves.map((p) => `${p.from} ➔ ${p.to}`).join(', ')}
          </span>
          <span className="premove-cancel-tip">(Chuột phải để hủy)</span>
        </div>
      )}
    </div>
  )
}
