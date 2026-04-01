'use client'

export type DiscoveryMode = 'vibe-search' | 'artist-graph' | 'tight-set'

export interface ModeSelectorProps {
  value: DiscoveryMode
  onChange: (mode: DiscoveryMode) => void
}

const MODES: { id: DiscoveryMode; label: string; descriptor: string }[] = [
  { id: 'vibe-search', label: 'Vibe Search', descriptor: 'Multi-pass' },
  { id: 'artist-graph', label: 'Sounds Like', descriptor: 'Artist graph' },
  { id: 'tight-set', label: 'Tight Set', descriptor: 'Fast & focused' },
]

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-2">
      {MODES.map((mode) => {
        const isActive = value === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${isActive ? '#78350f' : '#1e1e28'}`,
              background: isActive ? 'rgba(245,158,11,0.07)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: isActive ? '#f59e0b' : '#71717a',
              }}
            >
              {mode.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 10,
                color: isActive ? '#a16207' : '#3f3f46',
                marginTop: 2,
                letterSpacing: '0.04em',
              }}
            >
              {mode.descriptor}
            </span>
          </button>
        )
      })}
    </div>
  )
}
