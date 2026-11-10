import type { ExerciseDef } from './data/exerciseMap'

export type ItemType = 'principal' | 'moderado' | 'acessorio' | 'isolado'
export type SetKind = 'top' | 'backoff' | 'work'

export interface PlanItem {
  id: string
  exerciseId: string
  type: ItemType
  /** principal: faixa do top set; demais: faixa de todas as séries */
  sets: number
  repMin: number
  repMax: number
  /** só principal: séries de back-off (90% do top) */
  backoffSets?: number
  backoffReps?: number
  rir: string // rótulo exibido: "1/2", "0–1"…
  restSec: number
  restLabel: string
  /** moderado: % do último top set do exercício de referência */
  refExerciseId?: string
  refPct?: number
  supersetGroup?: string
  note?: string // "por lado", "+ parciais alongadas"…
  optional?: boolean
}

export interface PlanDay {
  day: number // 0=domingo … 6=sábado (Date.getDay)
  code: string
  title: string
  optional?: boolean
  items: PlanItem[]
}

export type Exercise = ExerciseDef

export interface Session {
  id?: number
  date: string // YYYY-MM-DD
  day: number
  deload?: boolean
  startedAt: number
}

export interface SetLog {
  id?: number
  sessionId: number
  date: string
  exerciseId: string
  planItemId: string
  idx: number
  kind: SetKind
  kg: number
  reps: number
  rir: number | null
  doneAt: number
  deload?: boolean
}

export interface Settings {
  rounding: Record<string, number> // por equipamento
  increment: Record<string, number> // dupla progressão, por equipamento
  incPrincipalUpper: number
  incPrincipalLower: number
  backoffPct: number
  deloadStart?: string // YYYY-MM-DD do início do último deload
  deloadUntil?: string // deload ativo até esta data (inclusive)
  deloadDismissed?: string // data em que o aviso foi dispensado
  soundOn: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  rounding: { barra: 2.5, halter: 1, cabo: 2.5, corpo: 1.25, anilha: 1.25, maquina: 2.5 },
  increment: { barra: 2.5, halter: 2, cabo: 2.5, corpo: 1.25, anilha: 1.25, maquina: 2.5 },
  incPrincipalUpper: 2.5,
  incPrincipalLower: 5,
  backoffPct: 0.9,
  soundOn: true,
}

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const TYPE_LABEL: Record<ItemType, string> = {
  principal: 'Principal',
  moderado: 'Moderado',
  acessorio: 'Acessório',
  isolado: 'Isolado',
}
