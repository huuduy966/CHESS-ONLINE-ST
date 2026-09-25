import { useEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Globe,
  Swords,
  Rocket,
  Zap,
  Clock,
  Hourglass,
  Search,
  PlusCircle,
  KeyRound,
  Check,
  User,
  Shield,
  Radio,
  Trophy,
  X
} from 'lucide-react'
import { socket } from '../utils/socket.js'
import { useAuth } from '../utils/auth.jsx'
import { useLanguage } from '../utils/language.jsx'
import { DEFAULT_ELO } from '../utils/elo.js'
import { TIME_CONTROLS, DEFAULT_TC_ID, getTC } from '../utils/timeControl.js'

// Map group to icon: Bullet = Tên lửa (Rocket), Blitz = Ngọn sét (Zap), Rapid = Đồng hồ (Clock), Classical = Đồng hồ cát (Hourglass)
function getTcIcon(group) {
  switch (group) {
    case 'Bullet':
      return Rocket
    case 'Blitz':
      return Zap
    case 'Rapid':
      return Clock
    case 'Classical':
      return Hourglass
    default:
      return Clock
  }
}

export default function OnlineLobby() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { t, lang } = useLanguage()
  const [tcId, setTcId] = useState(() => {
    const saved = localStorage.getItem('chess-tc')
    return (saved && saved !== 'unlimited') ? saved : DEFAULT_TC_ID
  })
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(socket.connected)
  const [searching, setSearching] = useState(false)
  const [waited, setWaited] = useState(0)
  const tickRef = useRef(null)
  const matchFoundRef = useRef(false)

  useEffect(() => {
    if (!socket.connected) socket.connect()
    matchFoundRef.current = false
    const onConn = () => setConnected(true)
    const onDisc = () => {
      setConnected(false)
      setSearching(false)
    }
    const onMatch = ({ roomId, color: matchedColor }) => {
      matchFoundRef.current = true
      setSearching(false)
      navigate(`/online/${roomId}`, { state: { initialColor: matchedColor } })
    }
    socket.on('connect', onConn)
    socket.on('disconnect', onDisc)
    socket.on('match-found', onMatch)
    return () => {
      if (!matchFoundRef.current) {
        socket.emit('cancel-match')
      }
      socket.off('connect', onConn)
      socket.off('disconnect', onDisc)
      socket.off('match-found', onMatch)
    }
  }, [navigate])

  useEffect(() => {
    if (!searching) {
      clearInterval(tickRef.current)
      setWaited(0)
      return
    }
    const start = Date.now()
    tickRef.current = setInterval(
      () => setWaited(Math.floor((Date.now() - start) / 1000)),
      1000
    )
    return () => clearInterval(tickRef.current)
  }, [searching])

  // Khóa kéo lên / kéo xuống và ẩn nút quay lại khi đang tìm trận
  useEffect(() => {
    if (searching) {
      document.body.classList.add('searching-match')
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      // Cuộn mượt màn hình lên đầu nếu đang bị cuộn dở
      window.scrollTo({ top: 0, behavior: 'instant' })

      const preventScroll = (e) => {
        // Cho phép click nút bấm nhưng không cho cuộn trang
        if (e.type === 'touchmove') e.preventDefault()
      }

      window.addEventListener('touchmove', preventScroll, { passive: false })

      return () => {
        document.body.classList.remove('searching-match')
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        window.removeEventListener('touchmove', preventScroll)
      }
    } else {
      document.body.classList.remove('searching-match')
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [searching])

  const myElo = profile?.elo ?? DEFAULT_ELO
  const tc = useMemo(() => getTC(tcId), [tcId])
  const tcPayload = { initialMs: tc.initialMs, incrementMs: tc.incrementMs }

  useEffect(() => {
    localStorage.setItem('chess-tc', tcId)
  }, [tcId])

  // Chưa đăng nhập → khóa toàn bộ tính năng online
  if (!user) {
    return (
      <div className="lobby">
        <div className="lobby-card auth-card">
          <div className="engine-banner-badge">
            <Globe size={18} className="text-cyan" />
            <span>MULTIPLAYER ONLINE</span>
          </div>
          <h2>{t('bentoOnlineTitle')}</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            {t('notLoggedInDesc')}
          </p>
          <div className="auth-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="btn full-width">
              {t('loginNow')}
            </Link>
            <Link to="/register" className="btn secondary full-width">
              {t('createNewAcc')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const findMatch = () => {
    setError('')
    socket.emit('find-match', { name: user, elo: myElo, tc: tcPayload }, (res) => {
      if (!res?.ok) return setError(res?.error || 'Error')
      setSearching(true)
    })
  }

  const cancelMatch = () => socket.emit('cancel-match', {}, () => setSearching(false))

  const create = () => {
    setError('')
    socket.emit('create-room', { name: user, elo: myElo, tc: tcPayload }, (res) => {
      if (!res?.ok) return setError(res?.error || 'Error')
      navigate(`/online/${res.roomId}`)
    })
  }

  const join = () => {
    setError('')
    if (!roomId.trim()) return setError(t('roomCodeRequired'))
    socket.emit(
      'join-room',
      { roomId: roomId.trim().toUpperCase(), name: user, elo: myElo },
      (res) => {
        if (!res?.ok) return setError(res?.error || 'Error')
        navigate(`/online/${res.roomId}`)
      }
    )
  }

  return (
    <div className="lobby online-lobby-container">
      <div className="online-lobby-card">
        {/* Header & Connection status */}
        <div className="online-lobby-header">
          <div className="header-title-box">
            <div className="lobby-tag-badge">
              <Globe size={16} className="text-cyan" />
              <span>{t('onlineLobbyTag')}</span>
            </div>
            <h2>{t('chooseCategoryTitle')}</h2>
            <p className="muted">
              {t('chooseCategoryDesc')}
            </p>
          </div>

          <div className="player-lobby-status">
            <div className="player-status-pill">
              <User size={15} />
              <span className="player-status-name">{user}</span>
              <span className="elo-pill">
                <Trophy size={13} className="inline-icon text-yellow" /> {myElo} Elo
              </span>
            </div>

            <div className="server-status-indicator">
              <span
                className={`connection-dot ${connected ? 'dot-online' : 'dot-offline'}`}
              ></span>
              <span className="connection-text">
                {connected ? t('serverReady') : t('serverOffline')}
              </span>
            </div>
          </div>
        </div>

        {/* SQUARE TILES GRID (Ô vuông cách nhau sạch sẽ, rõ ràng) */}
        <div className="tc-square-grid">
          {TIME_CONTROLS.map((t) => {
            const IconComp = getTcIcon(t.group)
            const isSelected = tcId === t.id
            const isBlitz = t.group === 'Blitz'
            const isBullet = t.group === 'Bullet'
            const isRapid = t.group === 'Rapid'

            let iconColorClass = 'text-emerald'
            if (isBullet) iconColorClass = 'text-amber'
            else if (isBlitz) iconColorClass = 'text-yellow'
            else if (isRapid) iconColorClass = 'text-cyan'

            return (
              <button
                key={t.id}
                className={`tc-square-card ${isSelected ? 'active' : ''}`}
                onClick={() => setTcId(t.id)}
                disabled={searching}
                type="button"
              >
                {/* Active check badge */}
                {isSelected && (
                  <div className="tc-selected-badge">
                    <Check size={12} />
                  </div>
                )}

                <div className={`tc-square-icon-box ${iconColorClass}`}>
                  <IconComp size={22} />
                </div>

                <div className="tc-square-label">{lang === 'en' ? (t.labelEn || t.label) : t.label}</div>

                <div className="tc-square-group-badge">{t.group}</div>
              </button>
            )
          })}
        </div>

        {/* Selected time control summary bar */}
        <div className="selected-tc-banner">
          <div className="selected-tc-info">
            <span className="selected-tc-label">{t('chooseCategoryTitle')}:</span>
            <strong className="selected-tc-val">
              {tc.group} • {lang === 'en' ? (tc.labelEn || tc.label) : tc.label} {tc.incrementMs > 0 ? `(+${tc.incrementMs / 1000}s)` : ''}
            </strong>
          </div>
          <span className="selected-tc-mode-pill">{t('standardEloMode')}</span>
        </div>

        {/* Quick Matchmaking Action */}
        <div className="lobby-actions-block">
          <button
            className="btn btn-find-match"
            onClick={findMatch}
            disabled={!connected || searching}
            type="button"
          >
            <Swords size={20} />
            <span>{t('autoFindMatch')} · {lang === 'en' ? (tc.labelEn || tc.label) : tc.label}</span>
          </button>
        </div>

        {/* CỬA SỔ HÌNH TRÒN Ở GIỮA MÀN HÌNH KHI GHÉP TRẬN */}
        {searching &&
          typeof document !== 'undefined' &&
          createPortal(
            <div className="matchmaking-overlay">
              <div className="matchmaking-circle-container">
                <div className="matchmaking-circle-wrapper">
                  <div className="radar-wave-ring radar-wave-1"></div>
                  <div className="radar-wave-ring radar-wave-2"></div>
                  <div className="radar-wave-ring radar-wave-3"></div>
                  <div className="radar-wave-ring radar-wave-4"></div>

                  <div className="matchmaking-circle-widget">
                    <div className="circle-conic-border"></div>

                    <div className="circle-widget-body">
                      <div className="circle-swords-icon-box">
                        <Swords size={34} className="text-amber circle-pulsing-icon" />
                      </div>

                      <div className="circle-status-title">{t('matchingTitle')}</div>

                      {/* Đồng hồ đếm thời gian */}
                      <div className="circle-elapsed-timer">
                        {String(Math.floor(waited / 60)).padStart(2, '0')}:
                        {String(waited % 60).padStart(2, '0')}
                      </div>

                      {/* Thể loại đã chọn */}
                      <div className="circle-selected-tc-pill">
                        <span className="dot-live-green"></span>
                        <span>{tc.group} · {lang === 'en' ? (tc.labelEn || tc.label) : tc.label}</span>
                      </div>

                      <div className="circle-matching-note">
                        {t('searchingOpponentNote')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nút Hủy ghép trận bên dưới ô tròn */}
                <button
                  type="button"
                  className="btn danger btn-cancel-circle"
                  onClick={cancelMatch}
                >
                  <X size={15} className="inline-icon" /> {t('cancelMatchBtn')}
                </button>
              </div>
            </div>,
            document.body
          )}

        {/* Friend & Private Room Section */}
        <div className="private-room-section">
          <div className="section-divider">
            <span>{t('orPlayWithFriends')}</span>
          </div>

          <div className="private-room-grid">
            {/* Create Room Card */}
            <div className="private-action-card">
              <div className="card-mini-icon text-cyan">
                <PlusCircle size={20} />
              </div>
              <div className="card-mini-content">
                <strong>{t('createPrivateRoomTitle')}</strong>
                <p className="muted">{t('createPrivateRoomDesc')}</p>
                <button
                  className="btn secondary btn-sm full-width"
                  onClick={create}
                  disabled={!connected || searching}
                  type="button"
                >
                  {t('createRoomBtn')} ({lang === 'en' ? (tc.labelEn || tc.label) : tc.label})
                </button>
              </div>
            </div>

            {/* Join Room Card */}
            <div className="private-action-card">
              <div className="card-mini-icon text-amber">
                <KeyRound size={20} />
              </div>
              <div className="card-mini-content">
                <strong>{t('joinWithCodeTitle')}</strong>
                <p className="muted">{t('joinWithCodeDesc')}</p>
                <div className="join-input-group">
                  <input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder={t('pinPlaceholder')}
                    disabled={searching}
                    maxLength={10}
                  />
                  <button
                    className="btn secondary btn-sm"
                    onClick={join}
                    disabled={!connected || !roomId.trim() || searching}
                    type="button"
                  >
                    {t('joinRoomBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="lobby-error-banner">{error}</div>}
      </div>
    </div>
  )
}
