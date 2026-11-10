import type { ReactNode } from 'react'
import { TYPE_LABEL, type ItemType, type PlanItem } from '../types'

const TYPE_CLS: Record<ItemType, string> = {
  principal: 'bg-accent text-accent-ink',
  moderado: 'bg-warn/20 text-warn',
  acessorio: 'bg-info/15 text-info',
  isolado: 'bg-line text-mute',
}

export function TypeBadge({ type }: { type: ItemType }) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${TYPE_CLS[type]}`}>{TYPE_LABEL[type]}</span>
}

export function prescription(item: PlanItem, sets = item.sets, backoffSets = item.backoffSets ?? 0): string {
  if (item.type === 'principal') return `1×${item.repMin}–${item.repMax} top + ${backoffSets}×${item.backoffReps} back-off`
  const reps = item.repMin === item.repMax ? `${item.repMin}` : `${item.repMin}–${item.repMax}`
  return `${sets}×${reps}`
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-wider text-mute uppercase">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function BigButton({ children, onClick, kind = 'accent', className = '', disabled }: { children: ReactNode; onClick?: () => void; kind?: 'accent' | 'plain' | 'danger' | 'info'; className?: string; disabled?: boolean }) {
  const k = {
    accent: 'bg-accent text-accent-ink',
    plain: 'bg-card2 text-ink border border-line',
    danger: 'bg-danger/15 text-danger border border-danger/40',
    info: 'bg-info text-bg',
  }[kind]
  return (
    <button disabled={disabled} onClick={onClick} className={`min-h-14 rounded-2xl px-5 text-lg font-extrabold active:scale-[.98] disabled:opacity-40 ${k} ${className}`}>
      {children}
    </button>
  )
}

export function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
