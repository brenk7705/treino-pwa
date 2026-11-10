import { useEffect, useState } from 'react'
import { remainingSec, timer, useTick, useTimer } from '../timer'

export function fmtClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TimerBar() {
  const s = useTimer()
  useTick(!!s.endAt)
  const [full, setFull] = useState(false)

  // aviso de "acabou" some sozinho depois de 30 s
  useEffect(() => {
    if (!s.finishedAt) return
    const h = setTimeout(() => timer.dismiss(), 30_000)
    return () => clearTimeout(h)
  }, [s.finishedAt])

  if (s.finishedAt && !s.endAt) {
    return (
      <button onClick={() => timer.dismiss()} className="ring-pulse flex w-full items-center justify-between bg-accent px-5 py-4 text-left text-accent-ink">
        <span className="text-2xl font-black">Descanso acabou — bora!</span>
        <span className="text-sm font-bold opacity-70">OK</span>
      </button>
    )
  }
  if (!s.endAt) return null

  const left = remainingSec(s)
  const pct = s.total ? Math.min(100, ((s.total - left) / s.total) * 100) : 0

  return (
    <>
      <div className="relative border-t border-line bg-card2">
        <div className="absolute inset-y-0 left-0 bg-info/15" style={{ width: `${pct}%` }} />
        <div className="relative flex items-center gap-2 px-3 py-2">
          <button onClick={() => setFull(true)} className="flex flex-1 flex-col items-start pl-1" aria-label="Abrir cronômetro em tela cheia">
            <span className="num text-[40px] leading-none font-black text-info">{fmtClock(left)}</span>
            <span className="max-w-[150px] truncate text-xs text-mute">{s.label || 'Descanso'}</span>
          </button>
          <TimerButtons small />
        </div>
      </div>
      {full && <TimerFull onClose={() => setFull(false)} />}
    </>
  )
}

function TimerButtons({ small }: { small?: boolean }) {
  const cls = small ? 'h-14 min-w-14 px-3 text-lg' : 'h-20 flex-1 text-2xl'
  return (
    <>
      <button onClick={() => timer.add(-15)} className={`${cls} rounded-2xl bg-card font-bold active:bg-line`}>−15</button>
      <button onClick={() => timer.add(15)} className={`${cls} rounded-2xl bg-card font-bold active:bg-line`}>+15</button>
      <button onClick={() => timer.skip()} className={`${cls} rounded-2xl bg-info font-bold text-bg active:opacity-80`}>Pular</button>
    </>
  )
}

function TimerFull({ onClose }: { onClose: () => void }) {
  const s = useTimer()
  useTick(!!s.endAt)
  useEffect(() => {
    if (!s.endAt) onClose()
  }, [s.endAt, onClose])
  const left = remainingSec(s)
  const r = 130
  const c = 2 * Math.PI * r
  const frac = s.total ? left / s.total : 0
  return (
    <div className="pop fixed inset-0 z-50 flex flex-col items-center justify-between bg-bg px-5 pt-safe pb-safe">
      <div className="flex w-full items-center justify-between pt-4">
        <span className="text-lg text-mute">{s.label || 'Descanso'}</span>
        <button onClick={onClose} className="h-14 rounded-2xl bg-card px-5 text-lg font-bold">Fechar</button>
      </div>
      <div className="relative flex items-center justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
          <circle cx="150" cy="150" r={r} fill="none" stroke="var(--color-line)" strokeWidth="14" />
          <circle cx="150" cy="150" r={r} fill="none" stroke="var(--color-info)" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset .25s linear' }} />
        </svg>
        <span className="num absolute text-[88px] font-black text-ink">{fmtClock(left)}</span>
      </div>
      <div className="flex w-full gap-3 pb-6">
        <TimerButtons />
      </div>
    </div>
  )
}
