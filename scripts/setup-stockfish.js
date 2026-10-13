import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const STOCKFISH_DIR = path.join(ROOT, 'stockfish')

async function setup() {
  console.log('[Setup Stockfish] Checking Stockfish environment...')

  if (!fs.existsSync(STOCKFISH_DIR)) {
    fs.mkdirSync(STOCKFISH_DIR, { recursive: true })
  }

  const isWin = process.platform === 'win32'
  if (isWin) {
    const winExe = path.join(STOCKFISH_DIR, 'stockfish-windows-x86-64-universal.exe')
    if (fs.existsSync(winExe)) {
      console.log('[Setup Stockfish] Found Windows Stockfish binary:', winExe)
    } else {
      console.log('[Setup Stockfish] Windows binary not found. Minimax AI will be used as fallback if not provided.')
    }
    return
  }

  // Linux / macOS
  const linuxBin = path.join(STOCKFISH_DIR, 'stockfish-linux-x86-64-universal')
  const defaultBin = path.join(STOCKFISH_DIR, 'stockfish')

  if (fs.existsSync(linuxBin) || fs.existsSync(defaultBin)) {
    const bin = fs.existsSync(linuxBin) ? linuxBin : defaultBin
    try {
      fs.chmodSync(bin, 0o755)
    } catch {}
    console.log('[Setup Stockfish] Stockfish Linux binary already exists:', bin)
    return
  }

  // Check if system stockfish is available (e.g. via apt)
  try {
    const sysPath = execSync('which stockfish || echo ""', { encoding: 'utf8' }).trim()
    if (sysPath && fs.existsSync(sysPath)) {
      console.log('[Setup Stockfish] Found system stockfish at:', sysPath)
      return
    }
  } catch {}

  console.log('[Setup Stockfish] Downloading Stockfish 19 Linux binary from official GitHub releases...')
  const tarUrl = 'https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-linux-x86-64-universal.tar.gz'
  const tarPath = path.join(STOCKFISH_DIR, 'temp-stockfish.tar.gz')

  try {
    // Download via curl (available on all Linux/Render images)
    execSync(`curl -L -s --max-time 120 "${tarUrl}" -o "${tarPath}"`, {
      stdio: 'inherit',
      timeout: 130000
    })

    if (fs.existsSync(tarPath) && fs.statSync(tarPath).size > 1000000) {
      console.log('[Setup Stockfish] Extracting Linux binary...')
      execSync(`tar -xzf "${tarPath}" -C "${ROOT}" "stockfish/stockfish-linux-x86-64-universal"`, {
        stdio: 'inherit'
      })

      if (fs.existsSync(linuxBin)) {
        fs.chmodSync(linuxBin, 0o755)
        console.log('[Setup Stockfish] Stockfish 19 Linux binary setup successfully at:', linuxBin)
      }
    } else {
      console.warn('[Setup Stockfish] Downloaded archive appears too small or incomplete.')
    }
  } catch (err) {
    console.warn('[Setup Stockfish] Download/extraction failed:', err.message)
    console.warn('[Setup Stockfish] The server will safely fall back to the built-in Minimax AI engine.')
  } finally {
    if (fs.existsSync(tarPath)) {
      try { fs.unlinkSync(tarPath) } catch {}
    }
  }
}

setup().catch((err) => {
  console.warn('[Setup Stockfish] Warning in setup:', err.message)
  process.exit(0)
})
