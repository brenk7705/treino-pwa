// Boneco (stick figure) em SVG animado com CSS.
// Cada figura é descrita por "ossos" com ângulo absoluto (graus; 0 = direita, 90 = baixo)
// na pose A e na pose B. A cinemática é calculada aqui e vira @keyframes CSS
// (translate + rotate por osso), então a animação roda 100% em CSS, sem JS por frame.
import { useMemo, type ReactNode } from 'react'
import type { SvgAnim } from '../data/exerciseMap'

type P = [number, number]
interface Bone {
  id: string
  parent?: string
  root?: [P, P] // origem nas poses A/B (só ossos raiz)
  len: number
  a: [number, number]
  back?: boolean // membro do lado de lá (mais apagado)
}
type AttachKind = 'head' | 'dumbbell' | 'handle'
interface Attach {
  kind: AttachKind
  bone: string
}
interface Spec {
  bones: Bone[]
  attach: Attach[]
  cable?: { from: P; bone: string }
  props: ReactNode
  period: number
}

const STEPS = 24
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** ciclo A → B → A com pausas curtas nas pontas */
function phase(p: number): number {
  const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2
  if (p < 0.08) return 0
  if (p < 0.46) return ease((p - 0.08) / 0.38)
  if (p < 0.58) return 1
  return 1 - ease((p - 0.58) / 0.42)
}

function solve(spec: Spec, t: number) {
  const out: Record<string, { s: P; e: P; ang: number }> = {}
  for (const b of spec.bones) {
    const ang = lerp(b.a[0], b.a[1], t)
    const s: P = b.parent ? out[b.parent].e : [lerp(b.root![0][0], b.root![1][0], t), lerp(b.root![0][1], b.root![1][1], t)]
    const rad = (ang * Math.PI) / 180
    out[b.id] = { s, e: [s[0] + Math.cos(rad) * b.len, s[1] + Math.sin(rad) * b.len], ang }
  }
  return out
}

const f = (n: number) => Math.round(n * 100) / 100

function buildCss(name: string, spec: Spec) {
  const frames = Array.from({ length: STEPS + 1 }, (_, k) => {
    const p = k / STEPS
    return { pct: f(p * 100), pose: solve(spec, phase(p)) }
  })
  let css = ''
  const anim = (id: string, fn: (pose: ReturnType<typeof solve>) => string) => {
    css += `@keyframes ${name}-${id}{${frames.map((fr) => `${fr.pct}%{transform:${fn(fr.pose)}}`).join('')}}`
    css += `.${name}-${id}{transform-box:view-box;transform-origin:0 0;animation:${name}-${id} ${spec.period}s linear infinite}`
  }
  for (const b of spec.bones) anim(b.id, (pose) => `translate(${f(pose[b.id].s[0])}px,${f(pose[b.id].s[1])}px) rotate(${f(pose[b.id].ang)}deg)`)
  spec.attach.forEach((a, i) => anim(`at${i}`, (pose) => `translate(${f(pose[a.bone].e[0])}px,${f(pose[a.bone].e[1])}px)`))
  if (spec.cable) {
    const { from, bone } = spec.cable
    anim('cable', (pose) => {
      const [x, y] = pose[bone].e
      const dx = x - from[0]
      const dy = y - from[1]
      return `translate(${from[0]}px,${from[1]}px) rotate(${f((Math.atan2(dy, dx) * 180) / Math.PI)}deg) scaleX(${f(Math.hypot(dx, dy))})`
    })
  }
  return css
}

// ---------- equipamentos ----------
const EQ = 'var(--color-mute)'
const Floor = () => <line x1="0" y1="130" x2="200" y2="130" stroke="var(--color-line)" strokeWidth="2" />
const Bench = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <g fill={EQ}>
    <rect x={x1} y={y} width={x2 - x1} height="7" rx="3" />
    <rect x={x1 + 8} y={y + 7} width="4" height={130 - y - 7} />
    <rect x={x2 - 12} y={y + 7} width="4" height={130 - y - 7} />
  </g>
)

