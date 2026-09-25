import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import { useLanguage } from '../utils/language.jsx'

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : 'http://localhost:3001')

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    if (!u || !password) return setError('Nhập đủ thông tin')
    if (u.length < 3) return setError('Tên đăng nhập tối thiểu 3 ký tự')
    if (password.length < 4) return setError('Mật khẩu tối thiểu 4 ký tự')
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp')

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password })
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        return setError(data.error || 'Đăng ký thất bại')
      }

      login(data.user?.username || u)
      navigate('/')
    } catch (err) {
      setError('Không thể kết nối đến máy chủ: ' + err.message)
    }
  }

  return (
    <div className="lobby">
      <form className="lobby-card auth-card" onSubmit={submit}>
        <h2>{t('registerTitle')}</h2>
        <label className="muted">{t('usernameLabel')}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus />
        <label className="muted">{t('passwordLabel')}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <label className="muted">{t('confirmPasswordLabel')}</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        <div className="auth-actions">
          <button className="btn" type="submit">{t('registerTitle')}</button>
        </div>
        <p className="muted" style={{ textAlign: 'center' }}>
          {t('haveAccountAlready')} <Link to="/login" style={{ color: 'var(--accent)' }}>{t('loginTitle')}</Link>
        </p>
        {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
      </form>
    </div>
  )
}
