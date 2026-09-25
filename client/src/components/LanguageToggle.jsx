import { useLanguage } from '../utils/language.jsx'

export default function LanguageToggle() {
  const { lang, toggleLang } = useLanguage()

  return (
    <button
      className="theme-toggle lang-toggle"
      onClick={toggleLang}
      title={lang === 'vi' ? 'Ngôn ngữ: Tiếng Việt (Bấm để đổi sang en)' : 'Language: English (Click to switch to vi)'}
      aria-label="Toggle language"
      type="button"
    >
      <span className="lang-code-tag">{lang}</span>
    </button>
  )
}
