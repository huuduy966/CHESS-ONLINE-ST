import { RotateCcw, Home, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { useLanguage } from '../utils/language.jsx'

export default function ResultModal({
  open,
  title, // 'Bạn thắng!' | 'Bạn thua' | 'Hòa cờ' | string
  subtitle, // VD: 'Bạn đã đầu hàng' | 'Chiếu hết'
  playerName,
  prevElo,
  delta, // số: cộng hoặc trừ
  isUnrated = false, // Ván cờ không tính điểm xếp hạng (VD: Chơi với máy)
  unratedTag,
  onRematch, // fn | null (null = ẩn nút)
  rematchDisabled,
  rematchLabel,
  onReview, // fn | null
  onHome,
}) {
  const { t } = useLanguage()
  if (!open) return null

  const newElo = prevElo != null && delta != null ? prevElo + delta : null
  const deltaSign = delta > 0 ? '+' : ''

  const isWin = title?.toLowerCase().includes('thắng') || title?.toLowerCase().includes('win')
  const isLoss = title?.toLowerCase().includes('thua') || title?.toLowerCase().includes('lost') || title?.toLowerCase().includes('loss')
  const isDraw = title?.toLowerCase().includes('hòa') || title?.toLowerCase().includes('draw')

  const resultType = isWin ? 'result-win' : isLoss ? 'result-loss' : 'result-draw'

  return (
    <div className="modal-overlay">
      <div className={`modal modern-result-modal ${resultType}`}>
        {/* Glowing Top Aura */}
        <div className="result-glow-aura"></div>

        {/* Title Header */}
        <div className="result-header-box">
          <h2 className="result-main-title">{title}</h2>
          {subtitle && <p className="result-subtitle-note">{subtitle}</p>}
        </div>

        {/* Player & Elo Summary Cards */}
        <div className="result-summary-card">
          {playerName && (
            <div className="result-info-tile">
              <span className="info-tile-label">{t('chessPlayerTag')}</span>
              <strong className="info-tile-val">{playerName}</strong>
            </div>
          )}

          {isUnrated ? (
            <div className="result-info-tile">
              <span className="info-tile-label">{t('gameModeLabel')}</span>
              <strong className="info-tile-val text-amber">{unratedTag || t('unratedMatchTag')}</strong>
            </div>
          ) : newElo != null ? (
            <div className="result-info-tile">
              <span className="info-tile-label">{t('eloRatingTitle')}</span>
              <div className="elo-change-row">
                <span className="elo-previous">{prevElo}</span>
                <span className="elo-arrow-sign">➔</span>
                <strong className="elo-current-val">{newElo}</strong>
                <span className={`elo-delta-tag ${delta > 0 ? 'delta-win' : delta < 0 ? 'delta-loss' : 'delta-draw'}`}>
                  {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : null}
                  {deltaSign}{delta}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="result-actions-stack">
          {onRematch && (
            <button
              className="btn btn-rematch-highlight"
              onClick={onRematch}
              disabled={rematchDisabled}
              type="button"
            >
              <RotateCcw size={16} />
              <span>{rematchLabel || t('rematchBtn')}</span>
            </button>
          )}

          <div className="result-secondary-buttons-row">
            {onReview && (
              <button className="btn btn-review-game" onClick={onReview} type="button">
                <Eye size={16} className="inline-icon text-cyan" />
                <span>{t('reviewMatchBtn')}</span>
              </button>
            )}
            {onHome && (
              <button className="btn btn-home-return" onClick={onHome} type="button">
                <Home size={16} className="inline-icon text-dim" />
                <span>{t('returnHomeBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
