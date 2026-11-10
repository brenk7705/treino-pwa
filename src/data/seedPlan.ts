import type { ItemType, PlanDay, PlanItem } from '../types'

let n = 0
type Opt = Partial<PlanItem>
function it(exerciseId: string, type: ItemType, sets: number, repMin: number, repMax: number, rir: string, restSec: number, restLabel: string, opt: Opt = {}): PlanItem {
  n++
  return { id: `p${n}`, exerciseId, type, sets, repMin, repMax, rir, restSec, restLabel, ...opt }
}
const SS = 60 // superset: descanso após o par
const principal = (exerciseId: string, rMin: number, rMax: number, boReps: number, restSec: number, restLabel: string) =>
  it(exerciseId, 'principal', 1, rMin, rMax, '1/2', restSec, restLabel, { backoffSets: 3, backoffReps: boReps })

export const SEED_PLAN: PlanDay[] = [
  {
    day: 1, code: 'FB1', title: 'Força A', items: [
      principal('zercher', 3, 5, 5, 210, '3–4 min'),
      it('stiff-leve', 'moderado', 2, 6, 6, '3', 120, '2 min', { refExerciseId: 'stiff-pesado', refPct: 0.7, note: '70% do stiff de quarta' }),
      principal('desenv-militar', 4, 6, 6, 180, '3 min'),
      it('barra-fixa-carga', 'acessorio', 4, 5, 8, '1–2', 150, '2–3 min'),
      it('triceps-overhead', 'isolado', 3, 8, 12, '0–1', 90, '90 s'),
      it('elev-lateral', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('rosca-punho', 'isolado', 2, 12, 20, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('crunch-anilha', 'isolado', 2, 8, 15, '0–1', SS, 'superset', { supersetGroup: 'A' }),
    ],
  },
  {
    day: 2, code: 'FR1', title: 'Frame A', items: [
      it('rosca-inclinada', 'isolado', 3, 8, 12, '0–1', 90, '90 s'),
      it('rosca-martelo-cruzada', 'isolado', 2, 10, 15, '0–1', 60, '60 s'),
      it('elev-lateral-inclinada', 'isolado', 2, 12, 20, '0', 60, '60 s', { note: '+ parciais alongadas' }),
      it('puxada-diagonal', 'acessorio', 3, 8, 12, '0–1', 90, '90 s', { note: 'por lado' }),
      it('remada-apoiada', 'acessorio', 3, 8, 12, '1', 120, '2 min'),
      it('encolhimento-barra', 'isolado', 3, 8, 12, '0–1', 90, '90 s'),
      it('crucifixo-invertido', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('extensao-punho', 'isolado', 2, 12, 20, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('elev-pernas-barra', 'isolado', 2, 8, 15, '0–1', SS, 'superset', { supersetGroup: 'A' }),
    ],
  },
  {
    day: 3, code: 'FB2', title: 'Força B', items: [
      principal('stiff-pesado', 4, 6, 6, 210, '3–4 min'),
      principal('supino-inclinado-barra', 4, 6, 6, 180, '3 min'),
      it('remada-curvada', 'acessorio', 3, 6, 8, '1–2', 120, '2 min'),
      it('bulgaro', 'acessorio', 2, 8, 12, '1–2', 90, '90 s', { note: 'por perna' }),
      it('jm-press', 'acessorio', 3, 6, 10, '1', 120, '2 min'),
      it('crucifixo-inclinado', 'isolado', 2, 10, 15, '0–1', 60, '60 s'),
      it('elev-lateral', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('rosca-inversa', 'isolado', 2, 10, 15, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('crunch-carga', 'isolado', 2, 8, 15, '0–1', SS, 'superset', { supersetGroup: 'A' }),
    ],
  },
  {
    day: 4, code: 'FR2', title: 'Frame B', items: [
      it('rosca-martelo-inclinada', 'isolado', 3, 8, 12, '0–1', 90, '90 s'),
      it('rosca-spider', 'isolado', 2, 10, 15, '0–1', 60, '60 s'),
      it('desenv-halteres-sentado', 'acessorio', 2, 6, 10, '1–2', 120, '2 min'),
      it('elev-lateral', 'isolado', 2, 12, 20, '0', 60, '60 s', { note: '+ parciais alongadas' }),
      it('remada-arco', 'acessorio', 3, 8, 12, '0–1', 90, '90 s', { note: 'por lado' }),
      it('encolhimento-halteres', 'isolado', 3, 10, 15, '0–1', 90, '90 s'),
      it('crucifixo-invertido', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('rosca-punho', 'isolado', 2, 12, 20, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('dragon-flag', 'isolado', 2, 5, 8, '1', SS, 'superset', { supersetGroup: 'A' }),
    ],
  },
  {
    day: 5, code: 'FB3', title: 'Volume', items: [
      it('zercher-moderado', 'moderado', 3, 6, 8, '2–3', 150, '2–3 min', { refExerciseId: 'zercher', refPct: 0.75, note: '75% do top set de segunda' }),
      it('nordica', 'acessorio', 3, 4, 8, '1–2', 120, '2 min'),
      it('supino-inclinado-halteres', 'acessorio', 3, 8, 12, '1', 120, '2 min'),
      it('barra-fixa-neutra', 'acessorio', 3, 8, 12, '0–1', 120, '2 min'),
      it('triceps-testa', 'isolado', 3, 8, 12, '0–1', 90, '90 s'),
      it('elev-lateral', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('crucifixo-invertido', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('extensao-punho', 'isolado', 2, 12, 20, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('crunch-carga', 'isolado', 2, 8, 15, '0–1', SS, 'superset', { supersetGroup: 'A' }),
      it('panturrilha-unilateral', 'isolado', 3, 8, 15, '0', 60, '60 s', { optional: true, note: 'opcional' }),
    ],
  },
  {
    day: 6, code: 'SAB', title: 'Opcional (15 min)', optional: true, items: [
      it('elev-lateral', 'isolado', 2, 12, 20, '0', 60, '60 s'),
      it('crunch-carga', 'isolado', 2, 8, 15, '0–1', 60, '60 s'),
      it('rosca-punho', 'isolado', 2, 12, 20, '0–1', 60, '60 s'),
    ],
  },
  { day: 0, code: 'OFF', title: 'Descanso', items: [] },
]
