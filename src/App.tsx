import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from './db'
import { useRoute } from './router'
import { useTimerWatcher } from './timer'
import BottomNav from './components/BottomNav'
import TimerBar from './components/TimerBar'
import Hoje from './screens/Hoje'
import Exercicio from './screens/Exercicio'
import Semana from './screens/Semana'
import Historico from './screens/Historico'
import Ajustes from './screens/Ajustes'

export default function App() {
  const route = useRoute()
  const settings = useLiveQuery(getSettings)
  useTimerWatcher(settings?.soundOn ?? true)

  const [r0, r1, r2] = route
  let screen
  let tab = 'hoje'
  if (r0 === 'ex' && r1 && r2) {
    screen = <Exercicio key={`${r1}/${r2}`} day={Number(r1)} itemId={r2} />
  } else if (r0 === 'semana') {
    screen = <Semana />
    tab = 'semana'
  } else if (r0 === 'historico') {
    screen = <Historico exerciseId={r1} />
    tab = 'historico'
  } else if (r0 === 'ajustes') {
    screen = <Ajustes />
    tab = 'ajustes'
  } else {
    screen = <Hoje day={r0 === 'dia' && r1 ? Number(r1) : new Date().getDay()} />
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className={`flex-1 ${r0 === 'ex' ? 'pb-80' : 'pb-44'}`}>{screen}</main>
      {r0 !== 'ex' && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl">
          <TimerBar />
          <BottomNav tab={tab} />
        </div>
      )}
    </div>
  )
}
