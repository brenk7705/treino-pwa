// Cronômetro de descanso global. Baseado em timestamp (endAt) e salvo no localStorage,
// então continua certo ao trocar de tela, minimizar o app ou recarregar.
import { useEffect, useSyncExternalStore } from 'react'

export interface TimerState {
  endAt: number | null // ms epoch
  total: number // s
  label: string
  finishedAt: number | null
}

const KEY = 'treino.timer'
const idle: TimerState = { endAt: null, total: 0, label: '', finishedAt: null }

function load(): TimerState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...idle, ...JSON.parse(raw) } : idle
  } catch {
    return idle
  }
}

let state: TimerState = load()
const listeners = new Set<() => void>()
function set(next: TimerState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* sem storage → só em memória */
  }
  listeners.forEach((l) => l())
}

export const timer = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  start(seconds: number, label: string) {
    unlockAudio()
    set({ endAt: Date.now() + seconds * 1000, total: seconds, label, finishedAt: null })
  },
  add(seconds: number) {
    if (!state.endAt) return
    const endAt = Math.max(Date.now() + 1000, state.endAt + seconds * 1000)
    set({ ...state, endAt, total: Math.max(1, state.total + seconds) })
  },
  skip() {
    set(idle)
  },
  finish() {
    set({ ...state, endAt: null, finishedAt: Date.now() })
  },
  dismiss() {
    set(idle)
  },
}

export function remainingSec(s: TimerState, now = Date.now()): number {
  return s.endAt ? Math.max(0, Math.ceil((s.endAt - now) / 1000)) : 0
}

export function useTimer(): TimerState {
  return useSyncExternalStore(timer.subscribe, timer.get, timer.get)
}

/** re-render a cada `ms` enquanto `active` */
export function useTick(active: boolean, ms = 250): number {
  const now = useSyncExternalStore(
    (cb) => {
      if (!active) return () => {}
      const h = setInterval(cb, ms)
      return () => clearInterval(h)
    },
    () => (active ? Math.floor(Date.now() / ms) : 0),
  )
  return now
}

// ---------- alarme (som + vibração) ----------
let ctx: AudioContext | null = null
export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* sem áudio */
  }
}

export function alarm(sound: boolean) {
  try {
    navigator.vibrate?.([400, 150, 400, 150, 700])
  } catch {
    /* sem vibração (iPhone) */
  }
  if (!sound || !ctx) return
  const t0 = ctx.currentTime
  ;[0, 0.35, 0.7].forEach((dt, i) => {
    const o = ctx!.createOscillator()
    const g = ctx!.createGain()
    o.type = 'square'
    o.frequency.value = i === 2 ? 1320 : 880
    g.gain.setValueAtTime(0.0001, t0 + dt)
    g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + (i === 2 ? 0.5 : 0.25))
    o.connect(g).connect(ctx!.destination)
    o.start(t0 + dt)
    o.stop(t0 + dt + 0.6)
  })
}

/** Watcher global: dispara o alarme quando o tempo acaba e mantém a tela acesa durante o descanso */
export function useTimerWatcher(soundOn: boolean) {
  const s = useTimer()
  const tick = useTick(!!s.endAt)
  useEffect(() => {
    if (s.endAt && Date.now() >= s.endAt) {
      // só toca se acabou há pouco (não ao reabrir o app horas depois)
      if (Date.now() - s.endAt < 60_000) alarm(soundOn)
      timer.finish()
    }
  }, [tick, s.endAt, soundOn])

  // Wake Lock: tela acesa enquanto o descanso corre
  useEffect(() => {
    if (!s.endAt || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock.request('screen').then((l) => (lock = l), () => {})
    return () => {
      void lock?.release()
    }
  }, [s.endAt])
}
