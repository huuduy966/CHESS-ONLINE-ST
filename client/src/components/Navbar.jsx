import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Swords,
  Bot,
  Users,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Trophy,
  Home,
  Globe
} from 'lucide-react'
import LanguageToggle from './LanguageToggle.jsx'
import { useAuth } from '../utils/auth.jsx'
import { useTheme } from '../utils/theme.jsx'
import { useGameLock } from '../utils/gameLock.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { isGameLocked, requestNavigation } = useGameLock()
  const { t } = useLanguage()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const closeMobile = () => setMobileMenuOpen(false)

  const handleNav = (e, to) => {
    e.preventDefault()
    closeMobile()
    requestNavigation(to)
  }

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        {/* Logo Chess Online */}
        <div className="nav-brand">
          <a href="/" className="logo-brand" onClick={(e) => handleNav(e, '/')}>
            <div className="logo-text-group">
              <span className="logo-title">
                CHESS <span className="logo-highlight">ONLINE</span>
              </span>
              <span className="logo-badge-live">
                <span className="live-dot"></span> LIVE
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Nav Links - Giao diện đồng nhất như ngoài trang chính */}
        <div className="nav-links">
          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            {t('home')}
          </a>
          <a
            href="/online"
            onClick={(e) => handleNav(e, '/online')}
            className={`nav-item ${isActive('/online') ? 'active' : ''}`}
          >
            <Swords size={16} className="nav-icon" />
            {t('online')}
          </a>
          <a
            href="/ai"
            onClick={(e) => handleNav(e, '/ai')}
            className={`nav-item ${isActive('/ai') ? 'active' : ''}`}
          >
            <Bot size={16} className="nav-icon" />
            {t('ai')}
          </a>
          <a
            href="/local"
            onClick={(e) => handleNav(e, '/local')}
            className={`nav-item ${isActive('/local') ? 'active' : ''}`}
          >
            <Users size={16} className="nav-icon" />
            {t('local')}
          </a>
        </div>

        {/* Right Section: Profile, Login, Register, Utilities */}
        <div className="nav-right">
          {/* Language & Theme */}
          <div className="nav-utils">
            <LanguageToggle />
            <button
              className="theme-toggle"
              onClick={toggle}
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-yellow" /> : <Moon size={18} />}
            </button>
          </div>

          {/* Profile & Auth */}
          <div className="nav-auth">
            <a
              href="/profile"
              onClick={(e) => handleNav(e, '/profile')}
              className={`nav-profile-btn ${isActive('/profile') ? 'active' : ''}`}
              title="Hồ sơ người chơi"
            >
              {user ? (
                <div className="user-profile-badge">
                  <div className="avatar-chip">{user[0].toUpperCase()}</div>
                  <div className="user-profile-text">
                    <span className="user-name">{user}</span>
                    <span className="elo-pill">
                      <Trophy size={13} className="inline-icon text-yellow" />
                      {profile?.elo ?? 1200}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="guest-profile-badge">
                  <User size={16} className="profile-icon" />
                  <span>{t('profile')}</span>
                </div>
              )}
            </a>

            {user ? (
              <button
                className="auth-btn auth-btn-logout"
                onClick={(e) => {
                  if (isGameLocked) {
                    handleNav(e, () => logout())
                  } else {
                    logout()
                  }
                }}
                title={t('logout')}
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => handleNav(e, '/login')}
                  className="auth-btn auth-btn-login"
                >
                  <LogIn size={16} />
                  <span>{t('login')}</span>
                </a>
                <a
                  href="/register"
                  onClick={(e) => handleNav(e, '/register')}
                  className="auth-btn auth-btn-register"
                >
                  <UserPlus size={16} />
                  <span>{t('register')}</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-links">
            <a href="/" className="mobile-link" onClick={(e) => handleNav(e, '/')}>
              <Home size={18} />
              <span>{t('home')}</span>
            </a>
            <a href="/online" className="mobile-link" onClick={(e) => handleNav(e, '/online')}>
              <Swords size={18} />
              <span>{t('online')}</span>
            </a>
            <a href="/ai" className="mobile-link" onClick={(e) => handleNav(e, '/ai')}>
              <Bot size={18} />
              <span>{t('ai')} (Stockfish 19)</span>
            </a>
            <a href="/local" className="mobile-link" onClick={(e) => handleNav(e, '/local')}>
              <Users size={18} />
              <span>{t('local')}</span>
            </a>
            <a href="/profile" className="mobile-link" onClick={(e) => handleNav(e, '/profile')}>
              <User size={18} />
              <span>{t('profile')} {user && `(${user} - ${profile?.elo ?? 1200} Elo)`}</span>
            </a>
          </div>

          <div className="mobile-drawer-auth">
            {user ? (
              <button
                className="auth-btn auth-btn-logout full-width"
                onClick={(e) => {
                  if (isGameLocked) {
                    handleNav(e, () => {
                      logout()
                      closeMobile()
                    })
                  } else {
                    logout()
                    closeMobile()
                  }
                }}
              >
                <LogOut size={16} />
                <span>{t('logout')} ({user})</span>
              </button>
            ) : (
              <div className="mobile-auth-grid">
                <a
                  href="/login"
                  className="auth-btn auth-btn-login full-width"
                  onClick={(e) => handleNav(e, '/login')}
                >
                  <LogIn size={16} />
                  <span>{t('login')}</span>
                </a>
                <a
                  href="/register"
                  className="auth-btn auth-btn-register full-width"
                  onClick={(e) => handleNav(e, '/register')}
                >
                  <UserPlus size={16} />
                  <span>{t('register')}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
