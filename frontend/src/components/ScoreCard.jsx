import React from 'react'

const LABELS = {
  ats_keywords:          'ATS Keywords',
  impact_metrics:        'Impact Metrics',
  role_alignment:        'Role Alignment',
  formatting:            'Formatting',
  experience_relevance:  'Experience Relevance',
}

function Bar({ value, color }) {
  return (
    <div style={{
      background: 'var(--border)', borderRadius: 4,
      height: 6, width: '100%', overflow: 'hidden'
    }}>
      <div style={{
        width: value != null ? `${value}%` : '0%',
        height: '100%',
        background: color,
        borderRadius: 4,
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

function ScoreRing({ score, color, label }) {
  const r     = 32
  const circ  = 2 * Math.PI * r
  const offset = score != null ? circ - (score / 100) * circ : circ

  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 12, padding: 20,
      border: '1px solid var(--border)', textAlign: 'center',
      opacity: score == null ? 0.45 : 1, transition: 'opacity 0.4s',
    }}>
      <div style={{
        color: 'var(--muted)', fontSize: 11,
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14
      }}>
        {label}
      </div>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x="40" y="45" textAnchor="middle" fill="var(--text)"
          fontSize="16" fontFamily="var(--font-head)" fontWeight="700">
          {score != null ? score : '--'}
        </text>
      </svg>
      {score == null && (
        <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 8 }}>
          Not yet generated
        </div>
      )}
    </div>
  )
}

export default function ScoreCard({ original, tailored }) {
  const delta = original && tailored
    ? tailored.overall - original.overall
    : null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '28px 32px', marginTop: 0,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <span style={{
          fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
          letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase'
        }}>
          Score Comparison
        </span>
        {delta != null && (
          <span style={{
            background: delta >= 0 ? 'rgba(62,207,142,0.12)' : 'rgba(247,110,110,0.12)',
            color: delta >= 0 ? 'var(--green)' : 'var(--red)',
            borderRadius: 20, padding: '2px 12px', fontSize: 13, fontWeight: 600,
          }}>
            {delta >= 0 ? '+' : ''}{delta} pts
          </span>
        )}
      </div>

      {/* Rings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <ScoreRing score={original?.overall} color="var(--accent2)" label="Original Resume" />
        <ScoreRing score={tailored?.overall} color="var(--green)"   label="Tailored Resume" />
      </div>

      {/* Breakdown bars */}
      {original?.breakdown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(LABELS).map(([key, label]) => {
            const ov = original.breakdown[key]
            const tv = tailored?.breakdown?.[key]
            return (
              <div key={key}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 7, fontSize: 12
                }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <span>
                    <span style={{ color: 'var(--accent2)' }}>{ov}</span>
                    {tv != null && (
                      <>
                        <span style={{ color: 'var(--muted)', margin: '0 6px' }}>→</span>
                        <span style={{ color: 'var(--green)' }}>{tv}</span>
                      </>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ flex: 1 }}><Bar value={ov} color="var(--accent2)" /></div>
                  <div style={{ flex: 1 }}><Bar value={tv} color="var(--green)"   /></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Gaps & Strengths */}
      {original?.gaps && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 16, marginTop: 28
        }}>
          {[
            { title: 'Gaps',      items: original.gaps,      color: 'var(--red)'   },
            { title: 'Strengths', items: original.strengths, color: 'var(--green)' },
          ].map(({ title, items, color }) => (
            <div key={title} style={{
              background: 'var(--surface2)', borderRadius: 10,
              padding: 16, border: '1px solid var(--border)'
            }}>
              <div style={{
                fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                color, marginBottom: 12, fontWeight: 600
              }}>
                {title}
              </div>
              {(items || []).map((item, i) => (
                <div key={i} style={{
                  fontSize: 12, color: 'var(--text)', marginBottom: 8,
                  lineHeight: 1.6, paddingLeft: 10,
                  borderLeft: `2px solid ${color}`
                }}>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}