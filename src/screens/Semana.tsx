import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, db, getSettings, isDeloadActive, isoDate, weekStart } from '../db'
import { go } from '../router'
import { DAY_NAMES } from '../types'
import { Check } from '../components/ui'
import { totalSets } from './Hoje'

export default function Semana() {
  const today = isoDate()
  const [offset, setOffset] = useState(0)
  const start = addDays(weekStart(today), offset * 7)
  const end = addDays(start, 6)
  const data = useLiveQuery(async () => {
    const [plan, sets, settings] = await Promise.all([db.plan.toArray(), db.sets.where('date').between(start, end, true, true).toArray(), getSettings()])
    return { plan, sets, settings }
  }, [start, end])
  if (!data) return null
  const { plan, sets, settings } = data
  const deload = isDeloadActive(settings, today)

  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const date = addDays(start, i)
    const dow = (i + 1) % 7
    const p = plan.find((d) => d.day === dow)
    const planIds = new Set(p?.items.map((x) => x.id))
    const done = sets.filter((s) => planIds.has(s.planItemId))
    const expected = p?.items.filter((x) => !x.optional).reduce((a, x) => a + totalSets(x, deload), 0) ?? 0
    return { date, dow, p, doneSets: done.length, expected, trained: done.length > 0 }
  })
  const trainDays = days.filter((d) => d.p && d.p.items.length && !d.p.optional)
  const doneDays = trainDays.filter((d) => d.trained).length

  return (
    <div className="px-4 pt-safe">
      <h1 className="pt-5 text-[28px] font-black">Semana</h1>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => setOffset(offset - 1)} className="h-12 w-14 rounded-xl bg-card text-xl font-bold" aria-label="Semana anterior">‹</button>
        <div className="num flex-1 text-center font-bold">
          {fmt(start)} – {fmt(end)}
          {offset === 0 && <span className="text-mute"> · esta semana</span>}
        </div>
        <button onClick={() => setOffset(offset + 1)} disabled={offset >= 0} className="h-12 w-14 rounded-xl bg-card text-xl font-bold disabled:opacity-30" aria-label="Próxima semana">›</button>
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4">
        <div className="num text-4xl font-black">
          {doneDays}
          <span className="text-mute">/{trainDays.length}</span>
        </div>
        <div className="text-mute">treinos feitos · {sets.length} séries no total</div>
        <div className="mt-3 flex gap-1">
          {trainDays.map((d) => (
            <div key={d.date} className={`h-2 flex-1 rounded-full ${d.trained ? 'bg-done' : 'bg-line'}`} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {days.map((d) => {
          const isToday = d.date === today
          const rest = !d.p || d.p.items.length === 0
          return (
            <button
              key={d.date}
              onClick={() => !rest && go(d.dow === new Date().getDay() ? '' : `dia/${d.dow}`)}
              className={`flex min-h-[72px] items-center gap-3 rounded-2xl px-4 py-3 text-left ${isToday ? 'bg-card ring-2 ring-accent/60' : 'bg-card'} ${rest ? 'opacity-60' : ''}`}
            >
              <div className="w-12 shrink-0">
                <div className="text-sm font-bold text-mute">{DAY_NAMES[d.dow].slice(0, 3)}</div>
                <div className="num text-lg font-black">{d.date.slice(8)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{rest ? 'Descanso' : `${d.p!.code} · ${d.p!.title}`}</div>
                {!rest && (
                  <div className="num text-sm text-mute">
                    {d.doneSets}/{d.expected} séries{d.p!.optional ? ' · opcional' : ''}
                    {isToday ? ' · hoje' : ''}
                  </div>
                )}
              </div>
              {d.trained ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-done text-bg">
                  <Check className="h-7 w-7" />
                </span>
              ) : (
                !rest && <span className="h-11 w-11 rounded-full border-2 border-line" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
