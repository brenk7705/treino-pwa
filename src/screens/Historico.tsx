import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { go } from '../router'
import { epley, fmtKg, groupSessions, topSetOf } from '../logic/progression'
import ExerciseAnim from '../components/ExerciseAnim'
import LineChart, { type Point } from '../components/LineChart'

export default function Historico({ exerciseId }: { exerciseId?: string }) {
  const data = useLiveQuery(async () => {
    const [exercises, sets] = await Promise.all([db.exercises.toArray(), db.sets.toArray()])
    return { exercises, sets }
  })
  if (!data) return null
  const { exercises, sets } = data

  if (!exerciseId) {
    const stats = exercises
      .map((e) => {
        const s = sets.filter((x) => x.exerciseId === e.id)
        const last = s.reduce((a, x) => (x.date > a ? x.date : a), '')
        return { e, count: new Set(s.map((x) => x.sessionId)).size, last }
      })
      .sort((a, b) => (b.last > a.last ? 1 : b.last < a.last ? -1 : a.e.name.localeCompare(b.e.name)))
    return (
      <div className="px-4 pt-safe">
        <h1 className="pt-5 text-[28px] font-black">Histórico</h1>
        <p className="text-mute">Escolha um exercício para ver a evolução.</p>
        <div className="mt-4 flex flex-col gap-2">
          {stats.map(({ e, count, last }) => (
            <button key={e.id} onClick={() => go(`historico/${e.id}`)} className={`flex items-center gap-3 rounded-2xl bg-card p-2 text-left ${count ? '' : 'opacity-50'}`}>
              <ExerciseAnim exercise={e} variant="thumb" className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{e.name}</div>
                <div className="text-sm text-mute">{count ? `${count} sessões · última ${fmt(last)}` : 'sem registros'}</div>
              </div>
              <span className="pr-2 text-xl text-mute">›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const ex = exercises.find((e) => e.id === exerciseId)
  const groups = groupSessions(sets.filter((s) => s.exerciseId === exerciseId))
  const points: Point[] = groups.map((g) => {
    const top = topSetOf(g.sets)!
    return { date: g.date, top: top.kg, topReps: top.reps, e1rm: Math.max(...g.sets.map((s) => epley(s.kg, s.reps))) }
  })
  const best = points.reduce<Point | null>((a, p) => (!a || p.e1rm > a.e1rm ? p : a), null)

  return (
    <div className="px-4 pt-safe">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={() => go('historico')} className="h-12 rounded-xl bg-card px-4 text-lg font-bold">‹ Exercícios</button>
      </div>
      <h1 className="mt-3 text-2xl leading-tight font-black">{ex?.name ?? exerciseId}</h1>

      {points.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-6 text-center text-mute">Nenhum registro ainda. Faça uma série e ela aparece aqui.</div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Último top set" value={`${fmtKg(points[points.length - 1].top)} kg`} sub={`× ${points[points.length - 1].topReps} reps`} />
            <Stat label="Melhor 1RM est." value={`${fmtKg(Math.round(best!.e1rm * 10) / 10)} kg`} sub={fmt(best!.date)} />
          </div>
          <div className="mt-4 rounded-2xl bg-card p-3">
            {points.length > 1 ? <LineChart data={points} /> : <p className="p-4 text-center text-mute">O gráfico aparece a partir da 2ª sessão.</p>}
          </div>

          <h2 className="mt-6 mb-2 px-1 text-sm font-bold tracking-wider text-mute uppercase">Sessões</h2>
          <div className="flex flex-col gap-2">
            {[...groups].reverse().map((g) => (
              <div key={g.sessionId} className="rounded-2xl bg-card p-3">
                <div className="flex justify-between">
                  <span className="font-bold">{fmtLong(g.date)}</span>
                  {g.deload && <span className="text-sm font-bold text-warn">deload</span>}
                </div>
                <div className="num mt-1 flex flex-wrap gap-1.5">
                  {[...g.sets]
                    .sort((a, b) => a.idx - b.idx)
                    .map((s) => (
                      <span key={s.id} className={`rounded-lg px-2 py-1 text-[15px] ${s.kind === 'top' ? 'bg-accent/15 font-bold text-accent' : 'bg-card2'}`}>
                        {fmtKg(s.kg)}×{s.reps}
                        {s.rir != null && <span className="text-mute"> @{s.rir}</span>}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-card p-3">
      <div className="text-xs font-bold tracking-wider text-mute uppercase">{label}</div>
      <div className="num text-2xl font-black">{value}</div>
      <div className="text-sm text-mute">{sub}</div>
    </div>
  )
}

const fmt = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '')
const fmtLong = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
