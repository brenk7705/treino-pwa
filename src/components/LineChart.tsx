import { useRef, useState } from 'react'
import { fmtKg } from '../logic/progression'

export interface Point {
  date: string
  top: number
  topReps: number
  e1rm: number
}

// paleta validada (scripts/validate_palette.js, modo escuro, superfície #14171c)
const C_TOP = '#7e9e17'
const C_1RM = '#3d9be0'

const W = 360
const H = 220
const PAD = { l: 40, r: 14, t: 14, b: 28 }

function niceTicks(min: number, max: number, n = 4) {
  const span = max - min || 1
  const step0 = span / n
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100)
  return out
}
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

export default function LineChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  if (data.length === 0) return null

  const vals = data.flatMap((d) => [d.top, d.e1rm])
  const ticks = niceTicks(Math.min(...vals) * 0.97, Math.max(...vals) * 1.02)
  const y0 = ticks[0]
  const y1 = ticks[ticks.length - 1]
  const x = (i: number) => (data.length === 1 ? (PAD.l + W - PAD.r) / 2 : PAD.l + (i * (W - PAD.l - PAD.r)) / (data.length - 1))
  const y = (v: number) => PAD.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b)
  const path = (k: 'top' | 'e1rm') => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('')

  const pick = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * W
    let best = 0
    data.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    })
    setHover(best)
  }

  const labelEvery = Math.max(1, Math.ceil(data.length / 5))
  const last = data.length - 1
  const h = hover != null ? data[hover] : null

  return (
    <div className="relative">
      <div className="mb-2 flex gap-4 text-sm text-mute">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5" style={{ background: C_TOP }} /> Carga do top set
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: C_1RM }} /> 1RM estimada (Epley)
        </span>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        onPointerDown={(e) => pick(e.clientX)}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Gráfico de evolução da carga do top set e da 1RM estimada"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-mute)" className="num">
              {fmtKg(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === last ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-mute)" className="num">
              {dm(d.date)}
            </text>
          ) : null,
        )}
        <path d={path('e1rm')} fill="none" stroke={C_1RM} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        <path d={path('top')} fill="none" stroke={C_TOP} strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.e1rm)} r="4" fill={C_1RM} stroke="var(--color-card)" strokeWidth="2" />
            <circle cx={x(i)} cy={y(d.top)} r="4" fill={C_TOP} stroke="var(--color-card)" strokeWidth="2" />
          </g>
        ))}
        {/* rótulos diretos só no último ponto */}
        {hover == null && (
          <>
            <text x={x(last)} y={y(data[last].e1rm) - 9} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--color-ink)" className="num">
              {fmtKg(Math.round(data[last].e1rm * 10) / 10)}
            </text>
            <text x={x(last)} y={y(data[last].top) + 18} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--color-ink)" className="num">
              {fmtKg(data[last].top)}
            </text>
          </>
        )}
        {h && hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-mute)" strokeWidth="1" />}
      </svg>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-8 rounded-xl border border-line bg-bg/95 px-3 py-2 text-sm shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? '-105%' : '5%'})` }}
        >
          <div className="font-bold text-ink">{dm(h.date)}</div>
          <div className="num flex items-center gap-2 text-ink">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: C_TOP }} />
            Top: {fmtKg(h.top)} kg × {h.topReps}
          </div>
          <div className="num flex items-center gap-2 text-ink">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: C_1RM }} />
            1RM est.: {fmtKg(Math.round(h.e1rm * 10) / 10)} kg
          </div>
        </div>
      )}
    </div>
  )
}
