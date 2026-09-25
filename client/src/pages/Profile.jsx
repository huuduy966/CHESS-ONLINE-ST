import { useAuth } from '../utils/auth.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useLanguage } from '../utils/language.jsx'
import {
  Flame,
  HeartCrack,
  Handshake,
  Eye,
  Trophy,
  Swords,
  Fish,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Sparkles
} from 'lucide-react'

function fmtTime(ts, lang = 'vi') {
  const d = new Date(ts)
  return d.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function fmtDate(ts, lang = 'vi') {
  return new Date(ts).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function computeStreak(history) {
  if (!history || history.length === 0) return { type: null, count: 0 }
  const first = history[0]
  const type = first.score === 1 ? 'win' : first.score === 0 ? 'loss' : 'draw'
  let count = 0
  for (const h of history) {
    const t = h.score === 1 ? 'win' : h.score === 0 ? 'loss' : 'draw'
    if (t === type) count++
    else break
  }
  return { type, count }
}

function computeStats(history) {
  if (!history || history.length === 0) return { peakElo: null, vsBot: 0, vsOnline: 0 }
  let peak = 0
  let vsBot = 0
  let vsOnline = 0
  for (const h of history) {
    if (h.newElo > peak) peak = h.newElo
    if (h.mode === 'ai') vsBot++
    else if (h.mode === 'online') vsOnline++
  }
  return { peakElo: peak, vsBot, vsOnline }
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { t, lang } = useLanguage()
  const [filter, setFilter] = useState('all') // all | online | ai | win | loss

  const history = profile?.history || []
  const filtered = useMemo(() => {
    if (filter === 'all') return history
    if (filter === 'ai' || filter === 'online') return history.filter((h) => h.mode === filter)
    if (filter === 'win') return history.filter((h) => h.score === 1)
    if (filter === 'loss') return history.filter((h) => h.score === 0)
    return history
  }, [history, filter])

  const streak = useMemo(() => computeStreak(history), [history])
  const extras = useMemo(() => computeStats(history), [history])

  if (!user) {
    return (
      <div className="lobby">
        <div className="lobby-card auth-card">
          <UserCheck size={36} className="text-cyan" style={{ margin: '0 auto' }} />
          <h2>{t('notLoggedInTitle')}</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            {t('notLoggedInDesc')}
          </p>
          <div className="auth-actions" style={{ flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
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

  if (!profile) {
    return (
      <div className="lobby">
        <div className="lobby-card">
          <h2>{t('loadingProfile')}</h2>
        </div>
      </div>
    )
  }

  const totalGames = (profile.wins || 0) + (profile.losses || 0) + (profile.draws || 0)
  const winRate = totalGames > 0 ? Math.round(((profile.wins || 0) / totalGames) * 100) : 0

  const renderStreak = () => {
    if (streak.count === 0) return '—'
    if (streak.type === 'win') {
      return (
        <span className="streak-badge streak-win">
          <Flame size={16} className="text-amber inline-icon" />
          <span>{t('winStreak')} {streak.count}</span>
        </span>
      )
    }
    if (streak.type === 'loss') {
      return (
        <span className="streak-badge streak-loss">
          <HeartCrack size={16} className="text-red inline-icon" />
          <span>{t('lossStreak')} {streak.count}</span>
        </span>
      )
    }
    return (
      <span className="streak-badge streak-draw">
        <Handshake size={16} className="text-cyan inline-icon" />
        <span>{t('drawStreak')} {streak.count}</span>
      </span>
    )
  }

  // Chuyển sang trang xem lại ván cờ khi click vào hàng trận đấu
  const handleReviewGame = (h) => {
    let moves = h.moves
    if (typeof moves === 'string') {
      moves = moves.trim().split(/\s+/).filter(Boolean)
    }
    if (!Array.isArray(moves) || moves.length === 0) return
    navigate('/review', {
      state: {
        sanMoves: moves,
        whiteName: h.whiteName || (h.myColor === 'w' ? user : h.opponent || 'Opponent'),
        blackName: h.blackName || (h.myColor === 'b' ? user : h.opponent || 'Opponent'),
        myColor: h.myColor || 'w'
      }
    })
  }

  return (
    <div className="profile-page">
      {/* Profile Header Hero Card */}
      <div className="profile-card profile-hero-card">
        <div className="profile-header">
          <div className="profile-identity">
            <div className="avatar">{profile.username[0]?.toUpperCase()}</div>
            <div className="profile-names-box">
              <div className="profile-username-row">
                <h2>{profile.username}</h2>
                <span className="profile-rank-tag">{t('chessPlayerTag')}</span>
              </div>
              <p className="muted profile-joined-date">
                <Calendar size={14} className="inline-icon" />
                {t('joinedDatePrefix')} {profile.createdAt ? fmtDate(profile.createdAt, lang) : '2026'}
              </p>
            </div>
          </div>

          <div className="profile-elo-badge-box">
            <div className="elo-big-display">
              <Trophy size={24} className="text-yellow" />
              <span>{profile.elo}</span>
            </div>
            <div className="elo-meta-label">{t('eloRatingTitle')}</div>
          </div>
        </div>

        {/* Primary Performance Stats */}
        <div className="profile-stats-grid">
          <div className="stat-box stat-win">
            <div className="stat-icon-pill icon-emerald">
              <Award size={18} />
            </div>
            <div className="stat-content">
              <div className="stat-num win">{profile.wins || 0}</div>
              <div className="stat-label">{t('victoryLabel')}</div>
            </div>
          </div>

          <div className="stat-box stat-draw">
            <div className="stat-icon-pill icon-cyan">
              <Handshake size={18} />
            </div>
            <div className="stat-content">
              <div className="stat-num draw">{profile.draws || 0}</div>
              <div className="stat-label">{t('drawLabel')}</div>
            </div>
          </div>

          <div className="stat-box stat-loss">
            <div className="stat-icon-pill icon-red">
              <ShieldAlert size={18} />
            </div>
            <div className="stat-content">
              <div className="stat-num loss">{profile.losses || 0}</div>
              <div className="stat-label">{t('defeatLabel')}</div>
            </div>
          </div>

          <div className="stat-box stat-rate">
            <div className="stat-icon-pill icon-amber">
              <TrendingUp size={18} />
            </div>
            <div className="stat-content">
              <div className="stat-num">{winRate}%</div>
              <div className="stat-label">{t('winRateLabel')}</div>
            </div>
          </div>
        </div>

        {/* Secondary Metadata Grid */}
        <div className="profile-substats-row">
          <div className="substat-item">
            <span className="substat-title">{t('totalGamesLabel')}</span>
            <strong>{totalGames} {t('gamesSuffix')}</strong>
          </div>
          <div className="substat-item">
            <span className="substat-title">{t('peakEloLabel')}</span>
            <strong className="text-yellow">{extras.peakElo ?? profile.elo} Elo</strong>
          </div>
          <div className="substat-item">
            <span className="substat-title">{t('vsBotLabel')}</span>
            <strong>{extras.vsBot} {t('matchesSuffix')}</strong>
          </div>
          <div className="substat-item">
            <span className="substat-title">{t('vsOnlineLabel')}</span>
            <strong>{extras.vsOnline} {t('matchesSuffix')}</strong>
          </div>
          <div className="substat-item substat-streak-item">
            <span className="substat-title">{t('streakLabel')}</span>
            <div>{renderStreak()}</div>
          </div>
        </div>
      </div>

      {/* Match History Card */}
      <div className="profile-card profile-history-card">
        <div className="profile-history-header">
          <div className="history-title-group">
            <div className="history-tag">
              <Clock size={16} className="text-cyan" />
              <span>{t('matchLogsTag')}</span>
            </div>
            <h3>{t('matchHistoryMainTitle')}</h3>
            <p className="muted history-subtitle-tip">
              {t('matchHistoryTip')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="history-filters-row">
            {[
              { id: 'all', label: t('filterAll') },
              { id: 'online', label: t('filterOnline') },
              { id: 'ai', label: t('filterAI') },
              { id: 'win', label: t('filterWin') },
              { id: 'loss', label: t('filterLoss') }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="history-empty-state">
            <Clock size={32} className="text-muted" />
            <p className="muted">
              {history.length === 0
                ? t('noMatchesYet')
                : t('noMatchesFiltered')}
            </p>
          </div>
        ) : (
          <div className="history-list-interactive">
            {filtered.map((h, i) => {
              const label = h.score === 1 ? t('winStatus') : h.score === 0 ? t('lossStatus') : t('drawStatus')
              const cls = h.score === 1 ? 'win' : h.score === 0 ? 'loss' : 'draw'
              const sign = h.delta > 0 ? '+' : ''
              const movesList = Array.isArray(h.moves)
                ? h.moves
                : typeof h.moves === 'string' && h.moves.trim()
                ? h.moves.trim().split(/\s+/).filter(Boolean)
                : []
              const hasMoves = movesList.length > 0
              const isAiMode = h.mode === 'ai'
              const modeLabel = isAiMode ? t('modeLabelAI') : t('modeLabelOnline')

              return (
                <div
                  className={`history-match-row ${hasMoves ? 'clickable-row' : ''}`}
                  key={i}
                  onClick={() => hasMoves && handleReviewGame(h)}
                  title={hasMoves ? t('matchHistoryTip') : t('noPgnText')}
                  role={hasMoves ? 'button' : undefined}
                  tabIndex={hasMoves ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (hasMoves && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleReviewGame(h)
                    }
                  }}
                >
                  {/* Kết quả ván cờ */}
                  <div className={`history-result-badge ${cls}`}>
                    {label}
                  </div>

                  {/* Thông tin đối thủ và thời gian */}
                  <div className="history-opponent-cell">
                    <div className="opponent-primary-line">
                      <span className="opponent-mode-icon">
                        {isAiMode ? (
                          <Fish size={15} className="text-cyan" />
                        ) : (
                          <Swords size={15} className="text-amber" />
                        )}
                      </span>
                      <strong className="opponent-name">
                        {h.opponent || (isAiMode ? 'Stockfish Bot' : 'Opponent')}
                      </strong>
                      <span className="opponent-elo-chip">
                        {h.oppElo ? `${h.oppElo} Elo` : '1000 Elo'}
                      </span>
                    </div>

                    <div className="opponent-sub-line muted">
                      <span>{modeLabel}</span>
                      <span>•</span>
                      <span>{fmtTime(h.ts, lang)}</span>
                    </div>
                  </div>

                  {/* Điểm Elo thay đổi */}
                  <div className={`history-elo-cell ${isAiMode ? 'unrated' : cls}`}>
                    {isAiMode ? (
                      <span className="elo-delta-number muted" style={{ fontSize: '0.82rem' }}>
                        {t('unratedShort')}
                      </span>
                    ) : (
                      <>
                        <span className="elo-delta-number">
                          {sign}{h.delta}
                        </span>
                        <span className="elo-new-total muted">
                          {h.newElo} Elo
                        </span>
                      </>
                    )}
                  </div>

                  {/* Nút Xem lại ván cờ */}
                  <div className="history-action-cell">
                    {hasMoves ? (
                      <span className="row-review-cta">
                        <Eye size={15} />
                        <span>{t('reviewRowCTA')}</span>
                        <ChevronRight size={14} className="row-arrow" />
                      </span>
                    ) : (
                      <span className="muted no-replay-text">{t('noPgnText')}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
