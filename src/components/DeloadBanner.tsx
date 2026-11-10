import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, db, getSettings, isDeloadActive, isoDate, saveSettings } from '../db'
import { deloadReasons } from '../logic/progression'

export async function startDeload() {
  const today = isoDate()
  await saveSettings({ deloadStart: today, deloadUntil: addDays(today, 6), deloadDismissed: undefined })
}
export async function endDeload() {
  await saveSettings({ deloadUntil: addDays(isoDate(), -1) })
}

const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

export default function DeloadBanner() {
  const today = isoDate()
  const data = useLiveQuery(async () => {
    const [settings, plan, allSets, exercises] = await Promise.all([getSettings(), db.plan.toArray(), db.sets.toArray(), db.exercises.toArray()])
    const name = (id: string) => exercises.find((e) => e.id === id)?.name ?? id
    return { settings, reasons: deloadReasons({ plan, allSets, settings, today, exerciseName: name }) }
  }, [today])
  if (!data) return null
  const { settings, reasons } = data

  if (isDeloadActive(settings, today)) {
    return (
      <div className="mt-4 rounded-2xl border border-warn/40 bg-warn/10 p-4">
        <div className="text-lg font-extrabold text-warn">Semana de deload até {dm(settings.deloadUntil!)}</div>
        <p className="mt-1 text-sm text-ink/80">Metade das séries e −10% de carga já aplicados nas sugestões.</p>
        <button onClick={endDeload} className="mt-3 h-12 rounded-xl border border-warn/40 px-4 font-bold text-warn">Encerrar deload</button>
      </div>
    )
  }
  if (!reasons.length) return null
  return (
    <div className="mt-4 rounded-2xl border border-warn/40 bg-warn/10 p-4">
      <div className="text-lg font-extrabold text-warn">Sugestão: semana de deload</div>
      <ul className="mt-1 list-disc pl-5 text-sm text-ink/85">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-1 text-sm text-mute">Deload = metade das séries, −10% de carga, por 7 dias.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={startDeload} className="h-12 flex-1 rounded-xl bg-warn font-extrabold text-bg">Iniciar deload</button>
        <button onClick={() => saveSettings({ deloadDismissed: today })} className="h-12 flex-1 rounded-xl border border-line font-bold">Agora não</button>
      </div>
    </div>
  )
}
