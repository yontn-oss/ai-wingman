'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react'
import { ModeSelector } from '@/components/mode-selector'
import type { DiscoveryMode } from '@/components/mode-selector'
import { EngineToggle } from '@/components/engine-toggle'
import type { CurationEngine } from '@/components/engine-toggle'
import { TrackCard } from '@/components/track-card'
import type { SetlistTrack } from '@/lib/tools'
import { CAMELOT_COLORS } from '@/lib/camelot'

interface LaterTrack {
  track: SetlistTrack
  dismissCount: number
  playedCountAtDismissal: number
}

type HistoryStatus = 'played' | 'skipped' | 'later'
interface HistoryEntry { track: SetlistTrack; status: HistoryStatus }

const STATUS_COLOR: Record<HistoryStatus, string> = {
  played: '#4ade80',
  skipped: '#f87171',
  later: '#a78bfa',
}

function isCoolingDown(lt: LaterTrack, playedCount: number): boolean {
  return playedCount - lt.playedCountAtDismissal < Math.ceil(lt.dismissCount / 2)
}

const EQ_SPEEDS = [0.55, 0.38, 0.7, 0.42, 0.6, 0.35, 0.65, 0.45, 0.58, 0.4]

function Equalizer() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
      {EQ_SPEEDS.map((speed, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 28,
            borderRadius: 2,
            background: '#f59e0b',
            transformOrigin: 'bottom',
            animationName: 'eq',
            animationDuration: `${speed}s`,
            animationDelay: `${i * 0.055}s`,
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationTimingFunction: 'ease-in-out',
          }}
        />
      ))}
    </div>
  )
}

const SHIMMER = {
  background: 'linear-gradient(90deg, #161620 25%, #1e1e2c 50%, #161620 75%)',
  backgroundSize: '800px 100%',
  animationName: 'shimmer',
  animationDuration: '1.6s',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'linear',
  borderRadius: 6,
}

function CardSkeleton() {
  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ background: '#0e0e15', border: '1px solid #1e1e28' }}>
      <div style={{ height: 2, background: '#1e1e28' }} />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Row 1: key badge — actual rendered: 25.5px */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ ...SHIMMER, width: 52, height: 26, borderRadius: 6 }} />
          <div style={{ ...SHIMMER, flex: 1, height: 18, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: 28, height: 14, borderRadius: 4 }} />
        </div>

        {/* Row 2: name (30px) + gap:4 + artist (16px) = 50px */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ ...SHIMMER, width: '68%', height: 30, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: '38%', height: 16, borderRadius: 4 }} />
        </div>

        {/* Row 3: BPM (56px) + label */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ ...SHIMMER, width: 92, height: 56, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: 30, height: 11, borderRadius: 4 }} />
        </div>

        {/* Row 4: transition note — 4 lines × 21px = 84px ≈ minHeight 83.2px in TrackCard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ ...SHIMMER, width: '100%', height: 21, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: '95%', height: 21, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: '88%', height: 21, borderRadius: 4 }} />
          <div style={{ ...SHIMMER, width: '60%', height: 21, borderRadius: 4 }} />
        </div>

        {/* Row 5: actions — actual rendered: 74.5px → pt:16 + border:1 + button:57 */}
        <div style={{ borderTop: '1px solid #1a1a22', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...SHIMMER, height: 57, borderRadius: 10 }} />
          ))}
        </div>

      </div>
    </div>
  )
}

