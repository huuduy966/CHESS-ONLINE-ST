import { useLocation } from 'react-router-dom'
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  Trophy
} from 'lucide-react'
import LanguageToggle from './LanguageToggle.jsx'
import SoundToggle from './SoundToggle.jsx'
import { useAuth } from '../utils/auth.jsx'
import { useGameLock } from '../utils/gameLock.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const { isGameLocked, requestNavigation } = useGameLock()
  const { t } = useLanguage()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleNav = (e, to) => {
    e.preventDefault()
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

        {/* Right Section: Profile, Login, Register, Utilities */}
        <div className="nav-right">
          {/* Language & Sound */}
          <div className="nav-utils">
            <LanguageToggle />
            <SoundToggle />
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

        </div>
      </nav>
    </header>
  )
}
