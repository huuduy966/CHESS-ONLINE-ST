import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useGameLock } from '../utils/gameLock.jsx'
import { useLanguage } from '../utils/language.jsx'

export default function BackButton({ to, label }) {
  const navigate = useNavigate()
  const { isGameLocked, requestNavigation } = useGameLock()
  const { t } = useLanguage()

  // Không hiển thị nút quay lại khi đang trong trận đấu
  if (isGameLocked) return null

  const displayLabel = label || t('back')

  const onClick = () => {
    if (isGameLocked) {
      requestNavigation(to || '/')
    } else {
      if (to) navigate(to)
      else navigate(-1)
    }
  }

  return (
    <button className="back-btn" onClick={onClick} type="button">
      <ArrowLeft size={16} />
      <span>{displayLabel}</span>
    </button>
  )
}
