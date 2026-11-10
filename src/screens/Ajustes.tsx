import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, exportBackup, getSettings, importBackup, isDeloadActive, isoDate, resetPlan, saveSettings, type Backup } from '../db'
import { alarm, unlockAudio } from '../timer'
import { DAY_SHORT, TYPE_LABEL, type Exercise, type ItemType, type PlanDay, type PlanItem, type Settings } from '../types'
import type { Equipment } from '../data/exerciseMap'
import { BigButton, Section } from '../components/ui'
import { endDeload, startDeload } from '../components/DeloadBanner'

const EQUIP: { id: Equipment; label: string }[] = [
  { id: 'barra', label: 'Barra' },
  { id: 'halter', label: 'Halter' },
  { id: 'cabo', label: 'Cabo/polia' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'corpo', label: 'Peso corporal (carga extra)' },
  { id: 'anilha', label: 'Anilha' },
]
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function Ajustes() {
  const settings = useLiveQuery(getSettings)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  if (!settings) return null
  const today = isoDate()

  async function doExport() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `treino-backup-${today}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    setMsg(`Backup exportado: ${data.sets.length} séries, ${data.sessions.length} sessões.`)
  }

  async function doImport(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Backup
      if (!confirm(`Importar backup de ${data.exportedAt?.slice(0, 10) ?? '?'} com ${data.sets?.length ?? 0} séries?\n\nIsso SUBSTITUI todos os dados atuais.`)) return
      await importBackup(data)
      setMsg('Backup importado com sucesso.')
    } catch (e) {
      setMsg(`Erro ao importar: ${(e as Error).message}`)
    }
  }

  const setNum = (patch: (v: number) => Partial<Settings>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value.replace(',', '.'))
    if (Number.isFinite(v) && v >= 0) void saveSettings(patch(v))
  }

  return (
    <div className="px-4 pt-safe">
      <h1 className="pt-5 text-[28px] font-black">Ajustes</h1>

      <Section title="Backup">
        <div className="grid grid-cols-2 gap-2">
          <BigButton onClick={doExport}>Exportar JSON</BigButton>
          <BigButton kind="plain" onClick={() => fileRef.current?.click()}>Importar JSON</BigButton>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = '' }} />
        {msg && <p className="mt-2 rounded-xl bg-card p-3 text-sm">{msg}</p>}
        <p className="mt-2 px-1 text-sm text-mute">Os dados ficam só neste aparelho. Exporte um backup de vez em quando e guarde no Drive/iCloud.</p>
      </Section>

      <Section title="Carga e progressão">
        <div className="rounded-2xl bg-card p-3">
          <div className="grid grid-cols-[1fr_84px_84px] items-center gap-2 text-xs font-bold tracking-wider text-mute uppercase">
            <span>Equipamento</span>
            <span className="text-center">Arredondar</span>
            <span className="text-center">Incremento</span>
          </div>
          {EQUIP.map((eq) => (
            <div key={eq.id} className="mt-2 grid grid-cols-[1fr_84px_84px] items-center gap-2">
              <span className="font-semibold">{eq.label}</span>
              <Field defaultValue={settings.rounding[eq.id]} onChange={setNum((v) => ({ rounding: { ...settings.rounding, [eq.id]: v } }))} />
              <Field defaultValue={settings.increment[eq.id]} onChange={setNum((v) => ({ increment: { ...settings.increment, [eq.id]: v } }))} />
            </div>
          ))}
          <p className="mt-2 text-xs text-mute">Incremento = quanto subir na dupla progressão (acessórios/isolados).</p>
          <hr className="my-3 border-line" />
          <Labeled label="Principal — membros superiores (+kg)"><Field defaultValue={settings.incPrincipalUpper} onChange={setNum((v) => ({ incPrincipalUpper: v }))} /></Labeled>
          <Labeled label="Principal — zercher / stiff (+kg)"><Field defaultValue={settings.incPrincipalLower} onChange={setNum((v) => ({ incPrincipalLower: v }))} /></Labeled>
          <Labeled label="Back-off (% do top set)"><Field defaultValue={Math.round(settings.backoffPct * 100)} onChange={setNum((v) => ({ backoffPct: v / 100 }))} /></Labeled>
        </div>
      </Section>

      <Section title="Cronômetro">
        <div className="flex items-center gap-2 rounded-2xl bg-card p-3">
          <label className="flex flex-1 items-center gap-3 text-lg font-semibold">
            <input type="checkbox" className="h-7 w-7 accent-[var(--color-accent)]" checked={settings.soundOn} onChange={(e) => saveSettings({ soundOn: e.target.checked })} />
            Som no fim do descanso
          </label>
          <button onClick={() => { unlockAudio(); alarm(settings.soundOn) }} className="h-12 rounded-xl border border-line px-4 font-bold">Testar</button>
        </div>
        <p className="mt-2 px-1 text-sm text-mute">Vibração funciona no Android. No iPhone, o som só toca com o app aberto.</p>
      </Section>

      <Section title="Deload">
        <div className="rounded-2xl bg-card p-3">
          {isDeloadActive(settings, today) ? (
            <>
              <p>Deload ativo até {settings.deloadUntil?.split('-').reverse().join('/')}.</p>
              <BigButton kind="plain" className="mt-2 w-full" onClick={endDeload}>Encerrar deload</BigButton>
            </>
          ) : (
            <>
              <p className="text-mute">Último deload: {settings.deloadStart ? settings.deloadStart.split('-').reverse().join('/') : 'nunca'}</p>
              <BigButton kind="plain" className="mt-2 w-full" onClick={startDeload}>Iniciar semana de deload agora</BigButton>
            </>
          )}
        </div>
      </Section>

      <PlanEditor />

      <p className="mt-8 px-1 text-xs text-mute">
        Imagens: free-exercise-db (domínio público, github.com/yuhonas/free-exercise-db). Dados salvos localmente (IndexedDB).
      </p>
    </div>
  )
}

function Field({ defaultValue, onChange }: { defaultValue: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <input type="text" inputMode="decimal" defaultValue={String(defaultValue).replace('.', ',')} onChange={onChange} className="num h-12 w-full rounded-xl border border-line bg-card2 text-center text-lg font-bold focus:border-accent focus:outline-none" />
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 grid grid-cols-[1fr_84px] items-center gap-2">
      <span className="font-semibold">{label}</span>
      {children}
    </div>
  )
}

// ---------------- editor do plano ----------------
function PlanEditor() {
  const [day, setDay] = useState(new Date().getDay())
  const plan = useLiveQuery(() => db.plan.get(day), [day])
  const exercises = useLiveQuery(() => db.exercises.orderBy('id').toArray())
  const [adding, setAdding] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', equipment: 'halter' as Equipment })
  if (!exercises) return null
  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name))

  const save = (p: PlanDay) => db.plan.put(p)
  const updateItem = (id: string, patch: Partial<PlanItem>) => plan && save({ ...plan, items: plan.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const move = (idx: number, dir: -1 | 1) => {
    if (!plan) return
    const items = [...plan.items]
    const j = idx + dir
    if (j < 0 || j >= items.length) return
    ;[items[idx], items[j]] = [items[j], items[idx]]
    void save({ ...plan, items })
  }
  const remove = (id: string) => plan && confirm('Remover este exercício do dia? (o histórico continua salvo)') && save({ ...plan, items: plan.items.filter((i) => i.id !== id) })
  const add = (exerciseId: string) => {
    const base: PlanDay = plan ?? { day, code: DAY_SHORT[day].toUpperCase(), title: 'Treino', items: [] }
    const item: PlanItem = { id: `u${Date.now().toString(36)}`, exerciseId, type: 'isolado', sets: 3, repMin: 8, repMax: 12, rir: '1', restSec: 90, restLabel: '90 s' }
    void save({ ...base, items: [...base.items, item] })
    setAdding(false)
  }
  const createExercise = async () => {
    const name = newEx.name.trim()
    if (!name) return
    const id = 'c-' + name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const ex: Exercise = { id, name, fedbId: null, svg: 'generico', equipment: newEx.equipment, muscles: [], tips: ['Controle a descida.', 'Amplitude completa.', 'Mantenha a postura estável.'] }
    await db.exercises.put(ex)
    add(id)
    setNewEx({ name: '', equipment: 'halter' })
  }

  return (
    <Section title="Editar plano">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_ORDER.map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`h-12 rounded-xl font-bold ${d === day ? 'bg-ink text-bg' : 'bg-card text-mute'}`}>{DAY_SHORT[d]}</button>
        ))}
      </div>
      {plan && (
        <div className="mt-3 grid grid-cols-[90px_1fr] gap-2">
          <input defaultValue={plan.code} key={`c${day}`} onBlur={(e) => save({ ...plan, code: e.target.value })} className="h-12 rounded-xl border border-line bg-card2 px-3 font-bold" aria-label="Código do treino" />
          <input defaultValue={plan.title} key={`t${day}`} onBlur={(e) => save({ ...plan, title: e.target.value })} className="h-12 rounded-xl border border-line bg-card2 px-3 font-bold" aria-label="Nome do treino" />
        </div>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {plan?.items.map((it, idx) => (
          <div key={it.id} className="rounded-2xl bg-card p-3">
            <div className="flex gap-2">
              <select value={it.exerciseId} onChange={(e) => updateItem(it.id, { exerciseId: e.target.value })} className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-card2 px-2 font-bold" aria-label="Trocar exercício">
                {sorted.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button onClick={() => move(idx, -1)} className="h-12 w-11 rounded-xl bg-card2 text-lg" aria-label="Subir">↑</button>
              <button onClick={() => move(idx, 1)} className="h-12 w-11 rounded-xl bg-card2 text-lg" aria-label="Descer">↓</button>
              <button onClick={() => remove(it.id)} className="h-12 w-11 rounded-xl bg-danger/15 text-lg text-danger" aria-label="Remover">✕</button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <Mini label="Tipo">
                <select value={it.type} onChange={(e) => updateItem(it.id, { type: e.target.value as ItemType, ...(e.target.value === 'principal' && !it.backoffSets ? { sets: 1, backoffSets: 3, backoffReps: it.repMin } : {}) })} className="h-11 w-full rounded-lg border border-line bg-card2 px-1 text-sm font-bold">
                  {(Object.keys(TYPE_LABEL) as ItemType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </Mini>
              {it.type === 'principal' ? (
                <Mini label="Back-offs"><NumF v={it.backoffSets ?? 3} on={(v) => updateItem(it.id, { backoffSets: v })} /></Mini>
              ) : (
                <Mini label="Séries"><NumF v={it.sets} on={(v) => updateItem(it.id, { sets: v })} /></Mini>
              )}
              <Mini label="Reps mín"><NumF v={it.repMin} on={(v) => updateItem(it.id, { repMin: v })} /></Mini>
              <Mini label="Reps máx"><NumF v={it.repMax} on={(v) => updateItem(it.id, { repMax: v })} /></Mini>
              {it.type === 'principal' && <Mini label="Reps B-O"><NumF v={it.backoffReps ?? it.repMin} on={(v) => updateItem(it.id, { backoffReps: v })} /></Mini>}
              <Mini label="RIR">
                <input defaultValue={it.rir} onBlur={(e) => updateItem(it.id, { rir: e.target.value })} className="h-11 w-full rounded-lg border border-line bg-card2 text-center font-bold" />
              </Mini>
              <Mini label="Desc. (s)"><NumF v={it.restSec} on={(v) => updateItem(it.id, { restSec: v, restLabel: v >= 120 ? `${Math.round((v / 60) * 10) / 10} min`.replace('.', ',') : `${v} s` })} /></Mini>
              {it.type === 'moderado' && (
                <Mini label="% ref.">
                  <NumF v={Math.round((it.refPct ?? 0.7) * 100)} on={(v) => updateItem(it.id, { refPct: v / 100 })} />
                </Mini>
              )}
            </div>
            {it.type === 'moderado' && (
              <select value={it.refExerciseId ?? ''} onChange={(e) => updateItem(it.id, { refExerciseId: e.target.value })} className="mt-2 h-11 w-full rounded-lg border border-line bg-card2 px-2 text-sm" aria-label="Exercício de referência">
                <option value="">Referência…</option>
                {sorted.map((e) => <option key={e.id} value={e.id}>% de: {e.name}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 rounded-2xl border border-line bg-card p-3">
          <select onChange={(e) => e.target.value && add(e.target.value)} defaultValue="" className="h-12 w-full rounded-xl border border-line bg-card2 px-2 font-bold" aria-label="Adicionar exercício do catálogo">
            <option value="">Escolher do catálogo…</option>
            {sorted.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <div className="mt-3 text-sm font-bold text-mute">…ou criar um novo</div>
          <input value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} placeholder="Nome do exercício" className="mt-1 h-12 w-full rounded-xl border border-line bg-card2 px-3" />
          <select value={newEx.equipment} onChange={(e) => setNewEx({ ...newEx, equipment: e.target.value as Equipment })} className="mt-2 h-12 w-full rounded-xl border border-line bg-card2 px-2">
            {EQUIP.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <BigButton onClick={createExercise}>Criar e adicionar</BigButton>
            <BigButton kind="plain" onClick={() => setAdding(false)}>Cancelar</BigButton>
          </div>
        </div>
      ) : (
        <BigButton kind="plain" className="mt-3 w-full" onClick={() => setAdding(true)}>+ Adicionar exercício</BigButton>
      )}
      <BigButton kind="danger" className="mt-6 w-full" onClick={() => confirm('Restaurar o plano original? Suas edições no plano serão perdidas (o histórico continua).') && resetPlan()}>
        Restaurar plano original
      </BigButton>
    </Section>
  )
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold tracking-wide text-mute uppercase">{label}</span>
      {children}
    </label>
  )
}
function NumF({ v, on }: { v: number; on: (v: number) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      defaultValue={v}
      key={v}
      onBlur={(e) => {
        const n = parseInt(e.target.value, 10)
        if (Number.isFinite(n) && n >= 0 && n !== v) on(n)
      }}
      className="num h-11 w-full rounded-lg border border-line bg-card2 text-center font-bold"
    />
  )
}
