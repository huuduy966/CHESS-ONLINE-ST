import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Brain,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Zap,
  Flame,
  Award,
  ShieldAlert,
  ChevronRight,
  Fish,
  Activity,
  CheckCircle2,
  Trophy,
  Swords,
  ScrollText
} from 'lucide-react'
import Board from '../components/Board.jsx'
import StatusBar from '../components/StatusBar.jsx'
import MoveHistory from '../components/MoveHistory.jsx'
import ResultModal from '../components/ResultModal.jsx'
import { PieceCircle, ColorDot, SplitCircle } from '../components/PieceCircle.jsx'
import CapturedPieces from '../components/CapturedPieces.jsx'
import { getStockfishMove, getStockfishHint, getStockfishEval } from '../utils/stockfish.js'
import { useAuth } from '../utils/auth.jsx'
import { useGameLock } from '../utils/gameLock.jsx'
import { useLanguage } from '../utils/language.jsx'
import { scoresFor } from '../utils/elo.js'
import { BOTS, DEFAULT_BOT_ID, getBot } from '../utils/bots.js'
import { playMoveSound } from '../utils/sound.js'

export default function AIGame() {
  const navigate = useNavigate()
  const { user, recordGame } = useAuth()
  const { setGameLocked, setResignHandler } = useGameLock()
  const { t, lang } = useLanguage()
  const [game, setGame] = useState(() => new Chess())
  const [sideOption, setSideOption] = useState(() => localStorage.getItem('chess-ai-side') || 'w')
  const [playerColor, setPlayerColor] = useState('w')
  const [botId, setBotId] = useState(null)
  const [gameType, setGameType] = useState(() => {
    try {
      return localStorage.getItem('chess-ai-gametype') || 'practice'
    } catch {
      return 'practice'
    }
  })
  const [thinking, setThinking] = useState(false)
  const [, setTick] = useState(0)
  const [eloResult, setEloResult] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [outcomeLabel, setOutcomeLabel] = useState('')
  const [savedMoves, setSavedMoves] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [engineHint, setEngineHint] = useState(null)
  const [loadingHint, setLoadingHint] = useState(false)
  const [stockfishEval, setStockfishEval] = useState({ score: 0, mate: null, depth: 0 })
  const recordedRef = useRef(false)
  const history = useMemo(() => game.history(), [game, game.fen()])
  const gameRef = useRef(game)
  gameRef.current = game

  const bot = useMemo(() => (botId ? getBot(botId) : null), [botId])
  const aiTurn = !!bot && game.turn() !== playerColor && !game.isGameOver()

  const isMatchActive = Boolean(
    bot &&
    user &&
    game.history().length > 0 &&
    !game.isGameOver() &&
    !showResult &&
    !recordedRef.current
  )

  useEffect(() => {
    if (botId) localStorage.setItem('chess-bot', botId)
  }, [botId])

  useEffect(() => {
    try {
      localStorage.setItem('chess-ai-gametype', gameType)
    } catch {}
  }, [gameType])

  // Stockfish AI Move calculation
  useEffect(() => {
    if (!aiTurn || !bot) return
    setThinking(true)
    setEngineHint(null)

    let isMounted = true

    const runStockfish = async () => {
      try {
        const result = await getStockfishMove(gameRef.current, bot)
        if (!isMounted) return

        if (result && result.from && result.to) {
          const moveAttempt = gameRef.current.move({
            from: result.from,
            to: result.to,
            promotion: result.promotion || 'q'
          })

          if (moveAttempt) {
            playMoveSound(moveAttempt, gameRef.current)
            if (result.evalScore !== undefined) {
              setStockfishEval({
                score: typeof result.evalScore === 'number' && Math.abs(result.evalScore) > 200 ? result.evalScore / 100 : result.evalScore,
                mate: result.mate,
                depth: result.depth || bot.depth
              })
            }
            setTick((t) => t + 1)
          }
        }
      } catch (err) {
        console.error('[AIGame] Stockfish execution error:', err)
      } finally {
        if (isMounted) setThinking(false)
      }
    }

    runStockfish()

    return () => {
      isMounted = false
    }
  }, [aiTurn, bot, game.fen()])

  // Game End and ELO evaluation
  useEffect(() => {
    if (!bot || !game.isGameOver() || recordedRef.current) return
    const moves = game.history().slice()
    if (moves.length === 0) return
    recordedRef.current = true

    let resultOutcome
    let label
    if (game.isCheckmate()) {
      resultOutcome = game.turn() === 'w' ? 'black_win' : 'white_win'
      label = t('checkmateSub')
    } else if (game.isStalemate()) {
      resultOutcome = 'draw'
      label = t('stalemateSub')
    } else if (game.isDraw()) {
      resultOutcome = 'draw'
      label = t('drawMatch')
    } else return

    setSavedMoves(moves)
    const { w, b } = scoresFor(resultOutcome)
    const myScore = playerColor === 'w' ? w : b
    let myOut
    if (resultOutcome === 'draw') myOut = 'draw'
    else if (
      (resultOutcome === 'white_win' && playerColor === 'w') ||
      (resultOutcome === 'black_win' && playerColor === 'b')
    )
      myOut = 'win'
    else myOut = 'loss'
    setOutcome(myOut)
    setOutcomeLabel(label)
    setShowResult(true)

    if (user) {
      const r = recordGame(myScore, bot.elo, 'ai', {
        opponent: bot.name,
        oppElo: bot.elo,
        moves,
        whiteName: playerColor === 'w' ? user : bot.name,
        blackName: playerColor === 'b' ? user : bot.name,
        myColor: playerColor,
        gameType
      })
      if (r) setEloResult(r)
    }
  }, [game, game.fen(), user, recordGame, playerColor, bot])

  const onMove = useCallback(
    (move) => {
      if (game.turn() !== playerColor || thinking) return false
      try {
        const result = game.move(move)
        if (!result) return false
        playMoveSound(result, game)
        setEngineHint(null)

        // Cập nhật đánh giá thế cờ trực tiếp từ đầu não Stockfish 19
        getStockfishEval(game.fen(), 10, 200).then((res) => {
          if (res && res.score !== undefined) {
            setStockfishEval({
              score: res.score,
              mate: res.mate,
              depth: res.depth
            })
          }
        })

        setTick((t) => t + 1)
        return true
      } catch {
        return false
      }
    },
    [game, playerColor, thinking]
  )

  const reset = () => {
    recordedRef.current = false
    setEloResult(null)
    setOutcome(null)
    setOutcomeLabel('')
    setSavedMoves(null)
    setShowResult(false)
    setEngineHint(null)
    setStockfishEval({ score: 0, mate: null, depth: 0 })
    setGame(new Chess())
  }

  // Đầu hàng trong trận đấu với Bot (trừ Elo ngay lập tức và lưu ván đấu)
  const handleResign = () => {
    if (!bot || recordedRef.current || game.history().length === 0 || game.isGameOver()) return
    recordedRef.current = true
    const currentMoves = game.history().slice()
    setSavedMoves(currentMoves)
    setOutcome('loss')
    setOutcomeLabel(t('youResignedSub'))
    setShowResult(true)

    if (user) {
      const r = recordGame(0, bot.elo, 'ai', {
        opponent: bot.name,
        oppElo: bot.elo,
        moves: currentMoves,
        whiteName: playerColor === 'w' ? user : bot.name,
        blackName: playerColor === 'b' ? user : bot.name,
        myColor: playerColor,
        gameType
      })
      if (r) setEloResult(r)
    }
  }

  // Rời trận hoặc bắt đầu lại khi trận đấu đang diễn ra sẽ bị tính là đầu hàng, lưu đầy đủ moves
  const handleForfeitAndAct = (actionFn) => {
    if (user && bot && !recordedRef.current && game.history().length > 0 && !game.isGameOver()) {
      recordedRef.current = true
      const currentMoves = game.history().slice()
      recordGame(0, bot.elo, 'ai', {
        opponent: bot.name,
        oppElo: bot.elo,
        moves: currentMoves,
        whiteName: playerColor === 'w' ? user : bot.name,
        blackName: playerColor === 'b' ? user : bot.name,
        myColor: playerColor,
        gameType
      })
    }
    reset()
    actionFn?.()
  }

  const resignAndLeave = useCallback(() => {
    if (user && bot && !recordedRef.current && gameRef.current.history().length > 0 && !gameRef.current.isGameOver()) {
      recordedRef.current = true
      const currentMoves = gameRef.current.history().slice()
      recordGame(0, bot.elo, 'ai', {
        opponent: bot.name,
        oppElo: bot.elo,
        moves: currentMoves,
        whiteName: playerColor === 'w' ? user : bot.name,
        blackName: playerColor === 'b' ? user : bot.name,
        myColor: playerColor,
        gameType
      })
    }
    reset()
  }, [user, bot, playerColor, recordGame, gameType])

  // Lock navigation during active bot match
  useEffect(() => {
    setGameLocked(isMatchActive)
    if (isMatchActive) {
      setResignHandler(resignAndLeave)
    } else {
      setResignHandler(null)
    }
    return () => {
      setGameLocked(false)
      setResignHandler(null)
    }
  }, [isMatchActive, setGameLocked, setResignHandler, resignAndLeave])

  // Unload protection for bot match
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isMatchActive && !recordedRef.current) {
        recordedRef.current = true
        recordGame(0, bot.elo, 'ai', {
          opponent: bot.name,
          oppElo: bot.elo,
          moves: gameRef.current.history().slice(),
          whiteName: playerColor === 'w' ? user : bot.name,
          blackName: playerColor === 'b' ? user : bot.name,
          myColor: playerColor,
          gameType
        })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isMatchActive, bot, playerColor, user, recordGame, gameType])

  const swapColor = () => {
    handleForfeitAndAct(() => {
      setPlayerColor((c) => (c === 'w' ? 'b' : 'w'))
    })
  }

  const rematch = () => {
    if (sideOption === 'random') {
      setPlayerColor(Math.random() < 0.5 ? 'w' : 'b')
    } else {
      setPlayerColor((c) => (c === 'w' ? 'b' : 'w'))
    }
    reset()
  }

  const handleSelectBot = (id) => {
    let chosenColor = sideOption
    if (sideOption === 'random') {
      chosenColor = Math.random() < 0.5 ? 'w' : 'b'
    }
    setPlayerColor(chosenColor)
    setBotId(id)
  }

  // Request best move hint from Stockfish 19
  const handleGetHint = async () => {
    if (gameType !== 'practice') return
    if (game.isGameOver() || thinking || loadingHint) return
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
      console.error('[AIGame] Hint error:', err)
    } finally {
      setLoadingHint(false)
    }
  }

  const resultTitle =
    outcome === 'win' ? 'Bạn thắng!' : outcome === 'loss' ? 'Bạn thua' : outcome === 'draw' ? 'Hòa cờ' : 'Kết thúc'

  // =========================================================
  // BOT SELECTION SCREEN (STOCKFISH 19)
  // =========================================================
  if (!bot) {
    return (
      <div className="lobby">
        <div className="lobby-card bot-selection-card">
          <div className="stockfish-brand-badge">
            <Fish size={18} className="text-cyan" />
            <span>{t('botSelectBrand')}</span>
          </div>

          <h2>{t('botSelectTitle')}</h2>
          <p className="muted">
            {t('botSelectDesc')}
          </p>

          {/* Game Type Selector: Tập luyện vs Thách đấu */}
          <div className="ai-mode-selector-section">
            <label className="mode-section-label">{t('aiGameTypeTitle')}</label>
            <div className="ai-mode-grid">
              <button
                type="button"
                className={`ai-mode-card ${gameType === 'practice' ? 'active' : ''}`}
                onClick={() => setGameType('practice')}
              >
                <div className="ai-mode-card-header">
                  <div className="ai-mode-icon-box practice-icon">
                    <Lightbulb size={20} />
                  </div>
                  <div className="ai-mode-text">
                    <strong>{t('practiceModeTitle')}</strong>
                    <span className="ai-mode-badge practice-badge">{t('practiceModeBadge')}</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`ai-mode-card challenge-card ${gameType === 'challenge' ? 'active' : ''}`}
                onClick={() => setGameType('challenge')}
              >
                <div className="ai-mode-card-header">
                  <div className="ai-mode-icon-box challenge-icon">
                    <Swords size={20} />
                  </div>
                  <div className="ai-mode-text">
                    <strong>{t('challengeModeTitle')}</strong>
                    <span className="ai-mode-badge challenge-badge">{t('challengeModeBadge')}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Stockfish Bot Grid */}
          <div className="bot-grid-enhanced" style={{ marginTop: '1rem' }}>
            {BOTS.map((b) => {
              const botTitle = lang === 'en' ? (b.titleEn || b.title) : b.title
              const botDesc = lang === 'en' ? (b.descEn || b.desc) : b.desc
              const tierBadge =
                b.tier === 'beginner'
                  ? { label: botTitle, color: 'tier-green', dot: 'green' }
                  : b.tier === 'intermediate'
                  ? { label: botTitle, color: 'tier-yellow', dot: 'yellow' }
                  : b.tier === 'advanced'
                  ? { label: botTitle, color: 'tier-orange', dot: 'orange' }
                  : { label: botTitle, color: 'tier-purple', dot: 'purple' }

              return (
                <button
                  key={b.id}
                  className="bot-card-btn stockfish-bot-card"
                  onClick={() => handleSelectBot(b.id)}
                  type="button"
                >
                  <div className="bot-card-top">
                    <div className="bot-avatar-badge stockfish-avatar-glow">
                      <Fish size={24} className="text-cyan" />
                    </div>
                    <div className="bot-info-meta">
                      <span className="bot-card-name">{b.name}</span>
                      <span className={`bot-tier-badge ${tierBadge.color}`}>
                        <ColorDot color={tierBadge.dot} size={8} />
                        {tierBadge.label}
                      </span>
                    </div>
                  </div>

                  <p className="bot-desc-short">{botDesc}</p>

                  <div className="bot-card-bottom">
                    <span className="bot-card-elo">
                      <Trophy size={13} className="inline-icon text-yellow" />{' '}
                      <strong>{b.elo}</strong> Elo
                    </span>
                    <span className="bot-depth-meta">
                      Skill {b.skillLevel} · {t('depthPlyLabel')} {b.depth}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Color Selector with Random Option */}
          <div className="color-selector-box">
            <label className="muted">{t('chooseSideLabel')}</label>
            <div className="color-toggle-btns">
              <button
                type="button"
                className={`color-btn ${sideOption === 'w' ? 'active' : ''}`}
                onClick={() => {
                  setSideOption('w')
                  try { localStorage.setItem('chess-ai-side', 'w') } catch {}
                  setPlayerColor('w')
                }}
              >
                <PieceCircle color="white" size={15} style={{ marginRight: '6px' }} />
                {t('playWhiteFirst')}
              </button>

              <button
                type="button"
                className={`color-btn ${sideOption === 'random' ? 'active' : ''}`}
                onClick={() => {
                  setSideOption('random')
                  try { localStorage.setItem('chess-ai-side', 'random') } catch {}
                }}
              >
                <SplitCircle size={15} style={{ marginRight: '6px' }} />
                {t('playRandomSide')}
              </button>

              <button
                type="button"
                className={`color-btn ${sideOption === 'b' ? 'active' : ''}`}
                onClick={() => {
                  setSideOption('b')
                  try { localStorage.setItem('chess-ai-side', 'b') } catch {}
                  setPlayerColor('b')
                }}
              >
                <PieceCircle color="black" size={15} style={{ marginRight: '6px' }} />
                {t('playBlackSecond')}
              </button>
            </div>
          </div>

          {!user && (
            <p className="muted auth-notice">
              <Lightbulb size={16} className="inline-icon text-amber" />{' '}
              <em>{t('loginEloNoticeAI')}</em>
            </p>
          )}
        </div>
      </div>
    )
  }

  // =========================================================
  // ACTIVE MATCH SCREEN (POWERED BY STOCKFISH 19)
  // =========================================================
  const displayScore = stockfishEval.score || 0
  const evalLabel = stockfishEval.mate
    ? `M${Math.abs(stockfishEval.mate)} (${stockfishEval.mate > 0 ? t('whiteMates') : t('blackMates')})`
    : displayScore > 0
    ? `+${displayScore.toFixed(1)} (${t('whiteAdvantage')})`
    : displayScore < 0
    ? `${Math.abs(displayScore).toFixed(1)} (${t('blackAdvantage')})`
    : `0.0 (${t('equalEval')})`

  const whitePercent = stockfishEval.mate
    ? stockfishEval.mate > 0
      ? 100
      : 0
    : Math.min(97, Math.max(3, 50 + 50 * (2 / (1 + Math.exp(-0.35 * displayScore)) - 1)))
  const blackPercent = 100 - whitePercent

  return (
    <div className="game-page">
      {/* Left Panel: Stockfish Info, Evaluation, Actions */}
      <div className="panel">
        <div className="panel-header-row">
          <div className="panel-header-badge">
            <Fish size={16} className="text-cyan" />
            <span>Stockfish 19 Engine</span>
          </div>
          <span className={`ai-match-mode-pill ${gameType}`}>
            {gameType === 'practice' ? <Lightbulb size={13} /> : <Swords size={13} />}
            <span>{gameType === 'practice' ? t('practiceModeTitle') : t('challengeModeTitle')}</span>
          </span>
        </div>

        {/* Opponent Card */}
        <div className="opponent-profile-card">
          <div className="opponent-avatar">
            <Fish size={24} className="text-cyan" />
          </div>
          <div className="opponent-meta">
            <h3>{bot.name}</h3>
            <div className="opponent-badges">
              <span className="elo-pill">
                <Trophy size={13} className="inline-icon text-yellow" /> {bot.elo} Elo
              </span>
              <span className="depth-pill">Skill {bot.skillLevel}</span>
              <span className="depth-pill">{t('depthPlyLabel')} {stockfishEval.depth || bot.depth} ply</span>
            </div>
            <CapturedPieces game={game} color={playerColor === 'w' ? 'b' : 'w'} size={15} />
          </div>
        </div>

        {/* Stockfish Real-time Evaluation Bar */}
        <div className="engine-eval-box">
          <div className="eval-header">
            <span>{t('sf19EvalTitle')}</span>
            <strong>{evalLabel}</strong>
          </div>
          <div className="eval-meter-track dual-color-track">
            {/* White side */}
            <div
              className="eval-bar-white"
              style={{ width: `${whitePercent}%` }}
              title={`${t('turnWhite')}: ${whitePercent.toFixed(1)}%`}
            ></div>
            {/* Black side */}
            <div
              className="eval-bar-black"
              style={{ width: `${blackPercent}%` }}
              title={`${t('turnBlack')}: ${blackPercent.toFixed(1)}%`}
            ></div>
          </div>
          <div className="eval-meter-labels">
            <span className="label-white-side">
              <span className="dot-side-white"></span> {t('turnWhite')}: {whitePercent.toFixed(0)}%
            </span>
            <span className="label-black-side">
              {t('turnBlack')}: {blackPercent.toFixed(0)}% <span className="dot-side-black"></span>
            </span>
          </div>
        </div>

        {/* Stockfish 19 Hint Section - Chỉ có trong chế độ Tập luyện */}
        {gameType === 'practice' && (
          <div className="engine-hint-section">
            <button
              type="button"
              className="btn btn-hint"
              onClick={handleGetHint}
              disabled={aiTurn || thinking || game.isGameOver() || loadingHint}
            >
              <Lightbulb size={16} />
              <span>{loadingHint ? t('analyzingHint') : t('getHintBtn')}</span>
            </button>
          </div>
        )}

        {/* Control Actions */}
        <div className="panel-actions-list">
          <button
            className="btn danger"
            onClick={handleResign}
            disabled={game.history().length === 0 || game.isGameOver()}
          >
            {t('resign')}
          </button>

          {/* Trong chế độ Thách đấu: Không có đổi quân, không bắt đầu lại, chỉ có đầu hàng */}
          {gameType === 'practice' ? (
            <>
              <button className="btn secondary" onClick={() => handleForfeitAndAct(() => setBotId(null))}>
                {t('changeLevel')}
              </button>
              <button className="btn secondary" onClick={swapColor}>
                {playerColor === 'w' ? (
                  <>
                    <PieceCircle color="white" size={14} style={{ marginRight: '6px' }} />
                    {t('swapSideWhite')}
                  </>
                ) : (
                  <>
                    <PieceCircle color="black" size={14} style={{ marginRight: '6px' }} />
                    {t('swapSideBlack')}
                  </>
                )}
              </button>
              <button className="btn secondary" onClick={() => handleForfeitAndAct()}>
                <RotateCcw size={16} /> {t('restartGame')}
              </button>
            </>
          ) : (
            game.isGameOver() && (
              <button className="btn secondary" onClick={() => setBotId(null)}>
                {t('changeLevel')}
              </button>
            )
          )}
        </div>

        {!user && (
          <p className="muted panel-note">
            {t('loginEloNoticeAI')}
          </p>
        )}
      </div>

      {/* Center: Chessboard */}
      <Board
        game={game}
        onMove={onMove}
        orientation={playerColor === 'w' ? 'white' : 'black'}
        disabled={aiTurn || thinking}
        hint={gameType === 'practice' ? engineHint : null}
        onDismissHint={() => setEngineHint(null)}
        topBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color={playerColor === 'w' ? 'b' : 'w'} size={13} />
              <span className="board-player-name">{bot.name}</span>
              <span className="board-player-elo">({bot.elo})</span>
              <CapturedPieces game={game} color={playerColor === 'w' ? 'b' : 'w'} size={14} />
            </span>
          </div>
        }
        bottomBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color={playerColor} size={13} />
              <span className="board-player-name">{user || 'Bạn'}</span>
              <span className="player-you-tag">{t('youIndicator')}</span>
              <CapturedPieces game={game} color={playerColor} size={14} />
            </span>
          </div>
        }
      />

      {/* Right Panel: Game Status & Move History */}
      <div className="panel game-side-panel">
        <div className="panel-section-title">
          <Activity size={16} className="text-amber" />
          <h3>{t('matchStatusTitle')}</h3>
        </div>
        <StatusBar
          game={game}
          myTurn={playerColor === game.turn() && !thinking}
          myColor={playerColor}
          extraText={
            thinking ? (
              <span className="thinking-text">
                <span className="pulsing-radar-dot"></span>
                {t('sfThinkingText')}
              </span>
            ) : null
          }
        />

        <div className="panel-section-title" style={{ marginTop: '0.4rem' }}>
          <ScrollText size={16} className="text-cyan" />
          <h3>{t('moveHistoryTitle')}</h3>
        </div>
        <MoveHistory history={history} />
      </div>

      {/* Result Modal */}
      <ResultModal
        open={showResult}
        title={outcome === 'win' ? t('youWon') : outcome === 'loss' ? t('youLost') : outcome === 'draw' ? t('drawMatch') : t('gameOver')}
        subtitle={outcomeLabel}
        playerName={user || 'Player'}
        prevElo={null}
        delta={null}
        isUnrated={true}
        unratedTag={gameType === 'challenge' ? t('challengeModeTag') : t('practiceModeTag')}
        onRematch={rematch}
        rematchLabel={t('rematchSwapColor')}
        onReview={
          savedMoves && savedMoves.length > 0
            ? () => {
                navigate('/review', {
                  state: {
                    sanMoves: savedMoves,
                    whiteName: playerColor === 'w' ? user || 'Player' : bot.name,
                    blackName: playerColor === 'b' ? user || 'Player' : bot.name,
                    myColor: playerColor
                  }
                })
              }
            : null
        }
        onHome={() => navigate('/')}
      />
    </div>
  )
}
