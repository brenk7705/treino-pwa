import type { Exercise, PlanDay, PlanItem, SetLog, Settings } from '../types'

export function roundTo(x: number, step: number): number {
  if (!step || step <= 0) return Math.round(x * 100) / 100
  return Math.round(Math.round(x / step) * step * 100) / 100
}

/** 1RM estimada (Epley) */
export function epley(kg: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return kg
  return kg * (1 + reps / 30)
}

export function fmtKg(kg: number): string {
  return kg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export interface SessionGroup {
  sessionId: number
  date: string
  deload: boolean
  sets: SetLog[]
}

/** agrupa séries por sessão, em ordem cronológica */
export function groupSessions(sets: SetLog[]): SessionGroup[] {
  const map = new Map<number, SessionGroup>()
  for (const s of [...sets].sort((a, b) => a.doneAt - b.doneAt)) {
    let g = map.get(s.sessionId)
    if (!g) {
      g = { sessionId: s.sessionId, date: s.date, deload: !!s.deload, sets: [] }
      map.set(s.sessionId, g)
    }
    g.sets.push(s)
  }
  return [...map.values()].sort((a, b) => (a.date === b.date ? a.sets[0].doneAt - b.sets[0].doneAt : a.date < b.date ? -1 : 1))
}

/** top set: série marcada como "top"; senão a mais pesada (empate → mais reps) */
export function topSetOf(sets: SetLog[]): SetLog | undefined {
  const tops = sets.filter((s) => s.kind === 'top')
  const pool = tops.length ? tops : sets
  return [...pool].sort((a, b) => b.kg - a.kg || b.reps - a.reps)[0]
}

/** última sessão ANTES de hoje (opcionalmente ignorando deloads) */
export function lastPrior(history: SetLog[], today: string, skipDeload = true): SessionGroup | undefined {
  const groups = groupSessions(history).filter((g) => g.date < today && (!skipDeload || !g.deload))
  return groups[groups.length - 1]
}

/** séries da última vez, por índice — usado para pré-preencher (em cinza) */
export function prefillFor(history: SetLog[], today: string): Map<number, SetLog> {
  const last = lastPrior(history, today, false)
  const m = new Map<number, SetLog>()
  last?.sets.forEach((s) => m.set(s.idx, s))
  return m
}

export function effectiveSets(item: PlanItem, deload: boolean): { sets: number; backoffSets: number } {
  const half = (n: number) => Math.max(1, Math.ceil(n / 2))
  const bo = item.backoffSets ?? 0
  if (!deload) return { sets: item.sets, backoffSets: bo }
  if (item.type === 'principal') return { sets: 1, backoffSets: bo ? half(bo) : 0 }
  return { sets: half(item.sets), backoffSets: 0 }
}

export interface Suggestion {
  /** carga sugerida (top set no principal; carga das séries nos demais) */
  kg?: number
  backoffKg?: number
  headline: string
  detail: string
  up?: boolean
}

interface SuggestArgs {
  item: PlanItem
  exercise: Exercise
  settings: Settings
  history: SetLog[]
  refHistory?: SetLog[]
  refName?: string
  today: string
  deload: boolean
}

export function suggest({ item, exercise, settings, history, refHistory, refName, today, deload }: SuggestArgs): Suggestion {
  const step = settings.rounding[exercise.equipment] ?? 1
  const r = (x: number) => roundTo(x, step)
  const deloadNote = ' · DELOAD: −10% de carga, metade das séries'

  if (item.type === 'moderado') {
    const base = refHistory ? lastTopSet(refHistory) : undefined
    if (!base) {
      return { headline: 'Sem referência ainda', detail: `Faça primeiro o ${refName ?? 'exercício de referência'} para calcular ${Math.round((item.refPct ?? 0) * 100)}% do top set.` }
    }
    let kg = r(base.kg * (item.refPct ?? 1))
    if (deload) kg = r(kg * 0.9)
    return {
      kg,
      headline: `Hoje tente: ${fmtKg(kg)} kg`,
      detail: `${Math.round((item.refPct ?? 1) * 100)}% do último top set de ${refName ?? 'referência'} (${fmtKg(base.kg)} kg × ${base.reps})${deload ? deloadNote : ''}`,
    }
  }

  const last = lastPrior(history, today)
  if (!last) {
    return {
      headline: 'Primeira vez',
      detail: `Escolha uma carga para ${item.repMin}–${item.repMax} reps deixando RIR ${item.rir}.`,
    }
  }

  if (item.type === 'principal') {
    const top = topSetOf(last.sets)!
    const inc = exercise.lower ? settings.incPrincipalLower : settings.incPrincipalUpper
    const hit = top.reps >= item.repMax && (top.rir ?? 0) >= 1
    let kg = hit ? r(top.kg + inc) : r(top.kg)
    if (deload) kg = r(top.kg * 0.9)
    const backoffKg = r(kg * settings.backoffPct)
    return {
      kg,
      backoffKg,
      up: hit && !deload,
      headline: `Hoje tente: ${fmtKg(kg)} kg`,
      detail: deload
        ? `Último top: ${fmtKg(top.kg)} kg × ${top.reps}${deloadNote}`
        : hit
          ? `Bateu ${top.reps} reps @RIR ${top.rir} no top set (${fmtKg(top.kg)} kg) → +${fmtKg(inc)} kg. Back-off ${fmtKg(backoffKg)} kg.`
          : `Último top: ${fmtKg(top.kg)} kg × ${top.reps}${top.rir != null ? ` @RIR ${top.rir}` : ''}. Repita a carga e busque ${item.repMax} reps com RIR ≥ 1. Back-off ${fmtKg(backoffKg)} kg.`,
    }
  }

  // acessório / isolado → dupla progressão
  const work = last.sets.filter((s) => s.kind === 'work')
  const pool = work.length ? work : last.sets
  const base = Math.max(...pool.map((s) => s.kg))
  const allTop = pool.length >= item.sets && pool.every((s) => s.reps >= item.repMax)
  const inc = settings.increment[exercise.equipment] ?? 2.5
  if (deload) {
    const kg = r(base * 0.9)
    return { kg, headline: `Hoje tente: ${fmtKg(kg)} kg`, detail: `Última: ${fmtKg(base)} kg${deloadNote}` }
  }
  if (allTop) {
    if (base === 0 && exercise.equipment === 'corpo') {
      return { kg: 0, up: true, headline: 'Hora de progredir!', detail: `Fez ${item.repMax}+ reps em todas as séries: adicione carga ou use uma variação mais difícil.` }
    }
    const kg = r(base + inc)
    return {
      kg,
      up: true,
      headline: `Hoje tente: ${fmtKg(kg)} kg`,
      detail: `Fez ${item.repMax}+ reps em todas as séries com ${fmtKg(base)} kg → +${fmtKg(kg - base)} kg. Volte para ${item.repMin} reps e suba de novo.`,
    }
  }
  const repsTxt = pool.map((s) => s.reps).join('/')
  return {
    kg: r(base),
    headline: `Hoje tente: ${fmtKg(r(base))} kg`,
    detail: `Mesma carga, tente mais reps (última: ${repsTxt}). Suba quando fizer ${item.repMax} em todas as séries.`,
  }
}

function lastTopSet(history: SetLog[]): SetLog | undefined {
  const groups = groupSessions(history.filter((s) => s.kind === 'top' && !s.deload))
  const g = groups[groups.length - 1]
  return g ? topSetOf(g.sets) : undefined
}

// ---------- deload ----------
export function deloadReasons(args: { plan: PlanDay[]; allSets: SetLog[]; settings: Settings; today: string; exerciseName: (id: string) => string }): string[] {
  const { plan, allSets, settings, today, exerciseName } = args
  if (settings.deloadUntil && today <= settings.deloadUntil) return []
  if (settings.deloadDismissed && daysBetween(settings.deloadDismissed, today) < 7) return []

  const reasons: string[] = []
  const principals = new Set(plan.flatMap((d) => d.items.filter((i) => i.type === 'principal').map((i) => i.exerciseId)))
  for (const exId of principals) {
    const tops = groupSessions(allSets.filter((s) => s.exerciseId === exId && s.kind === 'top' && !s.deload)).map((g) => topSetOf(g.sets)!.kg)
    if (tops.length >= 3) {
      const [a, b, c] = tops.slice(-3)
      if (b < a && c < b) reasons.push(`Top set do ${exerciseName(exId)} caiu 2 sessões seguidas (${fmtKg(a)} → ${fmtKg(b)} → ${fmtKg(c)} kg).`)
    }
  }
  const dates = allSets.map((s) => s.date).sort()
  const since = settings.deloadStart ?? dates[0]
  if (since && dates.length && daysBetween(since, today) >= 49) {
    reasons.push(`${Math.floor(daysBetween(since, today) / 7)} semanas sem deload.`)
  }
  return reasons
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}
