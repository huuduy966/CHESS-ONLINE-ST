import { RotateCcw, Home } from 'lucide-react'
import { useLanguage } from '../utils/language.jsx'

export default function GameOverModal({ game, onRestart, onHome, customMessage }) {
  const { t } = useLanguage()
  if (!game.isGameOver() && !customMessage) return null
  let title = customMessage?.title || ''
  let subtitle = customMessage?.subtitle || ''
  let isCheckmate = false
  let isDraw = false

  if (!customMessage) {
    if (game.isCheckmate()) {
      isCheckmate = true
      title = t('checkmateTitle')
      subtitle = game.turn() === 'w' ? t('blackWonStatus') : t('whiteWonStatus')
    } else if (game.isDraw()) {
      isDraw = true
      title = t('drawMatch')
      if (game.isStalemate()) subtitle = t('stalemateTitle')
      else if (game.isThreefoldRepetition()) subtitle = t('threefoldTitle')
      else if (game.isInsufficientMaterial()) subtitle = t('insufficientTitle')
      else subtitle = t('drawMatch')
    }
  }

  const resultType = isCheckmate ? 'result-win' : 'result-draw'

  return (
    <div className="modal-overlay">
      <div className={`modal modern-result-modal ${resultType}`}>
        <div className="result-glow-aura"></div>

        <div className="result-header-box">
          <h2 className="result-main-title">{title}</h2>
          {subtitle && <p className="result-subtitle-note">{subtitle}</p>}
        </div>

        <div className="result-actions-stack">
          {onRestart && (
            <button className="btn btn-rematch-highlight" onClick={onRestart} type="button">
              <RotateCcw size={16} />
              <span>{t('playAgainLocal')}</span>
            </button>
          )}
          {onHome && (
            <button className="btn btn-home-return full-width" onClick={onHome} type="button">
              <Home size={16} className="inline-icon text-dim" />
              <span>{t('returnHomeDirect')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