export default function Home() {
  const [suggestion, setSuggestion] = useState<SetlistTrack | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SetlistTrack | null>(null)
  const [played, setPlayed] = useState<SetlistTrack[]>([])
  const [banned, setBanned] = useState<SetlistTrack[]>([])
  const [later, setLater] = useState<LaterTrack[]>([])
  const [bannedArtists, setBannedArtists] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [vibe, setVibe] = useState('')
  const [mode, setMode] = useState<DiscoveryMode>('vibe-search')
  const [engine, setEngine] = useState<CurationEngine>('camelot')
  const [sessionActive, setSessionActive] = useState(false)
  const [confirmingSwitch, setConfirmingSwitch] = useState(false)
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryStatus | 'all'>('all')
  const historyLoadedRef = useRef(false)

  // Load persisted history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('party-wingman-history')
      if (saved) setHistoryLog(JSON.parse(saved) as HistoryEntry[])
    } catch { }
    historyLoadedRef.current = true
  }, [])

  // Persist history on every change (after initial load)
  useEffect(() => {
    if (!historyLoadedRef.current) return
    try {
      localStorage.setItem('party-wingman-history', JSON.stringify(historyLog))
    } catch { }
  }, [historyLog])

  const sessionRef = useRef({ vibe, mode, engine, currentTrack, played, banned, later, bannedArtists })
  sessionRef.current = { vibe, mode, engine, currentTrack, played, banned, later, bannedArtists }

  const pendingFeedbackRef = useRef<'on-track' | 'off-track' | undefined>(undefined)
  const [pendingFeedback, setPendingFeedback] = useState<'on-track' | 'off-track' | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSuggestion = useCallback(async (overrides?: Partial<typeof sessionRef.current & { feedback: 'on-track' | 'off-track' }>) => {
    const feedback = overrides?.feedback ?? pendingFeedbackRef.current
    pendingFeedbackRef.current = undefined
    setPendingFeedback(undefined)
    const { vibe, mode, engine, currentTrack, played, banned, later, bannedArtists } = { ...sessionRef.current, ...overrides }
    if (!vibe.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const playedCount = played.length
      const availableLater = later.filter((lt) => !isCoolingDown(lt, playedCount)).map((lt) => lt.track)
      const coolingDown = later.filter((lt) => isCoolingDown(lt, playedCount)).map((lt) => lt.track.spotifyId)
      const res = await fetch('/api/suggest', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe, mode, engine, currentTrack,
          excluded: [...played, ...banned].map((t) => t.spotifyId).concat(coolingDown),
          later: availableLater,
          bannedArtists,
          feedback,
        }),
      })
      const data = (await res.json()) as { track: SetlistTrack | null }
      setSuggestion(data.track)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSessionActive(true)
    void fetchSuggestion()
  }

  function handleSwitchVibes() {
    abortRef.current?.abort()
    abortRef.current = null
    setSuggestion(null)
    setCurrentTrack(null)
    setPlayed([])
    setBanned([])
    setLater([])
    setBannedArtists([])
    pendingFeedbackRef.current = undefined
    setPendingFeedback(undefined)
    setLoading(false)
    setConfirmingSwitch(false)
    setSessionActive(false)
  }

  function handleYes() {
    if (!suggestion) return
    const accepted = suggestion
    const newPlayed = [...sessionRef.current.played, accepted]
    setPlayed(newPlayed)
    setCurrentTrack(accepted)
    setHistoryLog(log => [...log, { track: accepted, status: 'played' }])
    void fetchSuggestion({ currentTrack: accepted, played: newPlayed })
  }

  function handleNo() {
    if (!suggestion) return
    setHistoryLog(log => [...log, { track: suggestion, status: 'skipped' }])
    const newBanned = [...sessionRef.current.banned, suggestion]
    setBanned(newBanned)
    void fetchSuggestion({ banned: newBanned })
  }

  function handleBanArtist() {
    if (!suggestion) return
    const artist = suggestion.artist
    const newBannedArtists = [...sessionRef.current.bannedArtists ?? [], artist]
    setBannedArtists(newBannedArtists)
    void fetchSuggestion({ bannedArtists: newBannedArtists })
  }

  function handleFeedback(feedback: 'on-track' | 'off-track') {
    const next = pendingFeedback === feedback ? undefined : feedback
    pendingFeedbackRef.current = next
    setPendingFeedback(next)
  }

  function handleLater() {
    if (!suggestion) return
    const { later, played } = sessionRef.current
    const existing = later.find((lt) => lt.track.spotifyId === suggestion.spotifyId)
    if (!existing) {
      setHistoryLog(log => [...log, { track: suggestion, status: 'later' }])
    }
    const newLater = existing
      ? later.map((lt) =>
        lt.track.spotifyId === suggestion.spotifyId
          ? { ...lt, dismissCount: lt.dismissCount + 1, playedCountAtDismissal: played.length }
          : lt
      )
      : [...later, { track: suggestion, dismissCount: 1, playedCountAtDismissal: played.length }]
    setLater(newLater)
    void fetchSuggestion({ later: newLater })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: '#08080d' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 65%)',
          animationName: 'breathe',
          animationDuration: '5s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          zIndex: 0,
        }}
      />

      <div className="w-full max-w-md flex flex-col gap-7 relative" style={{ zIndex: 1 }}>

        {/* Header */}
        <div style={{ animation: 'slide-up 0.4s ease forwards' }}>
          <div className="flex items-baseline gap-3 mb-1">
            <h1
              className="font-bold"
              style={{ fontSize: 26, letterSpacing: '-0.02em', color: '#e4e4f0' }}
            >
              Party Wingman
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: '#3f3f46',
                paddingBottom: 2,
              }}
            >
              AI SET ADVISOR
            </span>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, #f59e0b22, #22d3ee22, transparent)' }} />
        </div>

        {/* Previous track strip */}
        {currentTrack && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#0e0e15',
              border: '1px solid #1e1e28',
              animation: 'slide-up 0.3s ease forwards',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3f3f46', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: '#52525b',
                flexShrink: 0,
              }}
            >
              PREV
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 11,
                color: '#a1a1aa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {currentTrack.name}
            </span>
            <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
              {currentTrack.camelotKey && (
                <span
                  style={{
                    fontFamily: 'var(--font-ibm-mono)',
                    fontSize: 11,
                    color: CAMELOT_COLORS[currentTrack.camelotKey]?.text ?? '#22d3ee',
                    letterSpacing: '0.1em',
                  }}
                >
                  {currentTrack.camelotKey}
                </span>
              )}
              {currentTrack.bpm > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-ibm-mono)',
                    fontSize: 11,
                    color: '#52525b',
                  }}
                >
                  {currentTrack.bpm}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleFeedback('on-track')}
                title="More like this"
                style={{
                  padding: '3px 5px',
                  borderRadius: 5,
                  border: 'none',
                  background: pendingFeedback === 'on-track' ? 'rgba(74,222,128,0.12)' : 'transparent',
                  color: pendingFeedback === 'on-track' ? '#4ade80' : '#3f3f46',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ThumbsUpIcon size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback('off-track')}
                title="Different direction"
                style={{
                  padding: '3px 5px',
                  borderRadius: 5,
                  border: 'none',
                  background: pendingFeedback === 'off-track' ? 'rgba(248,113,113,0.12)' : 'transparent',
                  color: pendingFeedback === 'off-track' ? '#f87171' : '#3f3f46',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ThumbsDownIcon size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Card area */}
        <div className="w-full" style={{ position: 'relative' }}>
          {loading ? (
            <div style={{ position: 'relative', borderRadius: 17, padding: '1px', overflow: 'hidden' }}>
              <div className="card-gradient-spin" />
              <div style={{ position: 'relative', zIndex: 1, borderRadius: 16, overflow: 'hidden' }}>
                <CardSkeleton />
                <div style={{
                  position: 'absolute', inset: 0,
                  backdropFilter: 'blur(6px) saturate(1.1)',
                  WebkitBackdropFilter: 'blur(6px) saturate(1.1)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(8,8,13,0.45) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10,
                }}>
                  <Equalizer />
                </div>
              </div>
            </div>
          ) : suggestion ? (
            <div style={{ position: 'relative', borderRadius: 17, padding: '1px', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1, borderRadius: 16, overflow: 'hidden' }}>
                <TrackCard
                  key={suggestion.spotifyId}
                  track={suggestion}
                  onYes={handleYes}
                  onNo={handleNo}
                  onLater={handleLater}
                  onBanArtist={handleBanArtist}
                />
              </div>
            </div>
          ) : (
            /* Form card — before first session and after switching vibes */
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0e0e15', border: '1px solid #1e1e28', animation: 'card-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', flexDirection: 'column', minHeight: 424 }}
            >
              {/* Top accent line */}
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #f59e0b 40%, #22d3ee 60%, transparent 100%)' }} />
              <form
                onSubmit={handleSubmit}
                style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}
              >
                <textarea
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="dark melodic techno, 132 BPM, building tension…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as unknown as React.FormEvent)
                    }
                  }}
                  style={{
                    width: '100%',
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #1e1e28',
                    padding: '0 0 18px',
                    fontSize: 15,
                    color: '#e4e4f0',
                    fontFamily: 'var(--font-syne)',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: 1.65,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#78350f' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#1e1e28' }}
                />
                <ModeSelector value={mode} onChange={setMode} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <EngineToggle value={engine} onChange={setEngine} />
                  <button
                    type="submit"
                    disabled={!vibe.trim()}
                    style={{
                      padding: '9px 22px', borderRadius: 8,
                      background: !vibe.trim() ? '#1a1a1a' : '#f59e0b',
                      color: !vibe.trim() ? '#3f3f46' : '#08080d',
                      fontFamily: 'var(--font-ibm-mono)', fontSize: 12, fontWeight: 600,
                      letterSpacing: '0.12em', border: 'none',
                      cursor: !vibe.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (vibe.trim()) e.currentTarget.style.background = '#fbbf24' }}
                    onMouseLeave={(e) => { if (vibe.trim()) e.currentTarget.style.background = '#f59e0b' }}
                  >
                    SUGGEST
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Switch-vibes confirm overlay — covers whichever state is active */}
          {confirmingSwitch && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 30, borderRadius: 17,
                background: 'rgba(8,8,13,0.93)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 28,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', color: '#e4e4f0' }}>
                  NEW VIBE
                </span>
                <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#52525b' }}>
                  CURRENT SET WILL BE CLEARED
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmingSwitch(false)}
                  style={{
                    fontFamily: 'var(--font-ibm-mono)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.12em', padding: '9px 22px', borderRadius: 8,
                    background: 'transparent', border: '1px solid #2e2e3e',
                    color: '#52525b', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#52525b'; e.currentTarget.style.color = '#a1a1aa' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e3e'; e.currentTarget.style.color = '#52525b' }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSwitchVibes}
                  style={{
                    fontFamily: 'var(--font-ibm-mono)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.12em', padding: '9px 22px', borderRadius: 8,
                    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                    color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.55)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
                >
                  CONFIRM
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Switch vibes */}
        {sessionActive && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setConfirmingSwitch(true)}
              style={{
                fontFamily: 'var(--font-ibm-mono)', fontSize: 11, letterSpacing: '0.12em',
                color: '#3f3f46', background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 12px', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#71717a' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3f3f46' }}
            >
              ↺ SWITCH VIBES
            </button>
          </div>
        )}

        {/* History log — persists across sessions */}
        {historyLog.length > 0 && (() => {
          const filtered = historyFilter === 'all'
            ? [...historyLog].reverse()
            : [...historyLog].filter(e => e.status === historyFilter).reverse()
          const counts = {
            played: historyLog.filter(e => e.status === 'played').length,
            skipped: historyLog.filter(e => e.status === 'skipped').length,
            later: historyLog.filter(e => e.status === 'later').length,
          }
          return (
            <div style={{ width: '100%' }}>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setHistoryOpen(o => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#0e0e15',
                  border: '1px solid #1e1e28',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2e2e3e' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e28' }}
              >
                <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#52525b' }}>
                  HISTORY
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(['played', 'skipped', 'later'] as HistoryStatus[]).map(s => counts[s] > 0 && (
                    <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[s], display: 'inline-block' }} />
                      <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, color: '#3f3f46' }}>{counts[s]}</span>
                    </span>
                  ))}
                  <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, color: '#3f3f46', marginLeft: 2, transition: 'transform 0.2s', display: 'inline-block', transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
              </button>

              {/* Expanded panel */}
              <div style={{ maxHeight: historyOpen ? '1400px' : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>

                  {/* Filter pills + clear */}
                  <div style={{ display: 'flex', gap: 4, paddingBottom: 4, alignItems: 'center' }}>
                    {([['all', 'ALL', historyLog.length], ['played', 'PLAYED', counts.played], ['skipped', 'SKIPPED', counts.skipped], ['later', 'LATER', counts.later]] as [HistoryStatus | 'all', string, number][]).map(([val, label, count]) => {
                      const active = historyFilter === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setHistoryFilter(val)}
                          style={{
                            fontFamily: 'var(--font-ibm-mono)',
                            fontSize: 9,
                            letterSpacing: '0.14em',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: `1px solid ${active ? '#2e2e3e' : 'transparent'}`,
                            background: active ? '#1a1a24' : 'transparent',
                            color: active ? '#a1a1aa' : '#3f3f46',
                            cursor: 'pointer',
                          }}
                        >
                          {label} {count > 0 && <span style={{ opacity: 0.6 }}>{count}</span>}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => { setHistoryLog([]); setHistoryOpen(false) }}
                      style={{
                        marginLeft: 'auto',
                        fontFamily: 'var(--font-ibm-mono)',
                        fontSize: 9,
                        letterSpacing: '0.14em',
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: '1px solid transparent',
                        background: 'transparent',
                        color: '#3f3f46',
                        cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46' }}
                    >
                      CLEAR
                    </button>
                  </div>

                  {/* Rows */}
                  {filtered.map((entry, i) => {
                    const url = entry.track.spotifyId
                      ? `https://open.spotify.com/track/${entry.track.spotifyId}`
                      : `https://open.spotify.com/search/${encodeURIComponent(`${entry.track.name} ${entry.track.artist}`)}`
                    return (
                      <a
                        key={`${entry.track.spotifyId}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid transparent',
                          textDecoration: 'none',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#0e0e15'
                          e.currentTarget.style.borderColor = '#1e1e28'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.borderColor = 'transparent'
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[entry.status], flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-syne)', fontSize: 12, color: '#a1a1aa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.track.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, color: '#3f3f46', letterSpacing: '0.12em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
                          {entry.track.artist}
                        </span>
                        {entry.track.camelotKey && (
                          <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, color: CAMELOT_COLORS[entry.track.camelotKey]?.text ?? '#22d3ee', letterSpacing: '0.1em', flexShrink: 0 }}>
                            {entry.track.camelotKey}
                          </span>
                        )}
                        {entry.track.bpm > 0 && (
                          <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, color: '#52525b', flexShrink: 0 }}>
                            {entry.track.bpm}
                          </span>
                        )}
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
