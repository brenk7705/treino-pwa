import { describe, expect, it } from 'vitest'
import { deloadReasons, effectiveSets, epley, roundTo, suggest } from './progression'
import { EXERCISE_BY_ID } from '../data/exerciseMap'
import { SEED_PLAN } from '../data/seedPlan'
import { DEFAULT_SETTINGS, type PlanItem, type SetKind, type SetLog } from '../types'

let id = 0
function set(date: string, sessionId: number, exerciseId: string, idx: number, kind: SetKind, kg: number, reps: number, rir: number | null = 1, deload = false): SetLog {
  id++
  return { id, sessionId, date, exerciseId, planItemId: 'x', idx, kind, kg, reps, rir, doneAt: Date.parse(date) + id, deload }
}
const item = (exId: string) => SEED_PLAN.flatMap((d) => d.items).find((i) => i.exerciseId === exId)! as PlanItem
const base = { settings: DEFAULT_SETTINGS, today: '2026-11-10', deload: false }

describe('utilitários', () => {
  it('arredonda para o passo', () => {
    expect(roundTo(101.2, 2.5)).toBe(100)
    expect(roundTo(101.3, 2.5)).toBe(102.5)
    expect(roundTo(91.25, 2.5)).toBe(92.5)
    expect(roundTo(13.4, 1)).toBe(13)
  })
  it('Epley', () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 1)
    expect(epley(100, 1)).toBe(100)
  })
})

describe('principal (top set + back-off)', () => {
  const zercher = item('zercher')
  const militar = item('desenv-militar')
  it('bateu topo da faixa com RIR ≥ 1 → +5 kg em zercher, back-off 90%', () => {
    const h = [set('2026-11-03', 1, 'zercher', 0, 'top', 100, 5, 1)]
    const s = suggest({ ...base, item: zercher, exercise: EXERCISE_BY_ID.zercher, history: h })
    expect(s.kg).toBe(105)
    expect(s.backoffKg).toBe(95) // 94.5 → 95 (passo 2,5)
    expect(s.up).toBe(true)
  })
  it('membros superiores → +2,5 kg', () => {
    const h = [set('2026-11-03', 1, 'desenv-militar', 0, 'top', 50, 6, 2)]
    expect(suggest({ ...base, item: militar, exercise: EXERCISE_BY_ID['desenv-militar'], history: h }).kg).toBe(52.5)
  })
  it('RIR 0 no topo → mantém carga', () => {
    const h = [set('2026-11-03', 1, 'zercher', 0, 'top', 100, 5, 0)]
    expect(suggest({ ...base, item: zercher, exercise: EXERCISE_BY_ID.zercher, history: h }).kg).toBe(100)
  })
  it('não bateu reps → mantém carga', () => {
    const h = [set('2026-11-03', 1, 'zercher', 0, 'top', 100, 4, 2)]
    expect(suggest({ ...base, item: zercher, exercise: EXERCISE_BY_ID.zercher, history: h }).kg).toBe(100)
  })
  it('ignora séries de hoje e de deload', () => {
    const h = [
      set('2026-11-03', 1, 'zercher', 0, 'top', 100, 5, 1),
      set('2026-11-06', 2, 'zercher', 0, 'top', 90, 5, 3, true),
      set('2026-11-10', 3, 'zercher', 0, 'top', 120, 1, 0),
    ]
    expect(suggest({ ...base, item: zercher, exercise: EXERCISE_BY_ID.zercher, history: h }).kg).toBe(105)
  })
})

describe('moderado', () => {
  it('75% do último top set de zercher', () => {
    const ref = [set('2026-11-09', 1, 'zercher', 0, 'top', 100, 5, 1), set('2026-11-09', 1, 'zercher', 1, 'backoff', 90, 5, 2)]
    const s = suggest({ ...base, item: item('zercher-moderado'), exercise: EXERCISE_BY_ID['zercher-moderado'], history: [], refHistory: ref, refName: 'Zercher' })
    expect(s.kg).toBe(75)
  })
  it('sem referência', () => {
    const s = suggest({ ...base, item: item('stiff-leve'), exercise: EXERCISE_BY_ID['stiff-leve'], history: [], refHistory: [] })
    expect(s.kg).toBeUndefined()
  })
})

describe('dupla progressão', () => {
  const rosca = item('rosca-inclinada') // 3×8–12, halter
  it('topo em todas as séries → aumenta (+2 kg halter)', () => {
    const h = [0, 1, 2].map((i) => set('2026-11-04', 1, 'rosca-inclinada', i, 'work', 12, 12, 0))
    expect(suggest({ ...base, item: rosca, exercise: EXERCISE_BY_ID['rosca-inclinada'], history: h }).kg).toBe(14)
  })
  it('falhou em uma série → mesma carga', () => {
    const h = [12, 12, 10].map((r, i) => set('2026-11-04', 1, 'rosca-inclinada', i, 'work', 12, r, 0))
    const s = suggest({ ...base, item: rosca, exercise: EXERCISE_BY_ID['rosca-inclinada'], history: h })
    expect(s.kg).toBe(12)
    expect(s.up).toBeFalsy()
  })
  it('séries incompletas não contam como topo', () => {
    const h = [12, 12].map((r, i) => set('2026-11-04', 1, 'rosca-inclinada', i, 'work', 12, r, 0))
    expect(suggest({ ...base, item: rosca, exercise: EXERCISE_BY_ID['rosca-inclinada'], history: h }).kg).toBe(12)
  })
})

describe('deload', () => {
  const name = (x: string) => x
  it('metade das séries', () => {
    expect(effectiveSets(item('zercher'), true)).toEqual({ sets: 1, backoffSets: 2 })
    expect(effectiveSets(item('rosca-inclinada'), true)).toEqual({ sets: 2, backoffSets: 0 })
  })
  it('top set caiu 2 sessões seguidas', () => {
    const h = [
      set('2026-10-20', 1, 'zercher', 0, 'top', 110, 5),
      set('2026-10-27', 2, 'zercher', 0, 'top', 107.5, 4),
      set('2026-11-03', 3, 'zercher', 0, 'top', 105, 3),
    ]
    expect(deloadReasons({ plan: SEED_PLAN, allSets: h, settings: DEFAULT_SETTINGS, today: '2026-11-10', exerciseName: name })).toHaveLength(1)
  })
  it('7 semanas sem deload', () => {
    const h = [set('2026-09-15', 1, 'rosca-inclinada', 0, 'work', 10, 10)]
    const r = deloadReasons({ plan: SEED_PLAN, allSets: h, settings: DEFAULT_SETTINGS, today: '2026-11-10', exerciseName: name })
    expect(r[0]).toMatch(/8 semanas/)
  })
  it('deload ativo suprime o aviso', () => {
    const h = [set('2026-09-15', 1, 'rosca-inclinada', 0, 'work', 10, 10)]
    const settings = { ...DEFAULT_SETTINGS, deloadStart: '2026-11-08', deloadUntil: '2026-11-14' }
    expect(deloadReasons({ plan: SEED_PLAN, allSets: h, settings, today: '2026-11-10', exerciseName: name })).toEqual([])
  })
})
