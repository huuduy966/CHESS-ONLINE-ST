import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sfx } from '../utils/sound.js'
import { useLanguage } from '../utils/language.jsx'

export default function SoundToggle() {
  const [on, setOn] = useState(sfx.isEnabled())
  const { lang } = useLanguage()

  const click = () => {
    const next = !on
    sfx.setEnabled(next)
    setOn(next)
    if (next) sfx.move() // preview
  }

  const title = on
    ? (lang === 'en' ? 'Mute sound' : 'Tắt âm thanh')
    : (lang === 'en' ? 'Unmute sound' : 'Bật âm thanh')

  return (
    <button className="theme-toggle" onClick={click} title={title} aria-label="Toggle sound">
      {on ? <Volume2 size={18} className="text-cyan" /> : <VolumeX size={18} />}
    </button>
  )
}
