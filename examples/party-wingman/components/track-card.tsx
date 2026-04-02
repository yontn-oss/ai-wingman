'use client'

import { CheckIcon, XIcon, ClockIcon, UserXIcon, PlayIcon } from 'lucide-react'
import type { SetlistTrack } from '@/lib/tools'
import { CAMELOT_COLORS } from '@/lib/camelot'

interface TrackCardProps {
  track: SetlistTrack
  onYes: () => void
  onNo: () => void
  onLater: () => void
  onBanArtist: () => void
}


function VuMeter({ value }: { value: number }) {
  const total = 12
  const filled = Math.round(value * total)
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: 18 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < filled
        const heightPct = 35 + (i / (total - 1)) * 65
        const color = i < 7 ? '#22d3ee' : i < 10 ? '#f59e0b' : '#f87171'
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: `${heightPct}%`,
              borderRadius: 2,
              backgroundColor: active ? color : '#1e1e2a',
              transition: 'background-color 0.15s',
            }}
          />
        )
      })}
    </div>
  )
}

const ACTIONS = [
  {
    label: 'PLAY',
    icon: CheckIcon,
    hoverBg: 'rgba(74,222,128,0.08)',
    hoverBorder: '#166534',
    hoverColor: '#4ade80',
    handler: 'yes' as const,
  },
  {
    label: 'LATER',
    icon: ClockIcon,
    hoverBg: 'rgba(167,139,250,0.08)',
    hoverBorder: '#4c1d95',
    hoverColor: '#a78bfa',
    handler: 'later' as const,
  },
  {
    label: 'SKIP',
    icon: XIcon,
    hoverBg: 'rgba(248,113,113,0.08)',
    hoverBorder: '#7f1d1d',
    hoverColor: '#f87171',
    handler: 'no' as const,
  },
  {
    label: 'ARTIST',
    icon: UserXIcon,
    hoverBg: 'rgba(251,146,60,0.08)',
    hoverBorder: '#7c2d12',
    hoverColor: '#fb923c',
    handler: 'ban' as const,
  },
]

export function TrackCard({ track, onYes, onNo, onLater, onBanArtist }: TrackCardProps) {
  const spotifyUrl = track.spotifyId
    ? `https://open.spotify.com/track/${track.spotifyId}`
    : `https://open.spotify.com/search/${encodeURIComponent(`${track.name} ${track.artist}`)}`

  function handleYes() {
    window.open(spotifyUrl, '_blank', 'noopener,noreferrer')
    onYes()
  }

  const handlers = { yes: handleYes, no: onNo, later: onLater, ban: onBanArtist }

  return (
    <div
      className="w-full"
      style={{ animation: 'card-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0e0e15', border: '1px solid #1e1e28', position: 'relative' }}
      >
        {/* Top accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #f59e0b 40%, #22d3ee 60%, transparent 100%)' }} />

        {/* Disclaimer footnote */}
        <div style={{ position: 'absolute', top: 12, right: 16, opacity: 0.4, fontSize: 7, fontFamily: 'var(--font-ibm-mono)', color: '#a1a1aa', pointerEvents: 'none', zIndex: 100 }}>
          AI ESTIMATED METADATA
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Row 1: Key + VU meter + energy % */}
          <div className="flex items-center gap-4">
            {(() => {
              const c = CAMELOT_COLORS[track.camelotKey]
              return (
                <span
                  className="font-mono font-semibold"
                  style={{
                    fontSize: 13,
                    letterSpacing: '0.18em',
                    color: c?.text ?? '#22d3ee',
                    background: c?.bg ?? 'transparent',
                    border: `1px solid ${c?.border ?? 'transparent'}`,
                    padding: '2px 8px',
                    borderRadius: 6,
                    flexShrink: 0,
                  }}
                >
                  {track.camelotKey}
                </span>
              )
            })()}
            <div className="flex-1">
              <VuMeter value={track.energy} />
            </div>
            <span className="font-mono text-xs" style={{ color: '#52525b', minWidth: 32, textAlign: 'right' }}>
              {Math.round(track.energy * 100)}%
            </span>
          </div>

          {/* Row 2: Track name + artist */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2
                className="text-white font-bold leading-tight flex-1"
                style={{ fontSize: 'clamp(20px, 5vw, 26px)', letterSpacing: '-0.01em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {track.name}
              </h2>
              <a
                href={spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Spotify"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition-all border border-transparent hover:border-zinc-700/50"
                onClick={(e) => e.stopPropagation()}
              >
                OPEN
              </a>
            </div>
            <p
              className="font-mono uppercase"
              style={{ color: '#71717a', fontSize: 11, letterSpacing: '0.18em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {track.artist}
            </p>
          </div>

          {/* Row 3: BPM */}
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono font-semibold tabular-nums leading-none"
              style={{ fontSize: 56, color: '#f59e0b', lineHeight: 1 }}
            >
              {track.bpm > 0 ? track.bpm : '—'}
            </span>
            <span className="font-mono" style={{ color: '#3f3f46', fontSize: 11, letterSpacing: '0.25em' }}>
              BPM
            </span>
          </div>

          {/* Row 4: Transition note — fixed 2-line height */}
          <p
            style={{
              color: '#52525b',
              fontSize: 13,
              fontStyle: 'italic',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: `${13 * 1.6 * 4}px`,
            }}
          >
            {track.transitionNote}
          </p>

          {/* Row 5: Actions */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1a1a22', paddingTop: 16 }}
          >
            {ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <ActionButton
                  key={action.label}
                  label={action.label}
                  icon={<Icon size={17} />}
                  hoverBg={action.hoverBg}
                  hoverBorder={action.hoverBorder}
                  hoverColor={action.hoverColor}
                  onClick={handlers[action.handler]}
                />
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  hoverBg,
  hoverBorder,
  hoverColor,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  hoverBg: string
  hoverBorder: string
  hoverColor: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = hoverBg
        el.style.borderColor = hoverBorder
        el.style.color = hoverColor
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = 'transparent'
        el.style.borderColor = '#1e1e28'
        el.style.color = '#52525b'
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '10px 4px',
        borderRadius: 10,
        border: '1px solid #1e1e28',
        background: 'transparent',
        color: '#52525b',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: 9, letterSpacing: '0.15em' }}>
        {label}
      </span>
    </button>
  )
}
