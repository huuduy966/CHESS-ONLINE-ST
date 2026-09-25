import { useEffect, useRef, useState } from 'react'
import { Copy, Check, ScrollText } from 'lucide-react'
import { PieceCircle } from './PieceCircle.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function MoveHistory({ history = [] }) {
  const { lang, t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const endRef = useRef(null)

  const rows = []
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] })
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length])

  const handleCopy = () => {
    if (!history.length) return
    let pgn = ''
    for (let i = 0; i < history.length; i += 2) {
      const num = i / 2 + 1
      pgn += `${num}. ${history[i]} ${history[i + 1] || ''} `
    }
    navigator.clipboard?.writeText(pgn.trim()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="move-history-card">
      <div className="move-history-table-header">
        <span className="col-num">#</span>
        <span className="col-piece">
          <PieceCircle color="w" size={12} style={{ marginRight: '4px' }} /> {t('turnWhite')}
        </span>
        <span className="col-piece">
          <PieceCircle color="b" size={12} style={{ marginRight: '4px' }} /> {t('turnBlack')}
        </span>
      </div>

      <div className="move-history-scroll-area">
        {rows.length === 0 ? (
          <div className="move-history-empty">
            <ScrollText size={22} style={{ opacity: 0.35 }} />
            <span>{lang === 'en' ? 'No moves yet' : 'Chưa có nước đi nào'}</span>
          </div>
        ) : (
          rows.map((r, idx) => {
            const isLatestWhite = r.w && !r.b && idx === rows.length - 1
            const isLatestBlack = r.b && idx === rows.length - 1
            return (
              <div className="move-history-row" key={r.n}>
                <span className="col-num">{r.n}.</span>
                <span className={`col-move ${isLatestWhite ? 'active-move' : ''}`}>{r.w}</span>
                <span className={`col-move ${isLatestBlack ? 'active-move' : ''}`}>{r.b || ''}</span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {rows.length > 0 && (
        <div className="move-history-footer">
          <span className="total-moves-label">
            {t('totalMoves')} <strong>{history.length}</strong>
          </span>
          <button
            type="button"
            className="btn-copy-moves"
            onClick={handleCopy}
            title={t('copyPgnBtn')}
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald" />
                <span>{t('copiedPgn')}</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>{t('copyPgnBtn')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
