import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Chess } from 'chess.js'
import Board from '../components/Board.jsx'
import StatusBar from '../components/StatusBar.jsx'
import MoveHistory from '../components/MoveHistory.jsx'
import ResultModal from '../components/ResultModal.jsx'
import Clock from '../components/Clock.jsx'
import CapturedPieces from '../components/CapturedPieces.jsx'
import { PieceCircle } from '../components/PieceCircle.jsx'
import { MessageSquare, Send, Activity, Info, ScrollText, Columns, X, Smile } from 'lucide-react'
import { playMoveSound, sfx } from '../utils/sound.js'
import { socket } from '../utils/socket.js'
import { useAuth } from '../utils/auth.jsx'
import { DEFAULT_ELO, scoresFor } from '../utils/elo.js'
import { useGameLock } from '../utils/gameLock.jsx'
import { useLanguage } from '../utils/language.jsx'

const QUICK_EMOJIS = ['♟️', '👑', '🏆', '🤝', '🔥', '👏', '😅', '👍', '🎯', '⚡']

export default function OnlineGame() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, recordGame, updateLastGameMoves } = useAuth()
  const { setGameLocked, setResignHandler, requestNavigation } = useGameLock()
  const { t } = useLanguage()
  const [state, setState] = useState(null)
  const [color, setColor] = useState(() => location.state?.initialColor || null)
  const [error, setError] = useState('')
  const [chat, setChat] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [resignedBy, setResignedBy] = useState(null)
  const [eloResult, setEloResult] = useState(null)
  const [outcome, setOutcome] = useState(null)         // 'win' | 'loss' | 'draw'
  const [outcomeLabel, setOutcomeLabel] = useState('') // subtitle
  const [rematchState, setRematchState] = useState('idle') // idle | sent | received | declined
  const [savedMoves, setSavedMoves] = useState(null)   // SAN list để xem lại
  const [showResult, setShowResult] = useState(false)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'moves' | 'split'
  const [unreadCount, setUnreadCount] = useState(0)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const recordedRef = useRef(false)
  const chatEndRef = useRef(null)

  // Track latest color and state via refs to avoid stale closures
  const colorRef = useRef(color)
  colorRef.current = color
  const stateRef = useRef(state)
  stateRef.current = state

  const game = useMemo(() => {
    if (!state) return new Chess()
    try { return new Chess(state.fen) } catch { return new Chess() }
  }, [state?.fen])

  // Determine active player's color
  const mySeat = color || (state?.players?.w?.name === user ? 'w' : state?.players?.b?.name === user ? 'b' : (state?.players?.w?.id === socket.id ? 'w' : state?.players?.b?.id === socket.id ? 'b' : 'w'))
  const oppSeat = mySeat === 'w' ? 'b' : 'w'
  const isSpectator = color === 'spectator' || (state && state.players.w?.name !== user && state.players.b?.name !== user && state.players.w?.id !== socket.id && state.players.b?.id !== socket.id && !color)

  const isMatchActive = Boolean(
    !isSpectator &&
    state?.players?.w &&
    state?.players?.b &&
    !state?.isGameOver &&
    !resignedBy &&
    !showResult &&
    !state?.ended
  )

  // Resign action inside game (deducts Elo immediately and sends resign packet)
  const handleResign = useCallback(() => {
    const seat = colorRef.current || (stateRef.current?.players?.w?.name === user ? 'w' : stateRef.current?.players?.b?.name === user ? 'b' : null)
    if (!seat || seat === 'spectator') return

    // 1. Emit resign to server
    socket.emit('resign', { roomId })

    // 2. Immediately record loss and deduct Elo with move history
    if (!recordedRef.current) {
      recordedRef.current = true
      const targetOppSeat = seat === 'w' ? 'b' : 'w'
      const oppPlayer = stateRef.current?.players?.[targetOppSeat]
      const oppElo = oppPlayer?.elo ?? DEFAULT_ELO
      const oppName = oppPlayer?.name || 'Đối thủ'
      const currentMoves = (stateRef.current?.history || []).slice()

      const r = recordGame(0, oppElo, 'online', {
        opponent: oppName,
        oppElo,
        moves: currentMoves,
        whiteName: seat === 'w' ? user : oppName,
        blackName: seat === 'b' ? user : oppName,
        myColor: seat
      })
      if (r) setEloResult(r)
      setSavedMoves(currentMoves)
    }

    setOutcome('loss')
    setOutcomeLabel(t('youResignedSub'))
    setShowResult(true)
    setResignedBy(seat)
  }, [roomId, user, recordGame])

  // Resign and Leave (deducts Elo immediately, emits resign + leave, then allows navigation)
  const resignAndLeave = useCallback(() => {
    if (!recordedRef.current && isMatchActive) {
      recordedRef.current = true
      const seat = colorRef.current || (stateRef.current?.players?.w?.name === user ? 'w' : stateRef.current?.players?.b?.name === user ? 'b' : null)
      if (seat && seat !== 'spectator') {
        const targetOppSeat = seat === 'w' ? 'b' : 'w'
        const oppPlayer = stateRef.current?.players?.[targetOppSeat]
        const oppElo = oppPlayer?.elo ?? DEFAULT_ELO
        const oppName = oppPlayer?.name || 'Đối thủ'
        const currentMoves = (stateRef.current?.history || []).slice()
        recordGame(0, oppElo, 'online', {
          opponent: oppName,
          oppElo,
          moves: currentMoves,
          whiteName: seat === 'w' ? user : oppName,
          blackName: seat === 'b' ? user : oppName,
          myColor: seat
        })
        setSavedMoves(currentMoves)
      }
    }
    socket.emit('resign', { roomId })
    socket.emit('leave-room', { roomId })
  }, [roomId, isMatchActive, user, recordGame])

  // Lock navigation during active match; if user confirms leaving, resignAndLeave triggers
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

  // Unload protection: deduct Elo if player reloads / closes browser during active match
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isMatchActive && !recordedRef.current) {
        recordedRef.current = true
        const seat = colorRef.current || (stateRef.current?.players?.w?.name === user ? 'w' : stateRef.current?.players?.b?.name === user ? 'b' : null)
        if (seat && seat !== 'spectator') {
          const targetOppSeat = seat === 'w' ? 'b' : 'w'
          const oppPlayer = stateRef.current?.players?.[targetOppSeat]
          const oppElo = oppPlayer?.elo ?? DEFAULT_ELO
          const oppName = oppPlayer?.name || 'Đối thủ'
          const currentMoves = (stateRef.current?.history || []).slice()
          recordGame(0, oppElo, 'online', {
            opponent: oppName,
            oppElo,
            moves: currentMoves,
            whiteName: seat === 'w' ? user : oppName,
            blackName: seat === 'b' ? user : oppName,
            myColor: seat
          })
        }
        socket.emit('resign', { roomId })
        socket.emit('leave-room', { roomId })
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isMatchActive, roomId, user, recordGame])

  const handleLeaveRoom = () => {
    if (isMatchActive) {
      requestNavigation('/')
    } else {
      socket.emit('leave-room', { roomId })
      navigate('/')
    }
  }

  useEffect(() => {
    if (!user) { setError('Bạn cần đăng nhập để chơi online'); return }
    if (!socket.connected) socket.connect()
    const elo = profile?.elo ?? DEFAULT_ELO

    socket.emit('join-room', { roomId, name: user, elo }, (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Lỗi không xác định')
        return
      }
      if (res.color) {
        setColor(res.color)
        colorRef.current = res.color
      }
      if (res.state) {
        stateRef.current = res.state
        setState({ ...res.state, receivedAt: Date.now() })
      }
    })

    const onState = (s) => {
      stateRef.current = s
      setState({ ...s, receivedAt: Date.now() })
    }
    const onChat = (msg) => {
      setChat((c) => [...c, msg])
      setActiveTab((tab) => {
        if (tab === 'moves') {
          setUnreadCount((cnt) => cnt + 1)
        }
        return tab
      })
    }
    const onResigned = ({ color: resignColor }) => setResignedBy(resignColor)

    const onResult = (data) => {
      const outcomeMap = {
        white_win: 'white_win', black_win: 'black_win', draw: 'draw',
        white_resign: 'black_win', black_resign: 'white_win',
        white_timeout: 'black_win', black_timeout: 'white_win',
      }
      const o = outcomeMap[data.outcome] || 'draw'

      let currentSeat = colorRef.current
      if (!currentSeat || currentSeat === 'spectator') {
        if (data.players?.w?.name === user || data.players?.w?.id === socket.id) currentSeat = 'w'
        else if (data.players?.b?.name === user || data.players?.b?.id === socket.id) currentSeat = 'b'
        else currentSeat = 'w'
      }

      let label = ''
      if (data.outcome === 'white_resign') {
        label = currentSeat === 'w' ? t('youResignedSub') : t('oppResignedSub')
      } else if (data.outcome === 'black_resign') {
        label = currentSeat === 'b' ? t('youResignedSub') : t('oppResignedSub')
      } else if (data.outcome === 'white_timeout' || data.outcome === 'black_timeout') {
        label = t('timeoutSub')
      } else if (data.outcome === 'draw') {
        label = t('drawMatch')
      } else {
        label = t('checkmateSub')
      }
      setOutcomeLabel(label)

      const { w, b } = scoresFor(o)
      const myScore = currentSeat === 'w' ? w : b
      let myOut = 'draw'
      if (myScore === 1) myOut = 'win'
      else if (myScore === 0) myOut = 'loss'
      setOutcome(myOut)
      setShowResult(true)

      const targetOppSeat = currentSeat === 'w' ? 'b' : 'w'
      const oppPlayer = data.players?.[targetOppSeat] || stateRef.current?.players?.[targetOppSeat]
      const oppElo = oppPlayer?.elo ?? DEFAULT_ELO
      const oppName = oppPlayer?.name || 'Đối thủ'
      const rawMoves = (data.history && data.history.length > 0) ? data.history : (stateRef.current?.history || [])
      const currentMoves = rawMoves.slice()
      setSavedMoves(currentMoves)

      if (!user || (currentSeat !== 'w' && currentSeat !== 'b')) return

      if (!recordedRef.current) {
        recordedRef.current = true
        const r = recordGame(myScore, oppElo, 'online', {
          opponent: oppName,
          oppElo,
          moves: currentMoves,
          whiteName: (currentSeat === 'w' ? user : oppName),
          blackName: (currentSeat === 'b' ? user : oppName),
          myColor: currentSeat
        })
        if (r) setEloResult(r)
      } else {
        // Luôn đảm bảo profile có đầy đủ moves kể cả khi đã xử lý resign trước đó
        if (currentMoves.length > 0) {
          updateLastGameMoves(currentMoves, {
            whiteName: (currentSeat === 'w' ? user : oppName),
            blackName: (currentSeat === 'b' ? user : oppName),
            myColor: currentSeat,
            opponent: oppName,
            oppElo
          })
        }
      }
    }

    const onRematchOffer = () => setRematchState('received')
    const onRematchAccepted = () => {
      setRematchState('idle')
      setShowResult(false)
      setResignedBy(null)
      setEloResult(null)
      setOutcome(null)
      setOutcomeLabel('')
      setSavedMoves(null)
      recordedRef.current = false
      socket.emit('join-room', { roomId, name: user, elo: profile?.elo ?? DEFAULT_ELO }, (res) => {
        if (res?.ok) {
          if (res.color) {
            setColor(res.color)
            colorRef.current = res.color
          }
          if (res.state) setState({ ...res.state, receivedAt: Date.now() })
        }
      })
    }
    const onRematchDeclined = () => setRematchState('declined')

    socket.on('state', onState)
    socket.on('chat', onChat)
    socket.on('resigned', onResigned)
    socket.on('game-result', onResult)
    socket.on('rematch-offer', onRematchOffer)
    socket.on('rematch-accepted', onRematchAccepted)
    socket.on('rematch-declined', onRematchDeclined)

    return () => {
      socket.off('state', onState)
      socket.off('chat', onChat)
      socket.off('resigned', onResigned)
      socket.off('game-result', onResult)
      socket.off('rematch-offer', onRematchOffer)
      socket.off('rematch-accepted', onRematchAccepted)
      socket.off('rematch-declined', onRematchDeclined)
    }
  }, [roomId, user, profile?.elo, recordGame, updateLastGameMoves])

  // Snapshot history when result arrives or when state is updated
  useEffect(() => {
    if (showResult) {
      const moves = (stateRef.current?.history && stateRef.current.history.length > 0)
        ? stateRef.current.history.slice()
        : (state?.history ? state.history.slice() : null)
      if (moves && moves.length > 0 && (!savedMoves || savedMoves.length < moves.length)) {
        setSavedMoves(moves)
      }
    }
  }, [showResult, state?.history, savedMoves])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const onMove = useCallback(
    (move) => {
      const st = stateRef.current
      const col = colorRef.current
      if (!st) return false
      const currentSeat = col || (st.players.w?.name === user ? 'w' : st.players.b?.name === user ? 'b' : (st.players.w?.id === socket.id ? 'w' : st.players.b?.id === socket.id ? 'b' : null))
      if (currentSeat === 'spectator' || !currentSeat) return false
      if (st.turn !== currentSeat) return false

      let verbose
      try {
        const test = new Chess(st.fen)
        verbose = test.move(move)
        if (!verbose) return false
        playMoveSound(verbose, test)
      } catch {
        return false
      }

      socket.emit('move', { roomId, move }, (res) => {
        if (!res?.ok) setError(res?.error || 'Nước đi bị từ chối')
      })
      return true
    },
    [roomId, user]
  )

  const sendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    socket.emit('chat', { roomId, message: chatInput.trim() })
    setChatInput('')
    setEmojiOpen(false)
  }

  const sendQuickChat = (message) => {
    if (!message) return
    socket.emit('chat', { roomId, message })
  }

  const requestRematch = () => {
    socket.emit('rematch-request', { roomId })
    setRematchState('sent')
  }

  const acceptRematch = () => {
    socket.emit('rematch-accept', { roomId })
    socket.emit('join-room', { roomId, name: user, elo: profile?.elo ?? DEFAULT_ELO }, (res) => {
      if (res?.ok) {
        if (res.color) {
          setColor(res.color)
          colorRef.current = res.color
        }
        if (res.state) setState({ ...res.state, receivedAt: Date.now() })
      }
    })
  }

  const declineRematch = () => {
    socket.emit('rematch-decline', { roomId })
    setRematchState('idle')
  }

  // Sound when opponent moves
  const lastHistoryLenRef = useRef(0)
  useEffect(() => {
    if (!state) return
    const prev = lastHistoryLenRef.current
    const curr = state.history.length
    lastHistoryLenRef.current = curr
    if (curr <= prev || curr === 0) return

    try {
      const replay = new Chess()
      for (let i = 0; i < curr - 1; i++) replay.move(state.history[i])
      const lastSan = state.history[curr - 1]
      const verbose = replay.move(lastSan)
      const moverColor = state.turn === 'w' ? 'b' : 'w'
      if (moverColor !== mySeat) {
        playMoveSound(verbose, replay)
      }
    } catch {}
  }, [state?.history, state?.turn, mySeat])

  // Sound for resign and game over
  useEffect(() => {
    if (resignedBy) sfx.checkmate()
  }, [resignedBy])

  useEffect(() => {
    if (state?.isGameOver && state.isDraw) sfx.draw()
  }, [state?.isGameOver, state?.isDraw])

  const hasClock = state && state.tc && state.tc.initialMs > 0
  const renderPlayerCard = (seat) => {
    const isPlayerSeat = !isSpectator && seat === mySeat
    const playerName = state?.players[seat]?.name || t('waitingOpponentJoin')
    const playerElo = state?.players[seat]?.elo

    return (
      <div key={seat} className={`player-card ${state?.turn === seat ? 'active' : ''}`}>
        <div className="player-card-header">
          <div className="player-info-container">
            <div className="player-name-row">
              <PieceCircle color={seat} size={13} style={{ flexShrink: 0 }} />
              <strong className="player-name-full">{playerName}</strong>
              {isPlayerSeat && <span className="player-you-tag">{t('youIndicator')}</span>}
            </div>
            {playerElo != null && (
              <div className="player-meta-row">
                <span className="player-elo-text">{playerElo} Elo</span>
              </div>
            )}
          </div>
          {hasClock && state?.players[seat] && (
            <Clock
              baseMs={state.clocks[seat]}
              running={state.clockRunning && state.turn === seat}
              since={state.receivedAt}
            />
          )}
        </div>
        <CapturedPieces game={game} color={seat} size={14} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn" onClick={() => navigate('/')}>{t('returnHomeDirect')}</button>
        </div>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <h2>Loading room...</h2>
        </div>
      </div>
    )
  }

  const orientation = mySeat === 'b' ? 'black' : 'white'
  const myTurn = Boolean(state.turn === mySeat && !state.isGameOver && !resignedBy)
  const eloLine = eloResult
    ? `Elo: ${eloResult.prevElo} → ${eloResult.newElo} (${eloResult.delta > 0 ? '+' : ''}${eloResult.delta})`
    : null

  const myName = !isSpectator ? state.players[mySeat]?.name : (user || t('youIndicator'))
  const resultTitle = outcome === 'win' ? t('youWon') : outcome === 'loss' ? t('youLost') : outcome === 'draw' ? t('drawMatch') : t('gameOver')
  const movesForReview = (savedMoves && savedMoves.length > 0) ? savedMoves : (state?.history || [])

  return (
    <div className="game-page">
      <div className="panel">
        <h3>{t('roomPrefix')} {roomId}</h3>
        <p className="muted">
          {t('youAre')}&nbsp;
          {mySeat === 'w' ? t('whiteSeat') : mySeat === 'b' ? t('blackSeat') : t('spectatorSeat')}
          {state.spectatorCount > 0 && ` · ${state.spectatorCount} ${t('spectatorsCount')}`}
        </p>
        {renderPlayerCard(oppSeat)}
        {renderPlayerCard(mySeat)}
        {!state.players.w || !state.players.b ? (
          <p className="muted">{t('shareRoomCodeTip')} <strong>{roomId}</strong> {t('shareRoomCodeSuffix')}</p>
        ) : null}
        <button
          className="btn danger"
          onClick={handleResign}
          disabled={isSpectator || state.isGameOver || !!resignedBy}
        >
          {t('resign')}
        </button>
        <button className="btn secondary" onClick={handleLeaveRoom}>
          {isMatchActive ? t('leaveRoomNeedResign') : t('leaveRoom')}
        </button>
      </div>

      <Board
        game={game}
        onMove={onMove}
        orientation={orientation}
        disabled={!myTurn}
        topBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color={oppSeat} size={13} />
              <span className="board-player-name">{state?.players[oppSeat]?.name || t('waitingOpponentJoin')}</span>
              {state?.players[oppSeat] && <span className="board-player-elo">({state?.players[oppSeat].elo})</span>}
              <CapturedPieces game={game} color={oppSeat} size={14} />
            </span>
            {hasClock && state?.players[oppSeat] && (
              <Clock
                baseMs={state.clocks[oppSeat]}
                running={state.clockRunning && state.turn === oppSeat}
                since={state.receivedAt}
              />
            )}
          </div>
        }
        bottomBar={
          <div className="board-player-strip">
            <span className="board-player-info">
              <PieceCircle color={mySeat} size={13} />
              <span className="board-player-name">{state?.players[mySeat]?.name || (user || 'Bạn')}</span>
              {state?.players[mySeat] && <span className="board-player-elo">({state?.players[mySeat].elo})</span>}
              <CapturedPieces game={game} color={mySeat} size={14} />
            </span>
            {hasClock && state?.players[mySeat] && (
              <Clock
                baseMs={state.clocks[mySeat]}
                running={state.clockRunning && state.turn === mySeat}
                since={state.receivedAt}
              />
            )}
          </div>
        }
      />

      <div className="panel game-side-panel">
        {/* Tab Switcher: Chat & Move History */}
        <div className="side-panel-tabs-bar">
          <button
            type="button"
            className={`side-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('chat')
              setUnreadCount(0)
            }}
          >
            <MessageSquare size={14} />
            <span>{t('chatTab')}</span>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`side-tab-btn ${activeTab === 'moves' ? 'active' : ''}`}
            onClick={() => setActiveTab('moves')}
          >
            <ScrollText size={14} />
            <span>{t('movesTab')}</span>
            {game.history().length > 0 && (
              <span className="moves-count-badge">{Math.ceil(game.history().length / 2)}</span>
            )}
          </button>

          <button
            type="button"
            className={`side-tab-btn tab-icon-only ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('split')
              setUnreadCount(0)
            }}
            title={t('splitTab')}
          >
            <Columns size={14} />
          </button>
        </div>

        {/* TAB: MOVES (shown when activeTab === 'moves' or 'split') */}
        {(activeTab === 'moves' || activeTab === 'split') && (
          <div className={`moves-tab-wrapper ${activeTab === 'split' ? 'split-mode' : ''}`}>
            <div className="panel-sub-header">
              <div className="sub-header-title">
                <ScrollText size={14} className="text-amber" />
                <span>{t('moveHistoryTitle')}</span>
              </div>
            </div>
            <MoveHistory history={state?.history || game.history()} />
          </div>
        )}

        {/* TAB: CHAT (shown when activeTab === 'chat' or 'split') */}
        {(activeTab === 'chat' || activeTab === 'split') && (
          <div className={`chat-tab-wrapper ${activeTab === 'split' ? 'split-mode' : ''}`}>
            <div className="panel-sub-header">
              <div className="sub-header-title">
                <MessageSquare size={14} className="text-cyan" />
                <span>{t('roomChatTitle')}</span>
              </div>
              <span className="online-room-indicator">
                <span className="online-dot"></span>
                <span>{t('onlineStatus')}</span>
              </span>
            </div>

            <div className="chat-box-modern">
              {chat.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon-wrap">
                    <MessageSquare size={24} className="text-cyan" />
                  </div>
                  <p className="chat-empty-title">{t('noMessagesInRoom')}</p>
                  <p className="chat-empty-sub">{t('quickGreetingsPrompt')}</p>
                  <div className="chat-empty-chips">
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => sendQuickChat(t('quickHello'))}
                    >
                      {t('quickHello')}
                    </button>
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => sendQuickChat(t('quickGoodLuck'))}
                    >
                      {t('quickGoodLuck')}
                    </button>
                    <button
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => sendQuickChat(t('quickNiceMatch'))}
                    >
                      {t('quickNiceMatch')}
                    </button>
                  </div>
                </div>
              ) : (
                chat.map((c, i) => {
                  const isMe = c.name === user || (color !== 'spectator' && c.name === state?.players?.[mySeat]?.name)
                  const formatTime = c.ts ? new Date(c.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                  const senderColor = (c.name === state?.players?.w?.name || c.seat === 'w') ? 'w' : (c.name === state?.players?.b?.name || c.seat === 'b') ? 'b' : null

                  return (
                    <div
                      key={i}
                      className={`chat-message-item ${isMe ? 'message-mine' : 'message-theirs'}`}
                    >
                      {!isMe && (
                        <div className="message-header-row">
                          {senderColor && <PieceCircle color={senderColor} size={11} />}
                          <span className="message-sender-name">{c.name}</span>
                          {formatTime && <span className="message-time">{formatTime}</span>}
                        </div>
                      )}
                      <div className="message-bubble">
                        <span className="message-text">{c.message}</span>
                        {isMe && formatTime && <span className="message-time-inline">{formatTime}</span>}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions Bar */}
            <div className="chat-quick-actions-bar">
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat(t('quickHello'))}>
                {t('quickHello')}
              </button>
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat(t('quickGoodLuck'))}>
                {t('quickGoodLuck')}
              </button>
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat(t('quickNiceMove'))}>
                {t('quickNiceMove')}
              </button>
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat(t('quickDrawOffer'))}>
                {t('quickDrawOffer')}
              </button>
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat(t('quickTense'))}>
                {t('quickTense')}
              </button>
              <button type="button" className="quick-action-pill" onClick={() => sendQuickChat('GG!')}>
                GG!
              </button>
            </div>

            {/* Emoji Drawer if toggled */}
            {emojiOpen && (
              <div className="chat-emoji-drawer">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-btn"
                    onClick={() => {
                      setChatInput((prev) => prev + emoji)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={sendChat} className="chat-input-form-modern">
              <button
                type="button"
                className={`btn-emoji-toggle ${emojiOpen ? 'active' : ''}`}
                onClick={() => setEmojiOpen((v) => !v)}
                title="Biểu tượng cảm xúc"
              >
                <Smile size={16} />
              </button>
              <div className="chat-input-wrapper">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('chatPlaceholder')}
                  maxLength={200}
                  className="chat-input-field-modern"
                />
                {chatInput && (
                  <button
                    type="button"
                    className="chat-clear-btn"
                    onClick={() => setChatInput('')}
                    title="Xóa"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-chat-send-modern"
                title={t('sendChatBtn')}
                disabled={!chatInput.trim()}
              >
                <Send size={15} />
                <span>{t('sendChatBtn')}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      <ResultModal
        open={showResult}
        title={resultTitle}
        subtitle={outcomeLabel}
        playerName={myName}
        prevElo={eloResult?.prevElo}
        delta={eloResult?.delta}
        onRematch={!isSpectator ? (rematchState === 'received' ? acceptRematch : requestRematch) : null}
        rematchDisabled={rematchState === 'sent' || rematchState === 'declined'}
        rematchLabel={
          rematchState === 'sent' ? t('rematchSent')
          : rematchState === 'received' ? t('rematchReceived')
          : rematchState === 'declined' ? t('rematchDeclined')
          : t('rematchBtn')
        }
        onReview={movesForReview && movesForReview.length > 0 ? () => {
          navigate('/review', { state: {
            sanMoves: movesForReview,
            whiteName: state?.players?.w?.name || (mySeat === 'w' ? user : 'Opponent'),
            blackName: state?.players?.b?.name || (mySeat === 'b' ? user : 'Opponent'),
            myColor: mySeat,
          }})
        } : null}
        onHome={() => {
          socket.emit('leave-room', { roomId })
          navigate('/')
        }}
      />
    </div>
  )
}
