import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteSet, getSettings, isDeloadActive, isoDate, logSet } from '../db'
import { back, go } from '../router'
import { timer } from '../timer'
import { effectiveSets, fmtKg, prefillFor, roundTo, suggest } from '../logic/progression'
import type { Exercise, PlanItem, SetKind, SetLog } from '../types'
import ExerciseAnim from '../components/ExerciseAnim'
import TimerBar from '../components/TimerBar'
import { Check, TypeBadge, prescription } from '../components/ui'
import { totalSets } from './Hoje'

interface Row {
  idx: number
  kind: SetKind
  label: string
  target: string
  sugKg?: number
  autoKg?: boolean // carga calculada hoje (back-off) tem prioridade sobre a da última vez
}
interface Draft {
  kg: string
  reps: string
  rir: string
}
const EMPTY: Draft = { kg: '', reps: '', rir: '' }
const num = (s: string) => {
  const v = parseFloat(s.replace(',', '.'))
  return Number.isFinite(v) ? v : undefined
}

export default function Exercicio({ day, itemId }: { day: number; itemId: string }) {
  const today = isoDate()
  const data = useLiveQuery(async () => {
    const plan = await db.plan.get(day)
    const item = plan?.items.find((i) => i.id === itemId)
    if (!plan || !item) return { missing: true as const }
    const [exercise, history, settings, todaySets, exercises] = await Promise.all([
      db.exercises.get(item.exerciseId),
      db.sets.where('exerciseId').equals(item.exerciseId).toArray(),
      getSettings(),
      db.sets.where('date').equals(today).toArray(),
      db.exercises.toArray(),
    ])
    const refHistory = item.refExerciseId ? await db.sets.where('exerciseId').equals(item.refExerciseId).toArray() : undefined
    return { missing: false as const, plan, item, exercise: exercise!, history, settings, todaySets, exercises, refHistory }
  }, [day, itemId, today])

  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [editing, setEditing] = useState<Set<number>>(new Set())
  const [info, setInfo] = useState(false)
  const [error, setError] = useState('')

  if (!data) return null
  if (data.missing) {
    return (
      <div className="p-6">
        <p>Exercício não encontrado no plano.</p>
        <button className="mt-4 h-14 rounded-2xl bg-card px-5 font-bold" onClick={() => go('')}>Voltar</button>
      </div>
    )
  }
  const { plan, item, exercise, history, settings, todaySets, exercises, refHistory } = data
  const exName = (id: string) => exercises.find((e) => e.id === id)?.name ?? id
  const deload = isDeloadActive(settings, today)
  const eff = effectiveSets(item, deload)
  const sug = suggest({ item, exercise, settings, history, refHistory, refName: item.refExerciseId ? exName(item.refExerciseId) : undefined, today, deload })
  const prefill = prefillFor(history, today)
  const doneSets = new Map(todaySets.filter((s) => s.planItemId === item.id).map((s) => [s.idx, s]))
  const [rirTop, rirBo] = item.rir.split('/')

  const rows: Row[] = []
  if (item.type === 'principal') {
    // back-off = % do top set de HOJE (se já feito), senão da sugestão
    const todayTop = doneSets.get(0)
    const step = settings.rounding[exercise.equipment] ?? 1
    const boKg = todayTop ? roundTo(todayTop.kg * settings.backoffPct, step) : sug.backoffKg
    rows.push({ idx: 0, kind: 'top', label: 'TOP', target: `${item.repMin}–${item.repMax} reps · RIR ${rirTop}`, sugKg: sug.kg })
    for (let i = 1; i <= eff.backoffSets; i++) rows.push({ idx: i, kind: 'backoff', label: `B${i}`, target: `${item.backoffReps} reps · RIR ${rirBo ?? rirTop} · ${Math.round(settings.backoffPct * 100)}%`, sugKg: boKg, autoKg: !!todayTop })
  } else {
    const reps = item.repMin === item.repMax ? `${item.repMin}` : `${item.repMin}–${item.repMax}`
    for (let i = 0; i < eff.sets; i++) rows.push({ idx: i, kind: 'work', label: `${i + 1}`, target: `${reps} reps · RIR ${item.rir}`, sugKg: sug.kg })
  }
  const current = rows.find((r) => !doneSets.has(r.idx))

  // superset
  const group = item.supersetGroup ? plan.items.filter((i) => i.supersetGroup === item.supersetGroup) : []
  const posInGroup = group.findIndex((i) => i.id === item.id)
  const partner = group.length > 1 ? group[(posInGroup + 1) % group.length] : undefined
  const partnerLeft = partner ? totalSets(partner, deload) - todaySets.filter((s) => s.planItemId === partner.id).length : 0
  const lastInGroup = !group.length || posInGroup === group.length - 1
  const afterIdx = group.length ? plan.items.findIndex((i) => i.id === group[group.length - 1].id) : plan.items.findIndex((i) => i.id === item.id)
  const nextItem = plan.items[afterIdx + 1]

  const setDraft = (idx: number, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [idx]: { ...EMPTY, ...d[idx], ...patch } }))

  async function save(row: Row) {
    const d = drafts[row.idx] ?? EMPTY
    const pf = prefill.get(row.idx)
    const kg = num(d.kg) ?? (row.autoKg ? row.sugKg : undefined) ?? pf?.kg ?? row.sugKg ?? 0
    const reps = num(d.reps) ?? pf?.reps
    const rir = num(d.rir) ?? pf?.rir ?? null
    if (reps == null) {
      setError('Digite quantas reps você fez.')
      return
    }
    setError('')
    const wasEdit = doneSets.has(row.idx)
    await logSet({ exerciseId: item.exerciseId, planItemId: item.id, idx: row.idx, kind: row.kind, kg, reps: Math.round(reps), rir: rir == null ? null : Math.round(rir), date: today, day, deload })
    setDrafts((x) => {
      const n = { ...x }
      delete n[row.idx]
      return n
    })
    setEditing((s) => {
      const n = new Set(s)
      n.delete(row.idx)
      return n
    })
    navigator.vibrate?.(40)
    if (!wasEdit && lastInGroup) timer.start(item.restSec, exercise.name)
  }

  function fillSuggestion() {
    const next: Record<number, Draft> = { ...drafts }
    for (const r of rows) if (r.sugKg != null && !doneSets.has(r.idx)) next[r.idx] = { ...EMPTY, ...next[r.idx], kg: String(r.sugKg) }
    setDrafts(next)
  }

  const allDone = !current

  return (
    <div className="pt-safe">
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur">
        <button onClick={() => back(day === new Date().getDay() ? '' : `dia/${day}`)} className="h-12 rounded-xl bg-card px-4 text-lg font-bold">‹ Treino</button>
        <div className="min-w-0 flex-1 truncate text-right text-sm text-mute">
          {plan.code} · {plan.items.indexOf(item) + 1}/{plan.items.length}
        </div>
      </div>

      <button onClick={() => setInfo(true)} className="relative block w-full" aria-label="Ver técnica do exercício">
        <ExerciseAnim exercise={exercise} className="aspect-[3/2] w-full" />
        <span className="absolute right-3 bottom-3 rounded-full bg-bg/80 px-3 py-1.5 text-sm font-bold">Técnica ⓘ</span>
      </button>

      <div className="px-4">
        <div className="mt-3 flex items-center gap-2">
          <TypeBadge type={item.type} />
          {deload && <span className="rounded-md bg-warn/20 px-2 py-0.5 text-[11px] font-extrabold text-warn">DELOAD</span>}
          {group.length > 1 && <span className="rounded-md bg-line px-2 py-0.5 text-[11px] font-extrabold text-mute">SUPERSET</span>}
        </div>
        <h1 className="mt-1 text-2xl leading-tight font-black">{exercise.name}</h1>
        <div className="num text-mute">
          {prescription(item, eff.sets, eff.backoffSets)} · RIR {item.rir} · descanso {item.restLabel}
          {item.note && <span className="text-warn"> · {item.note}</span>}
        </div>

        {/* sugestão de progressão */}
        <div className={`mt-4 rounded-2xl border p-4 ${sug.up ? 'border-accent/50 bg-accent/10' : 'border-line bg-card'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`text-2xl font-black ${sug.up ? 'text-accent' : 'text-ink'}`}>
                {sug.headline}
                {sug.up && ' ↑'}
              </div>
              {sug.backoffKg != null && <div className="num font-bold text-ink/90">Back-off: {fmtKg(sug.backoffKg)} kg</div>}
              <p className="mt-1 text-sm text-mute">{sug.detail}</p>
            </div>
            {sug.kg != null && !allDone && (
              <button onClick={fillSuggestion} className="h-12 shrink-0 rounded-xl bg-ink px-3 font-extrabold text-bg">Preencher</button>
            )}
          </div>
        </div>

        {/* séries */}
        <div className="mt-4 grid grid-cols-[44px_1fr_1fr_1fr] gap-2 px-1 text-center text-xs font-bold tracking-wider text-mute uppercase">
          <span />
          <span>kg</span>
          <span>reps</span>
          <span>RIR</span>
        </div>
        <div className="mt-1 flex flex-col gap-2">
          {rows.map((r) => {
            const done = doneSets.get(r.idx)
            const isEditing = editing.has(r.idx)
            const isCurrent = current?.idx === r.idx
            if (done && !isEditing) return <DoneRow key={r.idx} row={r} set={done} onEdit={() => {
              setDrafts((d) => ({ ...d, [r.idx]: { kg: String(done.kg), reps: String(done.reps), rir: done.rir == null ? '' : String(done.rir) } }))
              setEditing((s) => new Set(s).add(r.idx))
            }} />
            const pf = prefill.get(r.idx)
            const d = drafts[r.idx] ?? EMPTY
            return (
              <div key={r.idx} className={`rounded-2xl p-2 ${isCurrent || isEditing ? 'bg-card ring-2 ring-accent/70' : 'bg-card/60'}`}>
                <div className="mb-1.5 flex justify-between px-1 text-xs text-mute">
                  <span className="font-bold">{r.kind === 'top' ? 'Top set' : r.kind === 'backoff' ? 'Back-off' : `Série ${r.label}`}</span>
                  <span>{r.target}</span>
                </div>
                <div className="grid grid-cols-[44px_1fr_1fr_1fr] items-center gap-2">
                  <span className={`text-center text-lg font-black ${r.kind === 'top' ? 'text-accent' : 'text-mute'}`}>{r.label}</span>
                  <NumInput value={d.kg} placeholder={r.autoKg && r.sugKg != null ? fmtKg(r.sugKg) : pf ? fmtKg(pf.kg) : r.sugKg != null ? fmtKg(r.sugKg) : '0'} decimal onChange={(v) => setDraft(r.idx, { kg: v })} label={`Carga série ${r.label}`} />
                  <NumInput value={d.reps} placeholder={pf ? String(pf.reps) : '—'} onChange={(v) => setDraft(r.idx, { reps: v })} label={`Reps série ${r.label}`} />
                  <NumInput value={d.rir} placeholder={pf?.rir != null ? String(pf.rir) : '—'} onChange={(v) => setDraft(r.idx, { rir: v })} label={`RIR série ${r.label}`} />
                </div>
                {isEditing && done && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button onClick={() => save(r)} className="col-span-2 h-12 rounded-xl bg-accent font-extrabold text-accent-ink">Salvar</button>
                    <button onClick={() => { void deleteSet(done.id!); setEditing((s) => { const n = new Set(s); n.delete(r.idx); return n }) }} className="h-12 rounded-xl border border-danger/40 font-bold text-danger">Apagar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {prefill.size > 0 && <p className="mt-2 px-1 text-xs text-mute">Em cinza: o que você fez da última vez. Toque em “✓ Série feita” para repetir ou digite os novos valores.</p>}

        <div className="mt-6 rounded-2xl bg-card p-4">
          <div className="text-sm font-bold tracking-wider text-mute uppercase">Técnica</div>
          <Tips exercise={exercise} />
          <button onClick={() => go(`historico/${exercise.id}`)} className="mt-3 h-12 w-full rounded-xl border border-line font-bold">Ver histórico e gráfico</button>
        </div>
      </div>

      {/* barra inferior fixa: cronômetro + ação principal */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl">
        <TimerBar />
        <div className="flex flex-col gap-2 border-t border-line bg-bg/95 p-3 backdrop-blur">
          {error && <div className="text-center font-bold text-danger">{error}</div>}
          {partner && partnerLeft > 0 && (
            <button onClick={() => go(`ex/${day}/${partner.id}`)} className="h-14 rounded-2xl border border-line bg-card2 text-lg font-extrabold">
              ⇄ Superset: {exName(partner.exerciseId)}
            </button>
          )}
          {current ? (
            <button onClick={() => save(current)} className="h-[72px] rounded-2xl bg-accent text-2xl font-black text-accent-ink active:scale-[.98]">
              ✓ Série feita <span className="text-base font-bold opacity-70">({rows.indexOf(current) + 1}/{rows.length})</span>
            </button>
          ) : nextItem ? (
            <button onClick={() => go(`ex/${day}/${nextItem.id}`)} className="h-[72px] rounded-2xl bg-done text-xl font-black text-bg">
              Próximo: {exName(nextItem.exerciseId)} →
            </button>
          ) : (
            <button onClick={() => go(day === new Date().getDay() ? '' : `dia/${day}`)} className="h-[72px] rounded-2xl bg-done text-xl font-black text-bg">
              Último exercício feito ✓ — voltar
            </button>
          )}
        </div>
      </div>

      {info && <InfoModal exercise={exercise} item={item} onClose={() => setInfo(false)} />}
    </div>
  )
}

function NumInput({ value, placeholder, onChange, decimal, label }: { value: string; placeholder: string; onChange: (v: string) => void; decimal?: boolean; label: string }) {
  return (
    <input
      aria-label={label}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
      className="num h-14 w-full min-w-0 rounded-xl border border-line bg-card2 text-center text-2xl font-extrabold text-ink placeholder:text-mute/60 focus:border-accent focus:outline-none"
    />
  )
}

function DoneRow({ row, set, onEdit }: { row: Row; set: SetLog; onEdit: () => void }) {
  return (
    <button onClick={onEdit} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 rounded-2xl bg-done/10 p-2 text-left ring-1 ring-done/30">
      <span className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-done text-bg">
        <Check className="h-6 w-6" />
      </span>
      <span className="num text-xl font-extrabold">
        {fmtKg(set.kg)} kg × {set.reps}
        {set.rir != null && <span className="text-base font-bold text-mute"> @RIR {set.rir}</span>}
      </span>
      <span className="pr-2 text-sm text-mute">editar</span>
      <span className="sr-only">{row.label}</span>
    </button>
  )
}

function Tips({ exercise }: { exercise: Exercise }) {
  return (
    <>
      <ul className="mt-2 flex flex-col gap-2">
        {exercise.tips.map((t) => (
          <li key={t} className="flex gap-2 text-[16px] leading-snug">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {exercise.muscles.map((m) => (
          <span key={m} className="rounded-full bg-line px-3 py-1 text-sm font-semibold">{m}</span>
        ))}
      </div>
    </>
  )
}

function InfoModal({ exercise, item, onClose }: { exercise: Exercise; item: PlanItem; onClose: () => void }) {
  return (
    <div className="pop fixed inset-0 z-50 overflow-y-auto bg-bg pt-safe pb-safe">
      <div className="flex items-center justify-between p-3">
        <TypeBadge type={item.type} />
        <button onClick={onClose} className="h-14 rounded-2xl bg-card px-6 text-lg font-bold">Fechar</button>
      </div>
      <ExerciseAnim exercise={exercise} className="aspect-[3/2] w-full" />
      <div className="p-4">
        <h2 className="text-2xl font-black">{exercise.name}</h2>
        <div className="mt-3 text-sm font-bold tracking-wider text-mute uppercase">Dicas de técnica</div>
        <Tips exercise={exercise} />
        {!exercise.fedbId && <p className="mt-4 text-xs text-mute">Animação ilustrativa (boneco). Exercício não disponível no free-exercise-db.</p>}
      </div>
    </div>
  )
}
