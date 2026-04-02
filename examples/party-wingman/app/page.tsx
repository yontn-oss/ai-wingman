'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react'
import { ModeSelector } from '@/components/mode-selector'
import type { DiscoveryMode } from '@/components/mode-selector'
import { EngineToggle } from '@/components/engine-toggle'
import type { CurationEngine } from '@/components/engine-toggle'
import { TrackCard } from '@/components/track-card'
import type { SetlistTrack } from '@/lib/tools'
import type { ArtistGraphCtx } from '@/app/api/suggest/route'
import type { SpotifyArtist } from '@/lib/spotify'
import { CAMELOT_COLORS } from '@/lib/camelot'

interface LaterTrack {
  track: SetlistTrack
  dismissCount: number
  playedCountAtDismissal: number
}

type HistoryStatus = 'played' | 'skipped' | 'later'
interface HistoryEntry { track: SetlistTrack; status: HistoryStatus; feedback?: 'on-track' | 'off-track' }

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
  const [skipped, setSkipped] = useState<SetlistTrack[]>([])
  const [later, setLater] = useState<LaterTrack[]>([])
  const [bannedArtists, setBannedArtists] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [vibe, setVibe] = useState('')
  const [mode, setMode] = useState<DiscoveryMode>('vibe-search')
  const [engine, setEngine] = useState<CurationEngine>('camelot')
  const [sessionActive, setSessionActive] = useState(false)
  const [isEditingVibe, setIsEditingVibe] = useState(false)
  const [artistGraphCtx, setArtistGraphCtx] = useState<ArtistGraphCtx | null>(null)
  const artistGraphCtxRef = useRef<ArtistGraphCtx | null>(null)
  artistGraphCtxRef.current = artistGraphCtx

  // Artist picker state (artist-graph mode only)
  const [artistCandidates, setArtistCandidates] = useState<SpotifyArtist[] | null>(null)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [pickerLoadingMore, setPickerLoadingMore] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerOffset, setPickerOffset] = useState(0)
  const [pickerHasMore, setPickerHasMore] = useState(false)
  const confirmedArtistRef = useRef<{ id: string; name: string } | null>(null)

  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<HistoryStatus | 'all'>('all')
  const historyLoadedRef = useRef(false)

  // Load persisted history on mount — version-gated to flush stale data from old pipeline
  const HISTORY_KEY = 'party-wingman-history'
  const HISTORY_VERSION = 2  // bump to flush cached data when track schema changes

  useEffect(() => {
    try {
      const version = Number(localStorage.getItem('party-wingman-history-version') ?? '0')
      if (version === HISTORY_VERSION) {
        const saved = localStorage.getItem(HISTORY_KEY)
        if (saved) setHistoryLog(JSON.parse(saved) as HistoryEntry[])
      } else {
        // Stale version — clear legacy data
        localStorage.removeItem(HISTORY_KEY)
        localStorage.setItem('party-wingman-history-version', String(HISTORY_VERSION))
      }
    } catch { }
    historyLoadedRef.current = true
  }, [])

  // Persist history on every change (after initial load)
  useEffect(() => {
    if (!historyLoadedRef.current) return
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLog))
    } catch { }
  }, [historyLog])

  const sessionRef = useRef({ vibe, mode, engine, currentTrack, played, skipped, later, bannedArtists })
  sessionRef.current = { vibe, mode, engine, currentTrack, played, skipped, later, bannedArtists }

  const pendingFeedbackRef = useRef<'on-track' | 'off-track' | undefined>(undefined)
  const [pendingFeedback, setPendingFeedback] = useState<'on-track' | 'off-track' | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)

  const historyLogRef = useRef<HistoryEntry[]>([])
  historyLogRef.current = historyLog

  const fetchSuggestion = useCallback(async (overrides?: Partial<typeof sessionRef.current & { feedback: 'on-track' | 'off-track' }>) => {
    const feedback = overrides?.feedback ?? pendingFeedbackRef.current
    pendingFeedbackRef.current = undefined
    setPendingFeedback(undefined)
    const { vibe, mode, engine, currentTrack, played, skipped, later, bannedArtists } = { ...sessionRef.current, ...overrides }
    if (!vibe.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const playedCount = played.length
      const availableLater = later.filter((lt) => !isCoolingDown(lt, playedCount)).map((lt) => lt.track)
      const coolingDown = later.filter((lt) => isCoolingDown(lt, playedCount)).map((lt) => lt.track.spotifyId)
      // Collect all rated history to send richer context to the model
      const ratedHistory = historyLogRef.current
        .filter(e => e.feedback)
        .map(e => ({ name: e.track.name, artist: e.track.artist, feedback: e.feedback! }))
      const res = await fetch('/api/suggest', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibe, mode, engine, currentTrack,
          excluded: [...played, ...skipped].map((t) => t.spotifyId).concat(coolingDown),
          later: availableLater,
          bannedArtists,
          feedback,
          ratedHistory: ratedHistory.length > 0 ? ratedHistory : undefined,
          artistGraphCtx: mode === 'artist-graph' ? artistGraphCtxRef.current : undefined,
          confirmedArtistId: mode === 'artist-graph' && !artistGraphCtxRef.current ? confirmedArtistRef.current?.id : undefined,
          confirmedArtistName: mode === 'artist-graph' && !artistGraphCtxRef.current ? confirmedArtistRef.current?.name : undefined,
        }),
      })
      const data = (await res.json()) as { track: SetlistTrack | null; artistGraphCtx?: ArtistGraphCtx | null }
      setSuggestion(data.track)
      if (data.artistGraphCtx) setArtistGraphCtx(data.artistGraphCtx)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsEditingVibe(false)
    handleSwitchVibes()

    if (mode === 'artist-graph' && !artistGraphCtxRef.current) {
      // Show artist picker before starting the session
      const artistName = vibe.trim()
      if (!artistName) return
      setPickerQuery(artistName)
      setPickerOffset(0)
      setPickerLoading(true)
      try {
        const res = await fetch(`/api/artist-search?q=${encodeURIComponent(artistName)}&offset=0`)
        const data = (await res.json()) as { artists: SpotifyArtist[]; hasMore: boolean }
        setArtistCandidates(data.artists)
        setPickerHasMore(data.hasMore)
        setPickerOffset(10)
      } finally {
        setPickerLoading(false)
      }
      return
    }

    setSessionActive(true)
    void fetchSuggestion()
  }

  function handlePickArtist(artist: SpotifyArtist) {
    handleSwitchVibes()                                              // resets everything (including confirmedArtistRef = null)
    confirmedArtistRef.current = { id: artist.id, name: artist.name } // set AFTER so it survives
    setSessionActive(true)
    void fetchSuggestion()
  }

  async function handleLoadMore() {
    if (!pickerQuery || pickerLoadingMore) return
    setPickerLoadingMore(true)
    try {
      const res = await fetch(`/api/artist-search?q=${encodeURIComponent(pickerQuery)}&offset=${pickerOffset}`)
      const data = (await res.json()) as { artists: SpotifyArtist[]; hasMore: boolean }
      setArtistCandidates(prev => [...(prev ?? []), ...data.artists])
      setPickerHasMore(data.hasMore)
      setPickerOffset(o => o + 10)
    } finally {
      setPickerLoadingMore(false)
    }
  }

  function handleSwitchVibes() {
    abortRef.current?.abort()
    abortRef.current = null
    setSuggestion(null)
    setCurrentTrack(null)
    setPlayed([])
    setSkipped([])
    setLater([])
    setBannedArtists([])
    pendingFeedbackRef.current = undefined
    setPendingFeedback(undefined)
    setLoading(false)

    setSessionActive(false)
    setArtistGraphCtx(null)
    artistGraphCtxRef.current = null   // sync reset — setArtistGraphCtx is async (next render)
    setArtistCandidates(null)
    setPickerHasMore(false)
    setPickerOffset(0)
    setPickerQuery('')
    confirmedArtistRef.current = null
  }

  function handleYes() {
    if (!suggestion) return
    const accepted = suggestion
    const fb = pendingFeedbackRef.current
    const newPlayed = [...sessionRef.current.played, accepted]
    setPlayed(newPlayed)
    setCurrentTrack(accepted)
    setHistoryLog(log => [...log, { track: accepted, status: 'played', ...(fb && { feedback: fb }) }])
    void fetchSuggestion({ currentTrack: accepted, played: newPlayed })
  }

  function handleNo() {
    if (!suggestion) return
    const fb = pendingFeedbackRef.current
    setHistoryLog(log => [...log, { track: suggestion, status: 'skipped', ...(fb && { feedback: fb }) }])
    const newSkipped = [...sessionRef.current.skipped, suggestion]
    setSkipped(newSkipped)
    void fetchSuggestion({ skipped: newSkipped })
  }

  function handleBanArtist() {
    if (!suggestion) return
    const fb = pendingFeedbackRef.current
    setHistoryLog(log => [...log, { track: suggestion, status: 'skipped', ...(fb && { feedback: fb }) }])

    const artist = suggestion.artist
    const newBannedArtists = [...sessionRef.current.bannedArtists ?? [], artist]
    setBannedArtists(newBannedArtists)

    // Also skip this specific track for the session
    const newSkipped = [...sessionRef.current.skipped, suggestion]
    setSkipped(newSkipped)

    void fetchSuggestion({ bannedArtists: newBannedArtists, skipped: newSkipped })
  }

  function handleFeedback(feedback: 'on-track' | 'off-track') {
    const next = pendingFeedback === feedback ? undefined : feedback
    pendingFeedbackRef.current = next
    setPendingFeedback(next)
  }

  function handleHistoryFeedback(index: number, feedback: 'on-track' | 'off-track') {
    setHistoryLog(log => log.map((entry, i) => {
      if (i !== index) return entry
      // Toggle off if already set to this value
      const next = entry.feedback === feedback ? undefined : feedback
      return { ...entry, feedback: next }
    }))
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

      {/* Artist picker overlay (artist-graph mode) */}
      {(pickerLoading || artistCandidates) && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fade-in 0.2s ease',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'rgba(22,22,32,0.95)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            maxHeight: 'calc(100vh - 80px)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e4e4f0', marginBottom: 6 }}>
              Select the artist
            </h2>
            <p style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 20 }}>
              Which artist did you mean?
            </p>

            {pickerLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '3px solid #1e1e2c',
                  borderTopColor: '#f59e0b',
                  animation: 'spin 0.7s linear infinite',
                }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 380, paddingRight: 4 }}>
                {(artistCandidates ?? []).map(artist => (
                  <button
                    key={artist.id}
                    onClick={() => handlePickArtist(artist)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => {
                      ; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.5)'
                        ; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.06)'
                    }}
                    onMouseLeave={e => {
                      ; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
                        ; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                    }}
                  >
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                        background: '#1e1e2c', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: '#3a3a4a',
                      }}>♪</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e4e4f0', marginBottom: 2 }}>
                        {artist.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b6b8a' }}>
                        {(artist.genres ?? []).slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Load more */}
                {pickerHasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={pickerLoadingMore}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.18)',
                      borderRadius: 12,
                      cursor: pickerLoadingMore ? 'default' : 'pointer',
                      color: '#f59e0b',
                      fontFamily: 'var(--font-ibm-mono)',
                      fontSize: 11, letterSpacing: '0.12em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!pickerLoadingMore) e.currentTarget.style.background = 'rgba(245,158,11,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.06)' }}
                  >
                    {pickerLoadingMore ? (
                      <>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          border: '2px solid rgba(245,158,11,0.3)',
                          borderTopColor: '#f59e0b',
                          animation: 'spin 0.7s linear infinite',
                          flexShrink: 0,
                        }} />
                        LOADING...
                      </>
                    ) : 'LOAD MORE'}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => { setArtistCandidates(null) }}
              style={{
                marginTop: 16, width: '100%', padding: '8px 0',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#4a4a5a',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

        {/* Card area */}
        <div className="w-full" style={{ position: 'relative' }}>
          {isEditingVibe ? (
            /* Form card — when manually editing vibe */
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0e0e15', border: '1px solid #1e1e28', animation: 'card-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', flexDirection: 'column', minHeight: 424 }}
            >
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
          ) : loading ? (
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
            /* Form card — before first session */
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0e0e15', border: '1px solid #1e1e28', animation: 'card-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', flexDirection: 'column', minHeight: 424 }}
            >
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
        </div>


        {/* Toggle between Vibe Edit and Active Set */}
        {sessionActive && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsEditingVibe(!isEditingVibe)}
              style={{
                fontFamily: 'var(--font-ibm-mono)', fontSize: 11, letterSpacing: '0.12em',
                color: isEditingVibe ? '#a1a1aa' : '#3f3f46',
                background: isEditingVibe ? 'rgba(255,255,255,0.03)' : 'none',
                border: 'none', cursor: 'pointer',
                padding: '8px 16px', borderRadius: 20,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
                position: 'relative',
                ...(isEditingVibe && {
                  boxShadow: '0 0 15px rgba(245,158,11,0.1)',
                })
              }}
              onMouseEnter={(e) => {
                if (!isEditingVibe) e.currentTarget.style.color = '#71717a'
                else e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                if (!isEditingVibe) e.currentTarget.style.color = '#3f3f46'
                else e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
            >
              {isEditingVibe && (
                <>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 20,
                    padding: 1,
                    background: 'linear-gradient(90deg, #6b9ff5, #3dcf88, #f59e0b, #f87171)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    pointerEvents: 'none',
                    opacity: 0.6,
                  }} />
                  <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 2, height: 10, marginRight: 2
                  }}>
                    {(() => {
                      const beatDuration = currentTrack?.bpm ? (60 / currentTrack.bpm) : 0.5;
                      return (
                        <>
                          <div style={{ width: 2, height: '60%', background: '#6b9ff5', borderRadius: 1, animation: `eq ${beatDuration}s ease-in-out infinite alternate` }} />
                          <div style={{ width: 2, height: '100%', background: '#3dcf88', borderRadius: 1, animation: `eq ${beatDuration * 0.8}s ease-in-out infinite alternate -0.2s` }} />
                          <div style={{ width: 2, height: '40%', background: '#f59e0b', borderRadius: 1, animation: `eq ${beatDuration * 1.2}s ease-in-out infinite alternate -0.4s` }} />
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
              {isEditingVibe ? 'BACK TO SET' : '↺ SWITCH VIBES'}
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
                    // Map back to original index for feedback mutation
                    const originalIndex = historyLog.indexOf(entry)
                    const url = entry.track.spotifyId
                      ? `https://open.spotify.com/track/${entry.track.spotifyId}`
                      : `https://open.spotify.com/search/${encodeURIComponent(`${entry.track.name} ${entry.track.artist}`)}`
                    return (
                      <div
                        key={`${entry.track.spotifyId}-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid transparent',
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
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontFamily: 'var(--font-syne)', fontSize: 12, color: '#a1a1aa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}
                        >
                          {entry.track.name}
                        </a>
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
                        {/* Inline feedback */}
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 2 }}>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleHistoryFeedback(originalIndex, 'on-track') }}
                            title="On track"
                            style={{
                              padding: '2px 4px', borderRadius: 4, border: 'none',
                              background: entry.feedback === 'on-track' ? 'rgba(74,222,128,0.12)' : 'transparent',
                              color: entry.feedback === 'on-track' ? '#4ade80' : '#27272a',
                              cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center',
                            }}
                            onMouseEnter={e => { if (entry.feedback !== 'on-track') e.currentTarget.style.color = '#3f3f46' }}
                            onMouseLeave={e => { if (entry.feedback !== 'on-track') e.currentTarget.style.color = '#27272a' }}
                          >
                            <ThumbsUpIcon size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleHistoryFeedback(originalIndex, 'off-track') }}
                            title="Off track"
                            style={{
                              padding: '2px 4px', borderRadius: 4, border: 'none',
                              background: entry.feedback === 'off-track' ? 'rgba(248,113,113,0.12)' : 'transparent',
                              color: entry.feedback === 'off-track' ? '#f87171' : '#27272a',
                              cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center',
                            }}
                            onMouseEnter={e => { if (entry.feedback !== 'off-track') e.currentTarget.style.color = '#3f3f46' }}
                            onMouseLeave={e => { if (entry.feedback !== 'off-track') e.currentTarget.style.color = '#27272a' }}
                          >
                            <ThumbsDownIcon size={10} />
                          </button>
                        </div>
                      </div>
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
