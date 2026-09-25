import db from './database/db.js'

async function testConnection() {
  console.log(' Đang kiểm tra kết nối đến cơ sở dữ liệu SQLite...')
  try {
    const userCount = db.prepare('SELECT count(*) as count FROM users').get()
    const gameCount = db.prepare('SELECT count(*) as count FROM games').get()

    console.log(' Kết nối thành công đến SQLite Database (chess.db)!')
    console.log(`- Số lượng người dùng hiện có: ${userCount.count}`)
    console.log(`- Số lượng ván cờ đã lưu: ${gameCount.count}`)

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    console.log('- Các bảng trong Database:', tables.map(t => t.name).filter(n => !n.startsWith('sqlite_')))
  } catch (err) {
    console.error(' Kết nối SQLite thất bại! Chi tiết lỗi:')
    console.error(err.message)
  }
}

testConnection()
