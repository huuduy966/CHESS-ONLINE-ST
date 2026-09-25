import { Link } from 'react-router-dom'
import {
  Swords,
  Bot,
  Users,
  ChevronRight,
  Sparkles,
  Zap,
  Trophy,
  ShieldCheck,
  Brain,
  History,
  Play,
  Globe,
  Fish,
  Layers,
  Lightbulb,
  Key,
  Smartphone,
  Flame,
  Cpu
} from 'lucide-react'
import AutoChaosBoard from '../components/AutoChaosBoard.jsx'
import { useAuth } from '../utils/auth.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function Home() {
  const { user, profile } = useAuth()
  const { t } = useLanguage()

  const modes = [
    {
      id: 'online',
      to: '/online',
      icon: Swords,
      iconColor: 'icon-cyan',
      themeClass: 'bento-online',
      tag: t('bentoOnlineTag'),
      tagClass: 'tag-cyan',
      title: t('bentoOnlineTitle'),
      desc: t('bentoOnlineDesc'),
      badges: [
        { icon: Zap, label: t('badgeFastMatch'), color: 'amber' },
        { icon: Trophy, label: t('badgeRankedElo'), color: 'yellow' },
        { icon: Globe, label: t('badgeGlobal'), color: 'cyan' }
      ],
      cta: t('ctaOnline'),
      primary: true
    },
    {
      id: 'ai',
      to: '/ai',
      icon: Bot,
      iconColor: 'icon-purple',
      themeClass: 'bento-ai',
      tag: t('bentoAiTag'),
      tagClass: 'tag-purple',
      title: t('bentoAiTitle'),
      desc: t('bentoAiDesc'),
      badges: [
        { icon: Cpu, label: t('badgeSf19'), color: 'purple' },
        { icon: Layers, label: t('badge11Levels'), color: 'cyan' }
      ],
      cta: t('ctaAi'),
      highlight: true
    },
    {
      id: 'local',
      to: '/local',
      icon: Users,
      iconColor: 'icon-emerald',
      themeClass: 'bento-local',
      tag: t('bentoLocalTag'),
      tagClass: 'tag-emerald',
      title: t('bentoLocalTitle'),
      desc: t('bentoLocalDesc'),
      badges: [
        { icon: Users, label: t('badgeLocal2P'), color: 'emerald' },
        { icon: Key, label: t('badgePinRoom'), color: 'teal' },
        { icon: Smartphone, label: t('badgeMultiDevice'), color: 'blue' }
      ],
      cta: t('ctaLocal'),
      secondary: true
    }
  ]

  return (
    <div className="home-container">
      {/* Background Decorative Glows */}
      <div className="bg-glow-orb bg-glow-left"></div>
      <div className="bg-glow-orb bg-glow-right"></div>

      <div className="home-hero-grid">
        {/* Left Column: Hero Intro & Game Mode Selectors */}
        <div className="hero-content">
          {/* Main Headline */}
          <h1 className="hero-title">
            {t('heroTitle1')} <br />
            <span className="hero-title-gradient">{t('heroTitle2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            {t('heroSubtitle')}
          </p>

          {/* 3 Main Game Modes (Bento Cards) */}
          <div className="modes-stack">
            {modes.map((m) => {
              const IconComp = m.icon
              return (
                <Link
                  to={m.to}
                  key={m.to}
                  className={`mode-bento-card ${m.themeClass} ${m.primary ? 'bento-primary' : ''} ${m.highlight ? 'bento-highlight' : ''}`}
                >
                  <div className={`mode-icon-wrapper ${m.iconColor}`}>
                    <IconComp size={28} />
                  </div>

                  <div className="mode-card-body">
                    <div className="mode-card-header">
                      <div className="mode-title-row">
                        <h3 className="mode-card-title">{m.title}</h3>
                        <span className={`mode-tag-pill ${m.tagClass}`}>{m.tag}</span>
                      </div>
                      <p className="mode-card-desc">{m.desc}</p>
                    </div>

                    <div className="mode-card-footer">
                      <div className="mode-badges-group">
                        {m.badges.map((b, i) => {
                          const BadgeIcon = b.icon
                          return (
                            <span key={i} className={`mode-badge-item badge-color-${b.color}`}>
                              <span className="badge-icon-wrapper">
                                <BadgeIcon size={14} className="badge-svg-icon" />
                              </span>
                              <span className="badge-label">{b.label}</span>
                            </span>
                          )
                        })}
                      </div>
                      <span className="mode-cta-link">
                        <span>{m.cta}</span>
                        <ChevronRight size={16} className="cta-arrow" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Quick Feature Stats Banner */}
          <div className="features-banner-grid">
            <div className="feature-stat-item">
              <div className="feature-stat-icon">
                <Brain size={18} className="text-cyan" />
              </div>
              <div className="feature-stat-text">
                <strong>{t('featSf19Title')}</strong>
                <span>{t('featSf19Sub')}</span>
              </div>
            </div>

            <div className="feature-stat-item">
              <div className="feature-stat-icon">
                <Zap size={18} className="text-amber" />
              </div>
              <div className="feature-stat-text">
                <strong>{t('featRealtimeTitle')}</strong>
                <span>{t('featRealtimeSub')}</span>
              </div>
            </div>

            <div className="feature-stat-item">
              <div className="feature-stat-icon">
                <Trophy size={18} className="text-yellow" />
              </div>
              <div className="feature-stat-text">
                <strong>{t('featEloTitle')}</strong>
                <span>{t('featEloSub')}</span>
              </div>
            </div>

            <div className="feature-stat-item">
              <div className="feature-stat-icon">
                <History size={18} className="text-emerald" />
              </div>
              <div className="feature-stat-text">
                <strong>{t('featReviewTitle')}</strong>
                <span>{t('featReviewSub')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ván cờ trực tiếp */}
        <div className="hero-board-column">
          <div className="hero-board-sticky">
            <AutoChaosBoard />

            {/* Chess Tip Quote Card */}
            <div className="chess-quote-card">
              <div className="quote-icon">
                <Lightbulb size={24} className="text-yellow" />
              </div>
              <div className="quote-content">
                <strong>{t('chessTipTitle')}</strong>
                <p>{t('chessTipDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
