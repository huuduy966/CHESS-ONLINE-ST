import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import LocalGame from './pages/LocalGame.jsx'
import AIGame from './pages/AIGame.jsx'
import OnlineLobby from './pages/OnlineLobby.jsx'
import OnlineGame from './pages/OnlineGame.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Review from './pages/Review.jsx'
import Navbar from './components/Navbar.jsx'
import BackButton from './components/BackButton.jsx'
import { useGameLock } from './utils/gameLock.jsx'

export default function App() {
  const location = useLocation()
  const { isGameLocked } = useGameLock()
  const isOnlineRoom = location.pathname.startsWith('/online/')
  const showBack = location.pathname !== '/' && !isGameLocked && !isOnlineRoom
  const backTo = null

  return (
    <div className="app">
      <Navbar />

      {showBack && (
        <div className="back-bar">
          <BackButton to={backTo} />
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/local" element={<LocalGame />} />
          <Route path="/ai" element={<AIGame />} />
          <Route path="/online" element={<OnlineLobby />} />
          <Route path="/online/:roomId" element={<OnlineGame />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review" element={<Review />} />
        </Routes>
      </main>
    </div>
  )
}
