import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import { useLanguage } from '../utils/language.jsx'

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : 'http://localhost:3001')

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    if (!u || !password) return setError('Nhập đủ thông tin')

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password })
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        return setError(data.error || 'Sai tên đăng nhập hoặc mật khẩu')
      }

      login(data.user || u)
      navigate('/')
    } catch (err) {
      setError('Không thể kết nối đến máy chủ: ' + err.message)
    }
  }

  return (
    <div className="lobby">
      <form className="lobby-card auth-card" onSubmit={submit}>
        <h2>{t('loginTitle')}</h2>
        <label className="muted">{t('usernameLabel')}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus />
        <label className="muted">{t('passwordLabel')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <div className="auth-actions">
          <button className="btn" type="submit">{t('loginTitle')}</button>
        </div>
        <p className="muted" style={{ textAlign: 'center' }}>
          {t('noAccountYet')} <Link to="/register" style={{ color: 'var(--accent)' }}>{t('registerTitle')}</Link>
        </p>
        {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
      </form>
    </div>
  )
}
