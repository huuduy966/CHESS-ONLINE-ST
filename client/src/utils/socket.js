import { io } from 'socket.io-client'

// Mặc định: nếu chạy production (server serve client) → cùng origin
// Dev: VITE_SERVER_URL hoặc fallback theo hostname kết nối
const URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : (typeof window !== 'undefined' && window.location.hostname ? `http://${window.location.hostname}:3001` : 'http://localhost:3001'))

export const socket = io(URL, { autoConnect: false })
