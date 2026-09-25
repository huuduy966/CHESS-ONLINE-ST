export function PieceCircle({ color = 'white', size = 14, className = '', style = {} }) {
  const isWhite = color === 'white' || color === 'w'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`piece-circle-svg ${isWhite ? 'piece-white' : 'piece-black'} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.15em',
        borderRadius: '50%',
        flexShrink: 0,
        ...style
      }}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={isWhite ? '#f8fafc' : '#1e293b'}
        stroke={isWhite ? '#94a3b8' : '#0f172a'}
        strokeWidth="2"
      />
    </svg>
  )
}

export function SplitCircle({ size = 14, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`piece-circle-svg piece-split ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.15em',
        borderRadius: '50%',
        flexShrink: 0,
        ...style
      }}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth="2"
      />
      <path
        d="M12 3 A9 9 0 0 0 12 21 Z"
        fill="#f8fafc"
      />
    </svg>
  )
}

export function ColorDot({ color = 'green', size = 10, className = '', style = {} }) {
  const colorMap = {
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#a855f7'
  }
  const fill = colorMap[color] || color
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`color-dot-svg ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: '-0.1em',
        marginRight: '6px',
        flexShrink: 0,
        ...style
      }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" fill={fill} />
    </svg>
  )
}

export function KnightIcon({ size = 22, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      <path d="M19 22H5v-2h14v2M19 19c-1.5-2-1.8-3.5-1.9-5.5-.1-1.3-.8-2.6-1.8-3.5 0 0 .7-.8.5-1.9-.3-1.4-1.6-2.5-3.1-2.4-1.3.1-2.3 1-2.5 2.3-.1.6 0 1.2.2 1.7-.8-.4-1.8-.4-2.6.1-1.1.7-1.6 2-1.3 3.3.3 1.3 1.3 2.3 2.6 2.5v.4c0 1.3.6 2.5 1.7 3.2L7 19h12z" />
    </svg>
  )
}
