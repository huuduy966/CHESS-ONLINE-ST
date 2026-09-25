import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { DEFAULT_ELO, eloDelta } from './elo.js'

const AuthContext = createContext(null)

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : 'http://localhost:3001')

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem('chess-current-user') || null)
  const [profile, setProfile] = useState(() => {
    const cachedUser = localStorage.getItem('chess-current-user')
    if (cachedUser) {
      try {
        const cached = localStorage.getItem('chess-profile-cache-' + cachedUser.toLowerCase())
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return null
  })

  // Tải thông tin người chơi & lịch sử ván cờ từ SQLite Database (Backend)
  const refreshProfile = useCallback(async (name) => {
    if (!name) {
      setProfile(null)
      return
    }
    const cleanName = name.trim()
    try {
      const res = await fetch(`${SERVER_URL}/api/users/${encodeURIComponent(cleanName)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.user) {
          setProfile(data.user)
          try {
            localStorage.setItem('chess-profile-cache-' + cleanName.toLowerCase(), JSON.stringify(data.user))
          } catch {}
          return
        }
      }
    } catch (err) {
      console.warn('[auth] Không thể tải dữ liệu từ server (sử dụng cache):', err.message)
    }
  }, [])

  useEffect(() => {
    if (user) refreshProfile(user)
  }, [user, refreshProfile])

  useEffect(() => {
    const onStorage = () => {
      const cur = localStorage.getItem('chess-current-user') || null
      setUser(cur)
      if (cur) refreshProfile(cur)
      else setProfile(null)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('chess-auth-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('chess-auth-changed', onStorage)
    }
  }, [refreshProfile])

  const login = useCallback((userData) => {
    const username = typeof userData === 'string' ? userData.trim() : userData?.username?.trim()
    if (!username) return

    localStorage.setItem('chess-current-user', username)
    localStorage.setItem('chess-name', username)
    setUser(username)

    if (typeof userData === 'object' && userData !== null && userData.elo !== undefined) {
      setProfile(userData)
      try {
        localStorage.setItem('chess-profile-cache-' + username.toLowerCase(), JSON.stringify(userData))
      } catch {}
    }

    refreshProfile(username)
    window.dispatchEvent(new Event('chess-auth-changed'))
  }, [refreshProfile])

  const logout = useCallback(() => {
    const cur = localStorage.getItem('chess-current-user')
    if (cur) {
      try {
        localStorage.removeItem('chess-profile-cache-' + cur.toLowerCase())
      } catch {}
    }
    localStorage.removeItem('chess-current-user')
    setUser(null)
    setProfile(null)
    window.dispatchEvent(new Event('chess-auth-changed'))
  }, [])

  // Ghi nhận kết quả 1 trận cờ: score 1/0.5/0, oppElo, mode, meta
  const recordGame = useCallback((score, oppElo, mode, meta = {}) => {
    if (!user) return null

    const prevElo = profile?.elo ?? DEFAULT_ELO
    const isAi = mode === 'ai'
    const delta = isAi ? 0 : eloDelta(prevElo, oppElo, score)
    const newElo = isAi ? prevElo : prevElo + delta
    const currentMoves = Array.isArray(meta.moves) ? meta.moves.slice() : []

    // 1. Cập nhật state UI ngay tức thì để hiển thị Modal kết quả không bị lag/chậm
    setProfile((prev) => {
      const baseWins = prev?.wins ?? 0
      const baseLosses = prev?.losses ?? 0
      const baseDraws = prev?.draws ?? 0
      const newWins = baseWins + (score === 1 ? 1 : 0)
      const newLosses = baseLosses + (score === 0 ? 1 : 0)
      const newDraws = baseDraws + (score === 0.5 ? 1 : 0)

      const newHistoryItem = {
        ts: Date.now(),
        mode,
        score,
        oppElo: oppElo || 1200,
        opponent: meta.opponent || (isAi ? 'Stockfish Bot' : 'Đối thủ'),
        delta,
        newElo,
        moves: currentMoves,
        whiteName: meta.whiteName,
        blackName: meta.blackName,
        myColor: meta.myColor
      }

      const updatedProfile = {
        ...(prev || { id: 0, username: user, createdAt: new Date().toISOString() }),
        elo: newElo,
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        history: [newHistoryItem, ...(prev?.history || [])].slice(0, 50)
      }

      try {
        localStorage.setItem('chess-profile-cache-' + user.toLowerCase(), JSON.stringify(updatedProfile))
      } catch {}

      return updatedProfile
    })

    // 2. Gửi request lưu vĩnh viễn vào SQLite Database
    fetch(`${SERVER_URL}/api/games/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user,
        score,
        oppElo: oppElo || 1200,
        opponentName: meta.opponent || (isAi ? 'Stockfish Bot' : 'Đối thủ'),
        mode: mode || 'online',
        moves: currentMoves,
        delta,
        newElo,
        whiteName: meta.whiteName,
        blackName: meta.blackName,
        myColor: meta.myColor
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.ok) {
          console.warn('[auth] Cảnh báo khi lưu ván cờ vào SQLite:', data?.error)
        }
      })
      .catch((err) => console.error('[auth] Lỗi mạng khi lưu ván cờ:', err.message))

    window.dispatchEvent(new Event('chess-auth-changed'))
    return { delta, newElo, prevElo }
  }, [user, profile])

  // Cập nhật danh sách moves cho ván cờ vừa diễn ra (khi đầu hàng hoặc hết giờ)
  const updateLastGameMoves = useCallback((moves, extra = {}) => {
    if (!user || !Array.isArray(moves) || moves.length === 0) return

    setProfile((prev) => {
      if (!prev || !Array.isArray(prev.history) || prev.history.length === 0) return prev
      const updatedHistory = [...prev.history]
      updatedHistory[0] = {
        ...updatedHistory[0],
        moves: moves.slice(),
        whiteName: extra.whiteName || updatedHistory[0].whiteName,
        blackName: extra.blackName || updatedHistory[0].blackName,
        myColor: extra.myColor || updatedHistory[0].myColor,
        opponent: extra.opponent || updatedHistory[0].opponent,
        oppElo: extra.oppElo || updatedHistory[0].oppElo
      }
      const newProf = { ...prev, history: updatedHistory }
      try {
        localStorage.setItem('chess-profile-cache-' + user.toLowerCase(), JSON.stringify(newProf))
      } catch {}
      return newProf
    })

    fetch(`${SERVER_URL}/api/games/update-moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user,
        moves,
        whiteName: extra.whiteName,
        blackName: extra.blackName,
        myColor: extra.myColor
      })
    }).catch(() => {})
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        login,
        logout,
        recordGame,
        updateLastGameMoves,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
