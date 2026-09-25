import { useState, useMemo, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import { useNavigate, Link } from 'react-router-dom'
import { Users, RotateCcw, Undo2, Globe, ArrowRight, Lightbulb, Activity, ScrollText } from 'lucide-react'
import Board from '../components/Board.jsx'
import StatusBar from '../components/StatusBar.jsx'
import MoveHistory from '../components/MoveHistory.jsx'
import GameOverModal from '../components/GameOverModal.jsx'
import CapturedPieces from '../components/CapturedPieces.jsx'
import { PieceCircle } from '../components/PieceCircle.jsx'
import { playMoveSound } from '../utils/sound.js'
import { useLanguage } from '../utils/language.jsx'
import { useGameLock } from '../utils/gameLock.jsx'
import { getStockfishHint } from '../utils/stockfish.js'

export default function LocalGame() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { setGameLocked } = useGameLock()
  const [game, setGame] = useState(() => new Chess())
  const [, setTick] = useState(0)
  const [engineHint, setEngineHint] = useState(null)
  const [loadingHint, setLoadingHint] = useState(false)
  const history = useMemo(() => game.history(), [game, game.fen()])

  const isMatchActive = history.length > 0 && !game.isGameOver()

  useEffect(() => {
    setGameLocked(isMatchActive)
    return () => setGameLocked(false)
  }, [isMatchActive, setGameLocked])

  const onMove = useCallback(
    (move) => {
      try {
        const result = game.move(move)
        if (!result) return false
        playMoveSound(result, game)
        setEngineHint(null)
        setTick((t) => t + 1)
        return true
      } catch {
        return false
      }
    },
    [game]
  )

  const handleGetHint = async () => {
    if (game.isGameOver() || loadingHint) return
    if (engineHint) {
      setEngineHint(null)
      return
    }
    setLoadingHint(true)
    try {
      const hint = await getStockfishHint(game)
      if (hint) {
        setEngineHint(hint)
      }
    } catch (err) {
      console.error('[LocalGame] Hint error:', err)
    } finally {
      setLoadingHint(false)
    }
  }

  const undo = () => {
    game.undo()
    setEngineHint(null)
    setTick((t) => t + 1)
  }
  const reset = () => {
    setEngineHint(null)
    setGame(new Chess())
  }

  return (
    <div className="game-page">
      <div className="panel">
        <div className="panel-header-badge">
          <Users size={16} className="text-emerald" />
          <span>{t('localTag')}</span>
        </div>

        <h3>{t('localPassPlayTitle')}</h3>
        <p className="muted">
          {t('localPassPlayDesc')}
        </p>

        <div className="panel-actions-list">
          <button
            className="btn secondary"
            onClick={undo}
            disabled={game.history().length === 0}
          >
            <Undo2 size={16} /> {t('undoMoveBtn')}
          </button>
          <button className="btn danger" onClick={reset}>
            <RotateCcw size={16} /> {t('restartLocalMatch')}
          </button>
        </div>

        {/* Stockfish 19 Hint Section */}
        <div className="engine-hint-section">
          <button
            type="button"
            className="btn btn-hint"
            onClick={handleGetHint}
            disabled={game.isGameOver() || loadingHint}
          >
            <Lightbulb size={16} />
            <span>{loadingHint ? t('analyzingHint') : t('getHintBtn')}</span>
          </button>
        </div>

        <div className="friend-online-hint">
          <div className="hint-icon">
            <Globe size={18} className="text-cyan" />
          </div>
          <div className="hint-body">
            <strong>{t('remoteFriendTitle')}</strong>
            <p>{t('remoteFriendDesc')}</p>
            <Link to="/online" className="btn-link-sm">
              {t('createOnlineBtn')} <ArrowRight size={14} className="inline-icon" />
            </Link>
          </div>
        </div>
      </div>

      <Board
        game={game}
        onMove={onMove}
        mode="local"
        hint={engineHint}
        onDismissHint={() => setEngineHint(null)}
        topBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color="b" size={13} />
              <span className="board-player-name">{t('turnBlack')}</span>
              <CapturedPieces game={game} color="b" size={14} />
            </span>
          </div>
        }
        bottomBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color="w" size={13} />
              <span className="board-player-name">{t('turnWhite')}</span>
              <CapturedPieces game={game} color="w" size={14} />
            </span>
          </div>
        }
      />

      <div className="panel game-side-panel">
        <div className="panel-section-title">
          <Activity size={16} className="text-amber" />
          <h3>{t('matchStatusTitle')}</h3>
        </div>
        <StatusBar game={game} />
        <div className="panel-section-title" style={{ marginTop: '0.4rem' }}>
          <ScrollText size={16} className="text-cyan" />
          <h3>{t('moveHistoryTitle')}</h3>
        </div>
        <MoveHistory history={history} />
      </div>

      <GameOverModal game={game} onRestart={reset} onHome={() => navigate('/')} />
    </div>
  )
}
