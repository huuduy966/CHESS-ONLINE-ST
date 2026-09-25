import { useMemo } from 'react'

const STARTING_PIECES = { p: 8, n: 2, b: 2, r: 2, q: 1 }
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const PIECE_ORDER = ['q', 'r', 'b', 'n', 'p']

// Mini SVG Chess Piece Icons for Captured Display
function MiniPieceSvg({ type, pieceColor, size = 15 }) {
  const isWhite = pieceColor === 'w' || pieceColor === 'white'
  const fillColor = isWhite ? '#f8fafc' : '#1e293b'
  const strokeColor = isWhite ? '#94a3b8' : '#64748b'
  const eyeColor = isWhite ? '#475569' : '#cbd5e1'

  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="captured-piece-svg">
          <circle cx="12" cy="7" r="3.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <path
            d="M9.5 12c.5-1.5 4.5-1.5 5 0 .5 2 2 3.5 2 5.5H7.5c0-2 1.5-3.5 2-5.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect x="6.5" y="18.5" width="11" height="2.5" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
    case 'n': // Knight
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="captured-piece-svg">
          <path
            d="M18.5 19H5.5c0-1 1-1.5 2-2.5 0-.5-.5-2 0-3.5 0-1 1.5-2 2-3.5-.5-.5-1-1.5-.5-2.5 1-2 3.5-3 6.5-2.5.5.5.5 1.5.5 2 1.5 0 2.5 1 2.5 2.5 0 1-.5 1.5-1 2 .5 1.5 1.5 2.5 2 4.5.5 1.5.5 2 0 3z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <circle cx="10" cy="8.5" r="1" fill={eyeColor} />
          <rect x="5.5" y="19" width="13" height="2.5" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
    case 'b': // Bishop
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="captured-piece-svg">
          <circle cx="12" cy="5" r="1.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <path
            d="M12 7c-2.5 0-4 2-4 5 0 2 1.5 3.5 2 5.5h4c.5-2 2-3.5 2-5.5 0-3-1.5-5-4-5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <path d="M11 9.5l2 2m-2 0l2-2" stroke={eyeColor} strokeWidth="1.2" strokeLinecap="round" />
          <rect x="6" y="18.5" width="12" height="2.5" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
    case 'r': // Rook
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="captured-piece-svg">
          <path
            d="M7 6h2v2h2V6h2v2h2V6h2v3.5l-1.5 1.5v6H8.5V11L7 9.5V6z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect x="5.5" y="18" width="13" height="3" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
    case 'q': // Queen
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className="captured-piece-svg">
          <circle cx="6" cy="6.5" r="1.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="9" cy="5" r="1.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="12" cy="4.5" r="1.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="15" cy="5" r="1.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="18" cy="6.5" r="1.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <path d="M6 8l2 8h8l2-8-3 3-3-4-3 4-3-3z" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <rect x="6" y="17.5" width="12" height="2.5" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
    default:
      return null
  }
}

/**
 * Calculates captured pieces and material differences for White and Black.
 */
export function calculateCapturedPieces(game) {
  if (!game) {
    return {
      w: { pieces: [], score: 0, diff: 0 },
      b: { pieces: [], score: 0, diff: 0 }
    }
  }

  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  }

  try {
    const board = game.board()
    for (const row of board) {
      for (const sq of row) {
        if (sq && sq.type !== 'k') {
          current[sq.color][sq.type] = (current[sq.color][sq.type] || 0) + 1
        }
      }
    }
  } catch {
    return {
      w: { pieces: [], score: 0, diff: 0 },
      b: { pieces: [], score: 0, diff: 0 }
    }
  }

  // Black pieces captured by White:
  const capturedByWhite = []
  // White pieces captured by Black:
  const capturedByBlack = []

  let whiteScore = 0
  let blackScore = 0

  for (const type of PIECE_ORDER) {
    const lostByBlack = Math.max(0, (STARTING_PIECES[type] || 0) - (current.b[type] || 0))
    for (let i = 0; i < lostByBlack; i++) {
      capturedByWhite.push(type)
      whiteScore += PIECE_VALUES[type]
    }

    const lostByWhite = Math.max(0, (STARTING_PIECES[type] || 0) - (current.w[type] || 0))
    for (let i = 0; i < lostByWhite; i++) {
      capturedByBlack.push(type)
      blackScore += PIECE_VALUES[type]
    }
  }

  return {
    w: {
      pieces: capturedByWhite, // Black pieces captured by White
      score: whiteScore,
      diff: whiteScore - blackScore
    },
    b: {
      pieces: capturedByBlack, // White pieces captured by Black
      score: blackScore,
      diff: blackScore - whiteScore
    }
  }
}

/**
 * Component to display captured pieces by a specific player (color 'w' or 'b').
 * For White: displays captured Black pieces.
 * For Black: displays captured White pieces.
 */
export default function CapturedPieces({ game, color = 'w', size = 15, className = '' }) {
  const normColor = color === 'white' ? 'w' : color === 'black' ? 'b' : color

  const capturedData = useMemo(() => {
    return calculateCapturedPieces(game)
  }, [game, game?.fen?.()])

  const myData = capturedData[normColor] || { pieces: [], diff: 0 }
  // The pieces captured by this player belong to the OPPOSITE color
  const targetPieceColor = normColor === 'w' ? 'b' : 'w'

  if (!myData.pieces || myData.pieces.length === 0) {
    return null
  }

  return (
    <div className={`captured-pieces-strip ${className}`}>
      <div className="captured-pieces-icons-list">
        {myData.pieces.map((pType, idx) => (
          <span
            key={idx}
            className="captured-piece-wrapper"
            title={`${targetPieceColor === 'b' ? 'Đen' : 'Trắng'} ${pType.toUpperCase()}`}
          >
            <MiniPieceSvg type={pType} pieceColor={targetPieceColor} size={size} />
          </span>
        ))}
      </div>

      {myData.diff > 0 && (
        <span className="material-advantage-pill" title={`Ưu thế vật chất: +${myData.diff}`}>
          +{myData.diff}
        </span>
      )}
    </div>
  )
}
