import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import {
  Brain,
  Home,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCw,
  Sparkles,
  Trophy,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  Zap,
  Info,
  Fish
} from 'lucide-react'
import { analyzeGame, CLASS_LABEL, CLASS_COLOR, CLASSES } from '../utils/analysis.js'
import { PieceCircle } from '../components/PieceCircle.jsx'
import { useLanguage } from '../utils/language.jsx'

const ORDER = ['brilliant', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']

function getClassificationIcon(cls) {
  switch (cls) {
    case 'brilliant':
      return <Sparkles size={16} className="class-icon-brilliant" />
    case 'best':
      return <Award size={16} className="class-icon-best" />
    case 'excellent':
      return <CheckCircle2 size={16} className="class-icon-excellent" />
    case 'good':
      return <CheckCircle2 size={16} className="class-icon-good" />
    case 'inaccuracy':
      return <HelpCircle size={16} className="class-icon-inacc" />
    case 'mistake':
      return <AlertTriangle size={16} className="class-icon-mistake" />
    case 'blunder':
      return <XCircle size={16} className="class-icon-blunder" />
    default:
      return <Info size={16} />
  }
}

function getClassLabel(cls, t) {
  switch (cls) {
    case 'brilliant': return t('classBrilliant')
    case 'best': return t('classBest')
    case 'excellent': return t('classExcellent')
    case 'good': return t('classGood')
    case 'inaccuracy': return t('classInaccuracy')
    case 'mistake': return t('classMistake')
    case 'blunder': return t('classBlunder')
    default: return CLASS_LABEL[cls] || cls
  }
}

function getCoachCommentary(move, t) {
  if (!move) return null
  const san = move.san
  const best = move.bestSAN
  const cpLoss = Math.round(move.cpLoss || 0)
  const bestText = best && best !== san ? t('suggestBestMove', { best }) : ''

  switch (move.classification) {
    case 'brilliant':
      return {
        title: t('brilliantTitle'),
        desc: t('brilliantDesc', { san })
      }
    case 'best':
      return {
        title: t('bestTitle'),
        desc: t('bestDesc', { san })
      }
    case 'excellent':
      return {
        title: t('excellentTitle'),
        desc: t('excellentDesc', { san })
      }
    case 'good':
      return {
        title: t('goodTitle'),
        desc: t('goodDesc', { san })
      }
    case 'inaccuracy':
      return {
        title: t('inaccuracyTitle'),
        desc: t('inaccuracyDesc', { san, cpLoss, best: bestText })
      }
    case 'mistake':
      return {
        title: t('mistakeTitle'),
        desc: t('mistakeDesc', { san, cpLoss, best: bestText })
      }
    case 'blunder':
      return {
        title: t('blunderTitle'),
        desc: t('blunderDesc', { san, cpLoss, best: bestText })
      }
    default:
      return {
        title: t('playedMoveTitle'),
        desc: t('playedMoveDesc', { san })
      }
  }
}

export default function Review() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { t } = useLanguage()
  const sanMoves = state?.sanMoves
  const whiteName = state?.whiteName || t('whiteRoleSub')
  const blackName = state?.blackName || t('blackRoleSub')
  const myColor = state?.myColor || 'w'

  const [analysis, setAnalysis] = useState(null)
  const [ply, setPly] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [boardOrientation, setBoardOrientation] = useState(() => (myColor === 'b' ? 'black' : 'white'))
  const activeMoveRef = useRef(null)

  // Phân tích ván đấu bằng đầu não Stockfish 19
  useEffect(() => {
    if (!sanMoves || sanMoves.length === 0) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    const runAnalysis = async () => {
      try {
        const result = await analyzeGame(sanMoves, { depth: state?.depth ?? 10 })
        if (!cancelled && result) {
          setAnalysis(result)
          setLoading(false)
          setPly(sanMoves.length) // Mặc định mở ở cuối ván để xem tổng quan
        }
      } catch (err) {
        console.error('[Review] Analysis error:', err)
        if (!cancelled) setLoading(false)
      }
    }

    runAnalysis()

    return () => {
      cancelled = true
    }
  }, [sanMoves, state?.depth])

  // Tự động replay khi bấm Play
  useEffect(() => {
    if (!isPlaying || !sanMoves) return
    const id = setInterval(() => {
      setPly((prev) => {
        if (prev >= sanMoves.length) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1300)
    return () => clearInterval(id)
  }, [isPlaying, sanMoves])

  // Phím tắt bàn phím: Mũi tên trái/phải để chuyển nước, Space để Play/Pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!sanMoves) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPly((p) => Math.max(0, p - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPly((p) => Math.min(sanMoves.length, p + 1))
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((playing) => !playing)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sanMoves])

  // Tự động cuộn nước đi đang xem vào tầm nhìn
  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [ply])

  // Vị trí FEN hiện tại dựa trên ply
  const currentFen = useMemo(() => {
    if (!sanMoves) return new Chess().fen()
    const g = new Chess()
    for (let i = 0; i < ply; i++) {
      try {
        g.move(sanMoves[i])
      } catch {
        break
      }
    }
    return g.fen()
  }, [sanMoves, ply])

  // Thông tin nước đi hiện tại
  const currentMove = ply > 0 && analysis ? analysis.moves[ply - 1] : null
  const commentary = currentMove ? getCoachCommentary(currentMove, t) : null

  // Đánh giá thế cờ (Eval bar)
  const evalScore = useMemo(() => {
    if (!currentMove) return '0.0'
    const val = Number(currentMove.evalAfter) || 0
    const inPawns = Math.abs(val) > 100 ? val / 100 : val
    return inPawns.toFixed(1)
  }, [currentMove])

  // Nhảy nhanh đến nước đi theo phân loại chất lượng
  const jumpToClassification = useCallback(
    (cls) => {
      if (!analysis?.moves || analysis.moves.length === 0) return
      const moves = analysis.moves
      const nextIdx = moves.findIndex((m, idx) => idx >= ply && m.classification === cls)
      if (nextIdx !== -1) {
        setPly(nextIdx + 1)
        return
      }
      const firstIdx = moves.findIndex((m) => m.classification === cls)
      if (firstIdx !== -1) {
        setPly(firstIdx + 1)
      }
    },
    [analysis, ply]
  )

  // Highlight ô cờ của nước đi hiện tại
  const customSquareStyles = useMemo(() => {
    if (!currentMove) return {}
    const cls = currentMove.classification
    const color = CLASS_COLOR[cls] || '#f59e0b'
    return {
      [currentMove.san]: {
        backgroundColor: `${color}33`,
        boxShadow: `inset 0 0 10px ${color}`
      }
    }
  }, [currentMove])

  if (!sanMoves || sanMoves.length === 0) {
    return (
      <div className="lobby">
        <div className="lobby-card auth-card">
          <Brain size={36} className="text-cyan" style={{ margin: '0 auto' }} />
          <h2>{t('noReviewDataTitle')}</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            {t('noReviewDataDesc')}
          </p>
          <button className="btn" onClick={() => navigate('/')} style={{ margin: '0 auto' }}>
            <Home size={16} /> {t('returnHomeDirect')}
          </button>
        </div>
      </div>
    )
  }

  if (loading || !analysis) {
    return (
      <div className="lobby">
        <div className="lobby-card auth-card review-loading-card">
          <div className="review-spinner-box">
            <div className="spinner" />
            <Fish size={24} className="spinner-center-icon text-cyan" />
          </div>
          <h2>{t('analyzingReviewTitle')}</h2>
          <p className="muted" style={{ textAlign: 'center' }}>
            {t('analyzingReviewDesc')}
          </p>
        </div>
      </div>
    )
  }

  const accW = analysis.accuracy.w
  const accB = analysis.accuracy.b

  return (
    <div className="review-page-container">
      {/* Top Header Bar */}
      <div className="review-top-header">
        <div className="review-title-group">
          <div className="review-badge-tag">
            <Fish size={15} className="text-cyan" />
            <span>{t('reviewTopTag')}</span>
          </div>
          <h2>{t('reviewMainTitle')}</h2>
        </div>

        <div className="review-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn secondary btn-sm" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={16} />
            <span>{t('back')}</span>
          </button>
          <button className="btn secondary btn-sm" onClick={() => navigate('/')} type="button">
            <Home size={16} />
            <span>{t('returnHomeDirect')}</span>
          </button>
        </div>
      </div>

      {/* Accuracy Comparison Showcase Cards */}
      <div className="review-accuracy-showcase">
        {/* White Card */}
        <div className={`acc-showcase-card ${accW >= accB ? 'acc-card-winner' : ''}`}>
          <div className="acc-card-left">
            <span className="acc-piece-avatar">
              <PieceCircle color="white" size={20} />
            </span>
            <div className="acc-player-meta">
              <strong>{whiteName}</strong>
              <span className="acc-role-sub">{t('whiteRoleSub')}</span>
            </div>
          </div>
          <div className="acc-card-right">
            <div className="acc-score-display">
              <span className="acc-number">{accW}%</span>
              <span className="acc-label">{t('accuracyLabel')}</span>
            </div>
            <div className="acc-bar-track">
              <div
                className="acc-bar-fill acc-fill-white"
                style={{ width: `${accW}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Center VS Chip */}
        <div className="acc-vs-badge">VS</div>

        {/* Black Card */}
        <div className={`acc-showcase-card ${accB > accW ? 'acc-card-winner' : ''}`}>
          <div className="acc-card-left">
            <span className="acc-piece-avatar">
              <PieceCircle color="black" size={20} />
            </span>
            <div className="acc-player-meta">
              <strong>{blackName}</strong>
              <span className="acc-role-sub">{t('blackRoleSub')}</span>
            </div>
          </div>
          <div className="acc-card-right">
            <div className="acc-score-display">
              <span className="acc-number">{accB}%</span>
              <span className="acc-label">{t('accuracyLabel')}</span>
            </div>
            <div className="acc-bar-track">
              <div
                className="acc-bar-fill acc-fill-black"
                style={{ width: `${accB}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Workspace */}
      <div className="review-workspace-grid">
        {/* Left Column: Classification Stats Breakdown */}
        <div className="panel review-side-panel">
          <div className="panel-title-with-icon">
            <Award size={18} className="text-yellow" />
            <h3>{t('moveQualityTitle')}</h3>
            <span className="stockfish-engine-tag">
              <Fish size={12} className="text-cyan" /> SF 19
            </span>
          </div>

          <div className="review-stats-table">
            <div className="stats-table-head">
              <span className="head-col-class">{t('classificationHead')}</span>
              <span className="head-col-player">
                <PieceCircle color="white" size={13} style={{ marginRight: '4px' }} />
                <span>{t('whiteSeat')}</span>
              </span>
              <span className="head-col-player">
                <PieceCircle color="black" size={13} style={{ marginRight: '4px' }} />
                <span>{t('blackSeat')}</span>
              </span>
            </div>

            {ORDER.map((cls) => {
              const countW = analysis.stats.w[cls] || 0
              const countB = analysis.stats.b[cls] || 0
              const hasMoves = countW > 0 || countB > 0

              return (
                <div
                  className={`stats-table-row ${hasMoves ? 'clickable-class-row' : ''}`}
                  key={cls}
                  onClick={() => hasMoves && jumpToClassification(cls)}
                  title={hasMoves ? `${t('jumpToMove')} ${getClassLabel(cls, t)}` : ''}
                >
                  <div className="stats-class-item">
                    <span className="stats-icon-wrap" style={{ color: CLASS_COLOR[cls] }}>
                      {getClassificationIcon(cls)}
                    </span>
                    <span className="stats-class-name">{getClassLabel(cls, t)}</span>
                  </div>
                  <span className={`stats-count-cell count-w ${countW > 0 ? 'has-count' : 'zero-count'}`}>
                    {countW}
                  </span>
                  <span className={`stats-count-cell count-b ${countB > 0 ? 'has-count' : 'zero-count'}`}>
                    {countB}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Dedicated Stockfish 19 Accuracy Evaluation Card */}
          <div className="review-engine-accuracy-card">
            <div className="engine-acc-header">
              <div className="engine-acc-title">
                <Fish size={14} className="text-cyan" />
                <span>{t('sf19AccuracyTitle')}</span>
              </div>
              <span className="engine-acc-chip">NNUE</span>
            </div>

            <div className="engine-acc-bars-grid">
              <div className="engine-acc-item">
                <div className="engine-acc-label-row">
                  <span className="acc-player-label">
                    <PieceCircle color="white" size={12} /> {whiteName}
                  </span>
                  <strong className="acc-val-num">{accW}%</strong>
                </div>
                <div className="acc-mini-bar-track">
                  <div
                    className="acc-mini-bar-fill fill-w"
                    style={{ width: `${accW}%` }}
                  ></div>
                </div>
              </div>

              <div className="engine-acc-item">
                <div className="engine-acc-label-row">
                  <span className="acc-player-label">
                    <PieceCircle color="black" size={12} /> {blackName}
                  </span>
                  <strong className="acc-val-num">{accB}%</strong>
                </div>
                <div className="acc-mini-bar-track">
                  <div
                    className="acc-mini-bar-fill fill-b"
                    style={{ width: `${accB}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="review-tip-box">
            <div className="tip-box-title">
              <Lightbulb size={16} className="text-amber" />
              <strong>{t('controlTipsTitle')}</strong>
            </div>
            <p className="muted">
              {t('controlTipsDesc')}
            </p>
          </div>
        </div>

        {/* Center Column: Interactive Chessboard & Coach Commentary */}
        <div className="review-center-stage">
          {/* Evaluation Advantage Bar */}
          <div className="review-eval-bar-box">
            <div className="eval-bar-header">
              <span>{t('currentPositionTitle')}</span>
              <strong className="eval-bar-val">
                {Number(evalScore) > 0
                  ? `+${evalScore} (${t('whiteFavored')})`
                  : Number(evalScore) < 0
                  ? `${evalScore} (${t('blackFavored')})`
                  : `0.0 (${t('balancedPosition')})`}
              </strong>
            </div>
            <div className="eval-track">
              <div
                className="eval-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, 50 + Number(evalScore) * 5))}%`
                }}
              ></div>
            </div>
          </div>

          {/* Board Surface */}
          <div className="review-board-wrap">
            <div className="board-inner">
              <Chessboard
                position={currentFen}
                boardOrientation={boardOrientation}
                arePiecesDraggable={false}
                customSquareStyles={customSquareStyles}
                customDarkSquareStyle={{ backgroundColor: '#2f4858' }}
                customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
                animationDuration={250}
              />
            </div>
          </div>

          {/* Stepper Controls Bar */}
          <div className="review-controls-bar">
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setPly(0)}
              disabled={ply === 0}
              title={t('stepStartTip')}
            >
              <ChevronsLeft size={20} />
            </button>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setPly((p) => Math.max(0, p - 1))}
              disabled={ply === 0}
              title={t('stepBackTip')}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className={`ctrl-btn ctrl-btn-play ${isPlaying ? 'active-play' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? t('pauseAutoTip') : t('playAutoTip')}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setPly((p) => Math.min(sanMoves.length, p + 1))}
              disabled={ply === sanMoves.length}
              title={t('stepNextTip')}
            >
              <ChevronRight size={20} />
            </button>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() => setPly(sanMoves.length)}
              disabled={ply === sanMoves.length}
              title={t('stepEndTip')}
            >
              <ChevronsRight size={20} />
            </button>

            <div className="ctrl-ply-counter">
              <span>{ply}</span> / <strong>{sanMoves.length}</strong>
            </div>

            <button
              type="button"
              className="ctrl-btn"
              onClick={() =>
                setBoardOrientation((o) => (o === 'white' ? 'black' : 'white'))
              }
              title={t('flipBoardTip')}
            >
              <RotateCw size={18} />
            </button>
          </div>

          {/* AI Coach Commentary Card */}
          {currentMove && commentary && (
            <div
              className="coach-commentary-card"
              style={{
                borderLeftColor: CLASS_COLOR[currentMove.classification]
              }}
            >
              <div className="commentary-header">
                <div className="commentary-move-badge">
                  {getClassificationIcon(currentMove.classification)}
                  <span
                    className="commentary-class-name"
                    style={{ color: CLASS_COLOR[currentMove.classification] }}
                  >
                    {getClassLabel(currentMove.classification, t)}
                  </span>
                  <span className="commentary-san">
                    {Math.ceil((currentMove.ply + 1) / 2)}.
                    {currentMove.turn === 'w' ? '' : '..'}{currentMove.san}
                  </span>
                </div>

                {currentMove.bestSAN && currentMove.bestSAN !== currentMove.san && (
                  <div className="best-move-suggestion">
                    <span>{t('engineRecommends')}</span>
                    <strong>{currentMove.bestSAN}</strong>
                  </div>
                )}
              </div>

              <div className="commentary-body">
                <strong>{commentary.title}</strong>
                <p>{commentary.desc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Move List Notation (Score Sheet) */}
        <div className="panel review-side-panel">
          <div className="panel-title-with-icon">
            <TrendingUp size={18} className="text-cyan" />
            <h3>{t('notationSheetTitle')}</h3>
          </div>

          <div className="score-sheet-container">
            <div className="score-sheet-table">
              {Array.from({ length: Math.ceil(analysis.moves.length / 2) }).map(
                (_, idx) => {
                  const whiteMove = analysis.moves[idx * 2]
                  const blackMove = analysis.moves[idx * 2 + 1]
                  const whitePly = idx * 2 + 1
                  const blackPly = idx * 2 + 2

                  return (
                    <div className="score-sheet-row" key={idx}>
                      <span className="score-move-num">{idx + 1}.</span>

                      {/* White Move Cell */}
                      {whiteMove ? (
                        <button
                          type="button"
                          className={`score-move-cell ${
                            ply === whitePly ? 'active-cell' : ''
                          }`}
                          ref={ply === whitePly ? activeMoveRef : null}
                          onClick={() => setPly(whitePly)}
                        >
                          <span className="score-san">{whiteMove.san}</span>
                          <span
                            className="score-class-dot"
                            style={{
                              backgroundColor:
                                CLASS_COLOR[whiteMove.classification]
                            }}
                            title={CLASS_LABEL[whiteMove.classification]}
                          ></span>
                        </button>
                      ) : (
                        <span className="score-move-empty"></span>
                      )}

                      {/* Black Move Cell */}
                      {blackMove ? (
                        <button
                          type="button"
                          className={`score-move-cell ${
                            ply === blackPly ? 'active-cell' : ''
                          }`}
                          ref={ply === blackPly ? activeMoveRef : null}
                          onClick={() => setPly(blackPly)}
                        >
                          <span className="score-san">{blackMove.san}</span>
                          <span
                            className="score-class-dot"
                            style={{
                              backgroundColor:
                                CLASS_COLOR[blackMove.classification]
                            }}
                            title={CLASS_LABEL[blackMove.classification]}
                          ></span>
                        </button>
                      ) : (
                        <span className="score-move-empty"></span>
                      )}
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
