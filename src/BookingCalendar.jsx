import { useState } from 'react'
import { motion } from 'framer-motion'

const MONTH_NAMES = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]
const DAY_NAMES = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

export default function BookingCalendar({ selectedDate, onChange, bookedDates = [] }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const firstDay  = new Date(viewYear, viewMonth, 1)
  const lastDay   = new Date(viewYear, viewMonth + 1, 0)
  const startDow  = (firstDay.getDay() + 6) % 7 // Monday-first (0=Mon)

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)

  const toStr = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${viewYear}-${mm}-${dd}`
  }

  const isPast     = (d) => new Date(viewYear, viewMonth, d) < today
  const isBooked   = (d) => bookedDates.includes(toStr(d))
  const isSelected = (d) => selectedDate === toStr(d)
  const isToday    = (d) => new Date(viewYear, viewMonth, d).getTime() === today.getTime()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Don't allow navigating to past months
  const canGoPrev = new Date(viewYear, viewMonth, 1) > new Date(now.getFullYear(), now.getMonth(), 1)

  return (
    <div style={{
      background: '#0E0E0E',
      border: '1px solid rgba(196,150,90,0.15)',
      padding: 'clamp(1rem, 3vw, 1.6rem)',
      userSelect: 'none',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            background: 'none', border: '1px solid rgba(196,150,90,0.25)', color: canGoPrev ? '#C4965A' : '#2A2A2A',
            width: '34px', height: '34px', cursor: canGoPrev ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            transition: 'border-color 0.2s',
          }}
        >
          ‹
        </button>

        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
          fontWeight: 400, color: '#F5F0E8', letterSpacing: '0.06em',
        }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          style={{
            background: 'none', border: '1px solid rgba(196,150,90,0.25)', color: '#C4965A',
            width: '34px', height: '34px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
          }}
        >
          ›
        </button>
      </div>

      {/* ── Day labels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontFamily: "'Inter'", fontSize: '0.58rem',
            fontWeight: 300, letterSpacing: '0.1em', color: '#4A4440', padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Days ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`pad-${i}`} />
          const past     = isPast(d)
          const booked   = isBooked(d)
          const selected = isSelected(d)
          const today_   = isToday(d)
          const disabled = past || booked

          let bg    = 'transparent'
          let color = '#C4965A'
          let border = '1px solid transparent'

          if (selected)    { bg = '#C4965A'; color = '#080808'; border = '1px solid #C4965A' }
          else if (booked) { bg = 'rgba(180,55,55,0.1)'; color = '#4A2020'; border = '1px solid rgba(180,55,55,0.25)' }
          else if (past)   { color = '#282828' }
          else if (today_) { border = '1px solid rgba(196,150,90,0.4)' }

          return (
            <motion.button
              key={d}
              whileHover={!disabled ? { scale: 1.12, zIndex: 2 } : {}}
              whileTap={!disabled ? { scale: 0.92 } : {}}
              onClick={() => !disabled && onChange(toStr(d))}
              style={{
                background: bg,
                border,
                color,
                fontFamily: "'Inter'", fontSize: 'clamp(0.68rem, 1.5vw, 0.8rem)',
                fontWeight: selected ? 500 : 300,
                width: '100%', aspectRatio: '1',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {d}
              {booked && !selected && (
                <span style={{
                  position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
                  width: '3px', height: '3px', borderRadius: '50%',
                  background: 'rgba(180,55,55,0.5)', display: 'block',
                }} />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { color: '#C4965A',             label: 'Disponible' },
          { color: 'rgba(180,55,55,0.55)', label: 'Réservé'   },
          { color: '#282828',              label: 'Passé'      },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter'", fontSize: '0.58rem', fontWeight: 300, letterSpacing: '0.08em', color: '#4A4440' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