const SPECS: Record<Exclude<SvgAnim, 'generico'> | 'generico', Spec> = {
  'dragon-flag': {
    period: 3.2,
    props: (
      <>
        <Floor />
        <Bench x1={22} x2={150} y={98} />
      </>
    ),
    bones: [
      { id: 'torso', root: [[52, 92], [52, 92]], len: 34, a: [-72, -6] },
      { id: 'thigh', parent: 'torso', len: 28, a: [-72, -6] },
      { id: 'shin', parent: 'thigh', len: 28, a: [-72, -6] },
      { id: 'foot', parent: 'shin', len: 7, a: [18, 84] },
      { id: 'neck', root: [[52, 92], [52, 92]], len: 12, a: [-162, -162] },
      { id: 'uarm', root: [[52, 92], [52, 92]], len: 16, a: [-140, -140] },
      { id: 'farm', parent: 'uarm', len: 19, a: [112, 112] },
    ],
    attach: [{ kind: 'head', bone: 'neck' }],
  },
  'puxada-diagonal': {
    period: 2.6,
    props: (
      <>
        <Floor />
        <rect x="160" y="8" width="10" height="122" rx="2" fill={EQ} />
        <rect x="140" y="12" width="26" height="5" rx="2" fill={EQ} />
        <circle cx="146" cy="20" r="5" fill="none" stroke={EQ} strokeWidth="3" />
        <rect x="152" y="96" width="16" height="22" rx="2" fill="var(--color-line)" />
      </>
    ),
    bones: [
      { id: 'shin', root: [[88, 127], [88, 127]], len: 28, a: [180, 180] },
      { id: 'thigh', root: [[88, 127], [88, 127]], len: 30, a: [-90, -90] },
      { id: 'torso', parent: 'thigh', len: 38, a: [-82, -95] },
      { id: 'neck', parent: 'torso', len: 10, a: [-82, -95] },
      { id: 'ua2', parent: 'torso', len: 18, a: [100, 100], back: true },
      { id: 'fa2', parent: 'ua2', len: 18, a: [20, 20], back: true },
      { id: 'uarm', parent: 'torso', len: 20, a: [-52, 100] },
      { id: 'farm', parent: 'uarm', len: 20, a: [-48, -62] },
    ],
    attach: [
      { kind: 'head', bone: 'neck' },
      { kind: 'handle', bone: 'farm' },
    ],
    cable: { from: [146, 25], bone: 'farm' },
  },
  'remada-arco': {
    period: 2.6,
    props: (
      <>
        <Floor />
        <Bench x1={50} x2={116} y={88} />
      </>
    ),
    bones: [
      { id: 'thighK', root: [[96, 86], [96, 86]], len: 26, a: [-80, -80] },
      { id: 'torso', parent: 'thighK', len: 40, a: [185, 185] },
      { id: 'neck', parent: 'torso', len: 10, a: [192, 192] },
      { id: 'sup', parent: 'torso', len: 31, a: [95, 95], back: true },
      { id: 'thighS', parent: 'thighK', len: 28, a: [75, 75] },
      { id: 'shinS', parent: 'thighS', len: 42, a: [100, 100] },
      { id: 'shinK', root: [[96, 86], [96, 86]], len: 26, a: [0, 0], back: true },
      { id: 'uarm', parent: 'torso', len: 20, a: [125, -12] },
      { id: 'farm', parent: 'uarm', len: 20, a: [122, 82] },
    ],
    attach: [
      { kind: 'head', bone: 'neck' },
      { kind: 'dumbbell', bone: 'farm' },
    ],
  },
  generico: {
    period: 2.2,
    props: <Floor />,
    bones: [
      { id: 'legL', root: [[100, 82], [100, 82]], len: 48, a: [97, 97] },
      { id: 'legR', root: [[100, 82], [100, 82]], len: 48, a: [83, 83], back: true },
      { id: 'torso', root: [[100, 82], [100, 82]], len: 40, a: [-90, -90] },
      { id: 'neck', parent: 'torso', len: 10, a: [-90, -90] },
      { id: 'uarm', parent: 'torso', len: 20, a: [95, 95] },
      { id: 'farm', parent: 'uarm', len: 20, a: [90, -70] },
    ],
    attach: [
      { kind: 'head', bone: 'neck' },
      { kind: 'dumbbell', bone: 'farm' },
    ],
  },
}

function AttachShape({ kind }: { kind: AttachKind }) {
  if (kind === 'head') return <circle r="7.5" fill="var(--color-ink)" />
  if (kind === 'handle') return <rect x="-6" y="-2" width="12" height="4" rx="2" fill={EQ} />
  return (
    <g fill={EQ}>
      <rect x="-9" y="-1.5" width="18" height="3" />
      <rect x="-11" y="-5" width="5" height="10" rx="1.5" />
      <rect x="6" y="-5" width="5" height="10" rx="1.5" />
    </g>
  )
}

export default function StickFigure({ anim, className }: { anim: SvgAnim; className?: string }) {
  const spec = SPECS[anim] ?? SPECS.generico
  const name = `sf-${anim}`
  const css = useMemo(() => buildCss(name, spec), [name, spec])
  const backBones = spec.bones.filter((b) => b.back)
  const frontBones = spec.bones.filter((b) => !b.back)
  const line = (b: Bone, color: string) => (
    <line key={b.id} className={`${name}-${b.id}`} x1="0" y1="0" x2={b.len} y2="0" stroke={color} strokeWidth="6" strokeLinecap="round" />
  )
  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-label="Animação do exercício">
      <style>{css}</style>
      <rect width="200" height="140" fill="var(--color-card2)" />
      {spec.props}
      {spec.cable && <line className={`${name}-cable`} x1="0" y1="0" x2="1" y2="0" stroke="var(--color-info)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
      {backBones.map((b) => line(b, '#7d8796'))}
      {frontBones.map((b) => line(b, 'var(--color-ink)'))}
      {spec.attach.map((a, i) => (
        <g key={i} className={`${name}-at${i}`}>
          <AttachShape kind={a.kind} />
        </g>
      ))}
    </svg>
  )
}
