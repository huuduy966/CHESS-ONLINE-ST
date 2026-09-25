import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Flag, X } from 'lucide-react'
import { useLanguage } from './language.jsx'

const GameLockContext = createContext({
  isGameLocked: false,
  setGameLocked: () => {},
  setResignHandler: () => {},
  requestNavigation: () => true
})

export function GameLockProvider({ children }) {
  const [isGameLocked, setGameLocked] = useState(false)
  const [resignHandler, setResignHandler] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Intercept browser reload or close when locked
  useEffect(() => {
    if (!isGameLocked) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Trận đấu đang diễn ra! Bạn sẽ bị xử thua (đầu hàng) nếu rời đi.'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isGameLocked])

  // Request navigation: returns true if allowed, or opens confirmation modal
  const requestNavigation = useCallback(
    (targetPath) => {
      if (!isGameLocked) {
        if (typeof targetPath === 'string') navigate(targetPath)
        return true
      }

      // Game is locked: open modal asking to resign
      setPendingNavigation(targetPath)
      setShowConfirmModal(true)
      return false
    },
    [isGameLocked, navigate]
  )

  // Confirm Resign and Leave
  const handleConfirmResignAndLeave = () => {
    if (resignHandler) {
      try {
        resignHandler()
      } catch (e) {
        console.error('Error during resign:', e)
      }
    }
    setGameLocked(false)
    setShowConfirmModal(false)

    if (pendingNavigation) {
      if (typeof pendingNavigation === 'string') {
        navigate(pendingNavigation)
      } else if (typeof pendingNavigation === 'function') {
        pendingNavigation()
      }
      setPendingNavigation(null)
    } else {
      navigate('/online')
    }
  }

  const handleCancelLeave = () => {
    setShowConfirmModal(false)
    setPendingNavigation(null)
  }

  return (
    <GameLockContext.Provider
      value={{
        isGameLocked,
        setGameLocked,
        setResignHandler: (fn) => setResignHandler(() => fn),
        requestNavigation
      }}
    >
      {children}

      {/* Confirmation Modal when trying to leave active match */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal lock-warning-modal">
            <div className="lock-modal-icon-box">
              <AlertTriangle size={36} className="text-amber" />
            </div>

            <h2>{t('gameLockTitle')}</h2>

            <p className="muted" style={{ lineHeight: 1.6 }}>
              {t('gameLockDesc')}
            </p>

            <div className="lock-modal-actions">
              <button
                type="button"
                className="btn secondary full-width"
                onClick={handleCancelLeave}
              >
                {t('resumeMatchBtn')}
              </button>
              <button
                type="button"
                className="btn danger full-width"
                onClick={handleConfirmResignAndLeave}
              >
                <Flag size={16} /> {t('resignAndLeaveBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLockContext.Provider>
  )
}

export function useGameLock() {
  return useContext(GameLockContext)
}
