import { go } from '../router'

const TABS = [
  { id: 'hoje', label: 'Hoje', path: '', icon: 'M4 12h3l2-6 4 12 2-6h5' },
  { id: 'semana', label: 'Semana', path: 'semana', icon: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 3v6' },
  { id: 'historico', label: 'Histórico', path: 'historico', icon: 'M4 19l5-6 4 3 7-9M4 4v15h16' },
  { id: 'ajustes', label: 'Ajustes', path: 'ajustes', icon: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5v5M9 14.5v5' },
]

export default function BottomNav({ tab }: { tab: string }) {
  return (
    <nav className="grid grid-cols-4 border-t border-line bg-bg/95 backdrop-blur">
      {TABS.map((t) => {
        const on = t.id === tab
        return (
          <button
            key={t.id}
            onClick={() => go(t.path)}
            className={`flex h-[68px] flex-col items-center justify-center gap-1 text-[13px] font-semibold ${on ? 'text-accent' : 'text-mute'}`}
            aria-current={on ? 'page' : undefined}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
