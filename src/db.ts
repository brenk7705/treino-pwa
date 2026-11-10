import Dexie, { type EntityTable } from 'dexie'
import { EXERCISES } from './data/exerciseMap'
import { SEED_PLAN } from './data/seedPlan'
import { DEFAULT_SETTINGS, type Exercise, type PlanDay, type Session, type SetLog, type Settings } from './types'

interface KV {
  key: string
  value: unknown
}

export class TreinoDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  plan!: EntityTable<PlanDay, 'day'>
  sessions!: EntityTable<Session, 'id'>
  sets!: EntityTable<SetLog, 'id'>
  kv!: EntityTable<KV, 'key'>

  constructor() {
    super('treino')
    this.version(1).stores({
      exercises: 'id',
      plan: 'day',
      sessions: '++id, date, day',
      sets: '++id, sessionId, exerciseId, date, [exerciseId+date]',
      kv: 'key',
    })
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(EXERCISES)
      tx.table('plan').bulkAdd(SEED_PLAN)
      tx.table('kv').add({ key: 'settings', value: DEFAULT_SETTINGS })
    })
  }
}

export const db = new TreinoDB()

// ---------- datas ----------
export function isoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(s: string, n: number): string {
  const d = parseIso(s)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}
/** segunda-feira da semana de `s` */
export function weekStart(s: string): string {
  const d = parseIso(s)
  const dow = (d.getDay() + 6) % 7 // seg=0
  return addDays(s, -dow)
}

// ---------- settings ----------
export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings')
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) }
}
export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings()
  await db.kv.put({ key: 'settings', value: { ...cur, ...patch } })
}

export function isDeloadActive(s: Settings, today: string): boolean {
  return !!s.deloadUntil && today <= s.deloadUntil && !!s.deloadStart && today >= s.deloadStart
}

// ---------- sessões / séries ----------
export async function getOrCreateSession(date: string, day: number, deload: boolean): Promise<number> {
  const existing = await db.sessions.where('date').equals(date).filter((s) => s.day === day).first()
  if (existing?.id) return existing.id
  return (await db.sessions.add({ date, day, deload, startedAt: Date.now() })) as number
}

export async function logSet(params: Omit<SetLog, 'id' | 'sessionId' | 'doneAt' | 'date'> & { date: string; day: number; deload: boolean }) {
  const { day, date, ...rest } = params
  const sessionId = await getOrCreateSession(date, day, params.deload)
  // substitui a série se já existir (edição)
  const prev = await db.sets
    .where('sessionId')
    .equals(sessionId)
    .filter((s) => s.planItemId === rest.planItemId && s.idx === rest.idx)
    .first()
  const row: SetLog = { ...rest, sessionId, date, doneAt: Date.now() }
  if (prev?.id) {
    await db.sets.update(prev.id, row)
    return prev.id
  }
  return db.sets.add(row)
}

export async function deleteSet(id: number) {
  const s = await db.sets.get(id)
  await db.sets.delete(id)
  if (s) {
    const left = await db.sets.where('sessionId').equals(s.sessionId).count()
    if (left === 0) await db.sessions.delete(s.sessionId)
  }
}

// ---------- backup ----------
export interface Backup {
  app: 'treino-pwa'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  plan: PlanDay[]
  sessions: Session[]
  sets: SetLog[]
  kv: KV[]
}

export async function exportBackup(): Promise<Backup> {
  const [exercises, plan, sessions, sets, kv] = await Promise.all([
    db.exercises.toArray(),
    db.plan.toArray(),
    db.sessions.toArray(),
    db.sets.toArray(),
    db.kv.toArray(),
  ])
  return { app: 'treino-pwa', version: 1, exportedAt: new Date().toISOString(), exercises, plan, sessions, sets, kv }
}

export async function importBackup(data: Backup) {
  if (data?.app !== 'treino-pwa' || !Array.isArray(data.sets)) throw new Error('Arquivo não é um backup deste app.')
  await db.transaction('rw', [db.exercises, db.plan, db.sessions, db.sets, db.kv], async () => {
    await Promise.all([db.exercises.clear(), db.plan.clear(), db.sessions.clear(), db.sets.clear(), db.kv.clear()])
    await db.exercises.bulkAdd(data.exercises)
    await db.plan.bulkAdd(data.plan)
    await db.sessions.bulkAdd(data.sessions)
    await db.sets.bulkAdd(data.sets)
    await db.kv.bulkAdd(data.kv)
  })
}

export async function resetPlan() {
  await db.transaction('rw', [db.plan, db.exercises], async () => {
    await db.plan.clear()
    await db.plan.bulkAdd(SEED_PLAN)
    await db.exercises.bulkPut(EXERCISES)
  })
}
