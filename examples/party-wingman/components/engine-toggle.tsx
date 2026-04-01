import { CAMELOT_WHEEL_GRADIENT } from '@/lib/camelot'

export type CurationEngine = 'camelot' | 'style'

export interface EngineToggleProps {
  value: CurationEngine
  onChange: (engine: CurationEngine) => void
}

const OPTIONS: { value: CurationEngine; label: string; descriptor: string }[] = [
  { value: 'camelot', label: 'Camelot', descriptor: 'Harmonic' },
  { value: 'style',   label: 'Style',   descriptor: 'Energy' },
]

export function EngineToggle({ value, onChange }: EngineToggleProps) {
  return (
    <div
      className="flex"
      style={{
        background: '#0e0e15',
        border: '1px solid #1e1e28',
        borderRadius: 8,
        padding: 3,
        gap: 2,
      }}
      role="group"
      aria-label="Curation engine"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '6px 12px',
              borderRadius: 5,
              background: active ? '#1a1a24' : 'transparent',
              border: `1px solid ${active ? '#2e2e3e' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {opt.value === 'camelot' && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: CAMELOT_WHEEL_GRADIENT,
                    opacity: active ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: 'var(--font-ibm-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: active ? '#e4e4f0' : '#52525b',
                }}
              >
                {opt.label}
              </span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ibm-mono)',
                fontSize: 9,
                letterSpacing: '0.06em',
                color: active ? '#71717a' : '#3f3f46',
                marginTop: 1,
              }}
            >
              {opt.descriptor}
            </span>
          </button>
        )
      })}
    </div>
  )
}
