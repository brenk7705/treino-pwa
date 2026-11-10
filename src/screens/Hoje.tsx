import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSettings, isDeloadActive, isoDate } from '../db'
import { go } from '../router'
import { effectiveSets } from '../logic/progression'
import { DAY_NAMES, DAY_SHORT, type Exercise, type PlanItem } from '../types'
import ExerciseAnim from '../components/ExerciseAnim'
import DeloadBanner from '../components/DeloadBanner'
import { Check, TypeBadge, prescription } from '../components/ui'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function Hoje({ day }: { day: number }) {
  const today = isoDate()
  const todayDow = new Date().getDay()
  const plan = useLiveQuery(() => db.plan.get(day), [day])
  const exercises = useLiveQuery(() => db.exercises.toArray())
  const todaySets = useLiveQuery(() => db.sets.where('date').equals(today).toArray(), [today])
  const settings = useLiveQuery(getSettings)
  const deload = settings ? isDeloadActive(settings, today) : false
  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]))

  const longDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // agrupa supersets consecutivos
  const groups: PlanItem[][] = []
  for (const it of plan?.items ?? []) {
    const prev = groups[groups.length - 1]
    if (it.supersetGroup && prev && prev[0].supersetGroup === it.supersetGroup) prev.push(it)
    else groups.push([it])
  }
  const allDone = (plan?.items ?? []).filter((i) => !i.optional)
  const doneCount = allDone.filter((i) => (todaySets ?? []).filter((s) => s.planItemId === i.id).length >= totalSets(i, deload)).length

  return (
    <div className="px-4 pt-safe">
      <header className="pt-5">
        <div className="text-sm font-semibold text-mute">
          Hoje · {longDate}
          {day !== todayDow && <span className="text-warn"> · treino trocado manualmente</span>}
        </div>
        <h1 className="mt-1 text-[28px] leading-tight font-black">
          {DAY_NAMES[day]}
          {plan && plan.items.length > 0 && (
            <span className="text-accent">
              {' '}
              — {plan.code} {plan.title}
            </span>
          )}
        </h1>
        {plan && plan.items.length > 0 && (
          <div className="mt-1 text-mute">
            {doneCount}/{allDone.length} exercícios concluídos{deload && <span className="font-bold text-warn"> · DELOAD</span>}
          </div>
        )}
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1.5" role="tablist" aria-label="Trocar dia">
        {WEEK_ORDER.map((d) => (
          <button
            key={d}
            onClick={() => go(d === todayDow ? '' : `dia/${d}`)}
            className={`relative h-12 rounded-xl text-[15px] font-bold ${d === day ? 'bg-ink text-bg' : 'bg-card text-mute'}`}
            aria-selected={d === day}
          >
            {DAY_SHORT[d]}
            {d === todayDow && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      <DeloadBanner />

      {plan && plan.items.length === 0 && (
        <div className="mt-10 rounded-3xl bg-card p-8 text-center">
          <div className="text-2xl font-black">Dia de descanso</div>
          <p className="mt-2 text-mute">Recupere bem. Quer treinar mesmo assim? Escolha outro dia acima.</p>
        </div>
      )}
      {plan?.optional && <p className="mt-4 text-mute">Treino opcional de ~15 min.</p>}

      <div className="mt-4 flex flex-col gap-3">
        {groups.map((g) =>
          g.length > 1 ? (
            <div key={g[0].id} className="rounded-3xl border border-dashed border-line p-2">
              <div className="px-2 pt-1 pb-2 text-xs font-bold tracking-wider text-mute uppercase">Superset — alterne os dois, descanso após o par</div>
              <div className="flex flex-col gap-2">
                {g.map((it) => (
                  <Card key={it.id} item={it} day={day} ex={exMap.get(it.exerciseId)} done={(todaySets ?? []).filter((s) => s.planItemId === it.id).length} deload={deload} />
                ))}
              </div>
            </div>
          ) : (
            <Card key={g[0].id} item={g[0]} day={day} ex={exMap.get(g[0].exerciseId)} done={(todaySets ?? []).filter((s) => s.planItemId === g[0].id).length} deload={deload} />
          ),
        )}
      </div>
    </div>
  )
}

export function totalSets(item: PlanItem, deload: boolean) {
  const e = effectiveSets(item, deload)
  return item.type === 'principal' ? 1 + e.backoffSets : e.sets
}

function Card({ item, ex, day, done, deload }: { item: PlanItem; ex?: Exercise; day: number; done: number; deload: boolean }) {
  const total = totalSets(item, deload)
  const eff = effectiveSets(item, deload)
  const complete = done >= total
  return (
    <button
      onClick={() => go(`ex/${day}/${item.id}`)}
      className={`flex w-full items-center gap-3 rounded-3xl p-2.5 text-left active:scale-[.99] ${complete ? 'bg-done/10 ring-1 ring-done/40' : 'bg-card'}`}
    >
      <ExerciseAnim exercise={ex} variant="thumb" className="h-[76px] w-[76px] shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} />
          {item.optional && <span className="text-xs text-mute">opcional</span>}
        </div>
        <div className="mt-1 text-[17px] leading-snug font-bold">{ex?.name ?? item.exerciseId}</div>
        <div className="num mt-0.5 text-[14px] text-mute">
          {prescription(item, eff.sets, eff.backoffSets)} · RIR {item.rir} · {item.restLabel}
        </div>
        {item.note && <div className="text-[13px] text-warn/90">{item.note}</div>}
      </div>
      <div className="flex w-12 shrink-0 flex-col items-center">
        {complete ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-done text-bg">
            <Check className="h-6 w-6" />
          </span>
        ) : (
          <span className="num text-lg font-black text-mute">
            {done}/{total}
          </span>
        )}
      </div>
    </button>
  )
}
