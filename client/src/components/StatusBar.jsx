import { Swords, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { PieceCircle } from './PieceCircle.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function StatusBar({ game, extraText, myTurn, myColor }) {
  const { t } = useLanguage()
  const isOver = game.isGameOver()
  const inCheck = game.inCheck()
  const turn = game.turn()
  const historyLen = game.history ? game.history().length : 0
  const moveNumber = Math.floor(historyLen / 2) + 1

  let statusTitle = ''
  let statusSub = extraText || ''
  let statusBadge = turn === 'w' ? t('turnWhiteStatus') : t('turnBlackStatus')
  let stateType = turn === 'w' ? 'turn-white' : 'turn-black'

  if (isOver) {
    stateType = 'state-gameover'
    statusBadge = t('gameOverStatus')
    if (game.isCheckmate()) {
      statusTitle = t('checkmateTitle')
      statusSub = turn === 'w' ? t('blackWonStatus') : t('whiteWonStatus')
    } else if (game.isStalemate()) {
      statusTitle = t('stalemateTitle')
      statusSub = `${t('drawMatch')} (${t('stalemateTitle')})`
    } else if (game.isThreefoldRepetition()) {
      statusTitle = t('threefoldTitle')
      statusSub = t('drawMatch')
    } else if (game.isInsufficientMaterial()) {
      statusTitle = t('insufficientTitle')
      statusSub = t('drawMatch')
    } else {
      statusTitle = t('drawMatch')
      statusSub = t('gameOverStatus')
    }
  } else {
    if (inCheck) {
      stateType = 'state-check'
      statusTitle = `${turn === 'w' ? t('turnWhite') : t('turnBlack')} ${t('inCheckNotice')}`
    } else {
      statusTitle = `${t('turnTurnOf')} ${turn === 'w' ? t('turnWhite') : t('turnBlack')}`
    }
  }

  const isYourTurn = myTurn != null ? myTurn : (myColor ? turn === myColor : false)

  return (
    <div className={`status-widget-box ${stateType} ${isYourTurn && !isOver ? 'is-my-turn' : ''}`}>
      <div className="status-widget-top">
        <div className="status-turn-pill">
          <PieceCircle color={turn} size={11} style={{ marginRight: '2px' }} />
          <span className="status-turn-text">{statusBadge}</span>
        </div>

        <div className="status-top-right-badges">
          {historyLen > 0 && !isOver && (
            <span className="status-move-counter-pill">
              {t('moveNumberPrefix')} #{moveNumber}
            </span>
          )}
          {inCheck && !isOver && (
            <span className="status-check-tag">
              <AlertTriangle size={13} className="inline-icon" /> {t('inCheckTag')}
            </span>
          )}
        </div>
      </div>

      <div className="status-widget-main">
        <h4 className="status-title-text">{statusTitle}</h4>
        {statusSub && (
          <div className="status-sub-text">
            {isYourTurn && !isOver ? (
              <span className="status-turn-yours">
                <span className="turn-pulse-dot"></span>
                <span>{statusSub}</span>
              </span>
            ) : (
              <span className="status-sub-muted">{statusSub}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
