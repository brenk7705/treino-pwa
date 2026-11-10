// Catálogo de exercícios do plano + mapeamento para o free-exercise-db
// (github.com/yuhonas/free-exercise-db, domínio público).
// fedbId = null → sem correspondência no dataset → usa animação SVG (campo `svg`).
// Este arquivo usa apenas sintaxe "apagável" de TS para poder ser lido direto pelo Node
// (scripts/fetch-exercises.mjs).

export type Equipment = 'barra' | 'halter' | 'cabo' | 'corpo' | 'anilha' | 'maquina'
export type SvgAnim = 'dragon-flag' | 'puxada-diagonal' | 'remada-arco' | 'generico'

export interface ExerciseDef {
  id: string
  name: string
  fedbId: string | null
  svg?: SvgAnim
  equipment: Equipment
  lower?: boolean // membros inferiores → +5 kg no principal
  muscles: string[]
  tips: [string, string, string]
}

export const EXERCISES: ExerciseDef[] = [
  {
    id: 'zercher', name: 'Zercher squat', fedbId: 'Zercher_Squats', equipment: 'barra', lower: true,
    muscles: ['Quadríceps', 'Glúteos', 'Core', 'Eretores da espinha'],
    tips: [
      'Barra na dobra dos cotovelos, mãos juntas e cotovelos colados no tronco.',
      'Desça com o tronco o mais vertical possível, joelhos acompanhando a ponta dos pés.',
      'Suba empurrando o chão com o pé inteiro e mantenha o abdômen travado (respire e segure).',
    ],
  },
  {
    id: 'zercher-moderado', name: 'Zercher squat moderado', fedbId: 'Zercher_Squats', equipment: 'barra', lower: true,
    muscles: ['Quadríceps', 'Glúteos', 'Core'],
    tips: [
      'Mesma técnica do top set de segunda — velocidade constante em todas as reps.',
      'Pausa curta embaixo, sem quicar.',
      'Pare a série se a coluna começar a arredondar.',
    ],
  },
  {
    id: 'stiff-pesado', name: 'Stiff pesado', fedbId: 'Stiff-Legged_Barbell_Deadlift', equipment: 'barra', lower: true,
    muscles: ['Posteriores de coxa', 'Glúteos', 'Eretores da espinha'],
    tips: [
      'Joelhos levemente destravados e fixos; o movimento é só de quadril.',
      'Leve o quadril para trás mantendo a barra raspando nas coxas.',
      'Desça até sentir o alongamento máximo sem perder a coluna neutra.',
    ],
  },
  {
    id: 'stiff-leve', name: 'Stiff leve (técnica)', fedbId: 'Stiff-Legged_Barbell_Deadlift', equipment: 'barra', lower: true,
    muscles: ['Posteriores de coxa', 'Glúteos'],
    tips: [
      'Foco total na técnica: descida controlada de 2–3 s.',
      'Barra colada nas pernas o tempo todo.',
      'Contraia glúteos no topo sem hiperestender a lombar.',
    ],
  },
  {
    id: 'desenv-militar', name: 'Desenvolvimento militar em pé (barra)', fedbId: 'Standing_Military_Press', equipment: 'barra',
    muscles: ['Deltoide anterior', 'Deltoide lateral', 'Tríceps', 'Core'],
    tips: [
      'Glúteos e abdômen contraídos para não arquear a lombar.',
      'Tire a cabeça do caminho e empurre a barra em linha reta sobre o meio do pé.',
      'No topo, "enfie a cabeça" entre os braços e trave os cotovelos.',
    ],
  },
  {
    id: 'barra-fixa-carga', name: 'Barra fixa com carga (pronada)', fedbId: 'Weighted_Pull_Ups', equipment: 'corpo',
    muscles: ['Latíssimo do dorso', 'Bíceps', 'Romboides'],
    tips: [
      'Comece em suspensão completa, ombros ativos (escápulas para baixo).',
      'Puxe os cotovelos em direção aos bolsos até o queixo passar a barra.',
      'Desça controlando, sem balançar as pernas. Carga = peso extra no cinto.',
    ],
  },
  {
    id: 'triceps-overhead', name: 'Extensão de tríceps overhead (halter/cabo)', fedbId: 'Cable_Rope_Overhead_Triceps_Extension', equipment: 'cabo',
    muscles: ['Tríceps (cabeça longa)'],
    tips: [
      'Cotovelos apontando para frente/cima e parados durante todo o movimento.',
      'Desça até o alongamento máximo atrás da cabeça.',
      'Estenda completamente sem arquear a lombar.',
    ],
  },
  {
    id: 'elev-lateral', name: 'Elevação lateral', fedbId: 'Side_Lateral_Raise', equipment: 'halter',
    muscles: ['Deltoide lateral'],
    tips: [
      'Tronco levemente inclinado à frente, cotovelos levemente flexionados.',
      'Suba "abrindo" até a altura dos ombros, cotovelo um pouco acima do punho.',
      'Desça em 2 s; nada de embalo com o tronco.',
    ],
  },
  {
    id: 'elev-lateral-inclinada', name: 'Elevação lateral inclinada (segurando no rack)', fedbId: 'One-Arm_Side_Laterals', equipment: 'halter',
    muscles: ['Deltoide lateral'],
    tips: [
      'Segure no rack e incline o corpo para o lado oposto ao halter (~15–30°).',
      'Comece com o braço cruzando à frente do corpo para alongar o deltoide.',
      'Após a falha, faça parciais na metade de baixo (alongada).',
    ],
  },
  {
    id: 'rosca-punho', name: 'Rosca de punho (flexão)', fedbId: 'Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench', equipment: 'halter',
    muscles: ['Flexores do antebraço'],
    tips: [
      'Antebraços apoiados no banco/coxa, punhos para fora, palmas para cima.',
      'Deixe o halter rolar até a ponta dos dedos para alongar.',
      'Flexione o punho ao máximo e segure 1 s no topo.',
    ],
  },
  {
    id: 'extensao-punho', name: 'Extensão de punho', fedbId: 'Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench', equipment: 'halter',
    muscles: ['Extensores do antebraço'],
    tips: [
      'Antebraços apoiados, palmas para baixo.',
      'Amplitude total: deixe o punho cair e depois estenda ao máximo.',
      'Carga leve e controle — os extensores são fracos.',
    ],
  },
  {
    id: 'crunch-anilha', name: 'Crunch com anilha', fedbId: 'Weighted_Crunches', equipment: 'anilha',
    muscles: ['Reto abdominal'],
    tips: [
      'Anilha no peito ou atrás da cabeça, lombar no chão.',
      'Enrole a coluna aproximando costelas da pelve (não puxe o pescoço).',
      'Expire forte no topo e desça devagar.',
    ],
  },
  {
    id: 'crunch-carga', name: 'Crunch com carga', fedbId: 'Cable_Crunch', equipment: 'cabo',
    muscles: ['Reto abdominal'],
    tips: [
      'Ajoelhado na polia (ou com anilha): quadril parado.',
      'Flexione a coluna levando os cotovelos em direção às coxas.',
      'Controle a volta até alongar o abdômen.',
    ],
  },
  {
    id: 'rosca-inclinada', name: 'Rosca inclinada com halteres', fedbId: 'Incline_Dumbbell_Curl', equipment: 'halter',
    muscles: ['Bíceps (cabeça longa)'],
    tips: [
      'Banco a ~45–60°, braços pendurados atrás da linha do tronco.',
      'Suba sem levar o cotovelo para frente.',
      'Desça até a extensão completa para aproveitar o alongamento.',
    ],
  },
  {
    id: 'rosca-martelo-cruzada', name: 'Rosca martelo cruzada no peito', fedbId: 'Cross_Body_Hammer_Curl', equipment: 'halter',
    muscles: ['Braquial', 'Braquiorradial', 'Bíceps'],
    tips: [
      'Pegada neutra; leve o halter em direção ao ombro oposto.',
      'Cotovelo fixo ao lado do corpo.',
      'Alterne os braços sem girar o tronco.',
    ],
  },
  {
    id: 'puxada-diagonal', name: 'Puxada diagonal unilateral ajoelhado (polia alta)', fedbId: null, svg: 'puxada-diagonal', equipment: 'cabo',
    muscles: ['Latíssimo do dorso', 'Redondo maior'],
    tips: [
      'Ajoelhado de lado para a polia, pegue o cabo com a mão do lado oposto e alongue em diagonal.',
      'Puxe o cotovelo para baixo e em direção ao quadril, em arco.',
      'Volte devagar até sentir a lateral do tronco alongada. Faça por lado.',
    ],
  },
  {
    id: 'remada-apoiada', name: 'Remada apoiada no banco inclinado (halteres)', fedbId: 'Dumbbell_Incline_Row', equipment: 'halter',
    muscles: ['Romboides', 'Trapézio médio', 'Latíssimo', 'Deltoide posterior'],
    tips: [
      'Peito apoiado no banco a ~30–45°, pés firmes.',
      'Puxe os halteres em direção ao quadril, juntando as escápulas.',
      'Sem tirar o peito do banco; desça até alongar completamente.',
    ],
  },
  {
    id: 'encolhimento-barra', name: 'Encolhimento com barra', fedbId: 'Barbell_Shrug', equipment: 'barra',
    muscles: ['Trapézio superior'],
    tips: [
      'Braços estendidos, barra na frente das coxas.',
      'Suba os ombros em direção às orelhas (sem girar).',
      'Segure 1 s no topo e desça até alongar.',
    ],
  },
  {
    id: 'encolhimento-halteres', name: 'Encolhimento com halteres', fedbId: 'Dumbbell_Shrug', equipment: 'halter',
    muscles: ['Trapézio superior'],
    tips: [
      'Halteres ao lado do corpo, pegada neutra.',
      'Eleve os ombros reto para cima.',
      'Pausa no topo, descida controlada.',
    ],
  },
  {
    id: 'crucifixo-invertido', name: 'Crucifixo invertido', fedbId: 'Reverse_Flyes', equipment: 'halter',
    muscles: ['Deltoide posterior', 'Romboides'],
    tips: [
      'Tronco inclinado quase paralelo ao chão, coluna neutra.',
      'Abra os braços em arco com cotovelos levemente flexionados.',
      'Pense em levar as mãos "para longe", não em juntar as escápulas.',
    ],
  },
  {
    id: 'elev-pernas-barra', name: 'Elevação de pernas na barra fixa', fedbId: 'Hanging_Leg_Raise', equipment: 'corpo',
    muscles: ['Reto abdominal', 'Flexores do quadril'],
    tips: [
      'Pendurado, ombros ativos, sem balançar.',
      'Eleve as pernas enrolando a pelve para cima no final.',
      'Desça devagar; para evoluir, estenda mais as pernas.',
    ],
  },
  {
    id: 'supino-inclinado-barra', name: 'Supino inclinado com barra (~30°)', fedbId: 'Barbell_Incline_Bench_Press_-_Medium_Grip', equipment: 'barra',
    muscles: ['Peitoral (porção clavicular)', 'Deltoide anterior', 'Tríceps'],
    tips: [
      'Escápulas retraídas e para baixo, pés firmes no chão.',
      'Desça a barra até a parte alta do peito, cotovelos ~45–60°.',
      'Empurre para cima e levemente para trás, sem tirar o glúteo do banco.',
    ],
  },
  {
    id: 'supino-inclinado-halteres', name: 'Supino inclinado com halteres', fedbId: 'Incline_Dumbbell_Press', equipment: 'halter',
    muscles: ['Peitoral (porção clavicular)', 'Deltoide anterior', 'Tríceps'],
    tips: [
      'Banco a ~30°, escápulas presas no banco.',
      'Desça os halteres até o alongamento confortável do peitoral.',
      'Suba em leve arco, aproximando os halteres no topo.',
    ],
  },
  {
    id: 'remada-curvada', name: 'Remada curvada com barra', fedbId: 'Bent_Over_Barbell_Row', equipment: 'barra',
    muscles: ['Latíssimo', 'Romboides', 'Trapézio', 'Eretores'],
    tips: [
      'Tronco a ~45°, joelhos semiflexionados, coluna neutra.',
      'Puxe a barra até a parte baixa do abdômen.',
      'Não use o tronco para dar impulso; desça a barra controlando.',
    ],
  },
  {
    id: 'bulgaro', name: 'Agachamento búlgaro (halteres)', fedbId: 'Split_Squat_with_Dumbbells', equipment: 'halter', lower: true,
    muscles: ['Quadríceps', 'Glúteos'],
    tips: [
      'Pé de trás apoiado no banco; pé da frente longe o bastante para o joelho não passar muito.',
      'Desça reto até o joelho de trás quase tocar o chão.',
      'Empurre pelo calcanhar da perna da frente. Faça por perna.',
    ],
  },
  {
    id: 'jm-press', name: 'JM press', fedbId: 'JM_Press', equipment: 'barra',
    muscles: ['Tríceps'],
    tips: [
      'Pegada fechada; deitado como num supino.',
      'Desça a barra em direção ao queixo/pescoço flexionando os cotovelos para frente (híbrido de supino e testa).',
      'Empurre de volta estendendo os cotovelos — carga moderada, articulação agradece.',
    ],
  },
  {
    id: 'crucifixo-inclinado', name: 'Crucifixo inclinado (halteres)', fedbId: 'Incline_Dumbbell_Flyes', equipment: 'halter',
    muscles: ['Peitoral (porção clavicular)'],
    tips: [
      'Banco a ~30°, cotovelos levemente flexionados e fixos.',
      'Abra em arco até o alongamento do peito (sem forçar o ombro).',
      'Feche como se abraçasse uma árvore.',
    ],
  },
  {
    id: 'rosca-inversa', name: 'Rosca inversa (barra EZ)', fedbId: 'Reverse_Barbell_Curl', equipment: 'barra',
    muscles: ['Braquiorradial', 'Braquial', 'Extensores do antebraço'],
    tips: [
      'Pegada pronada (palmas para baixo) na largura dos ombros.',
      'Cotovelos colados ao corpo; suba sem embalo.',
      'Punhos retos, não deixe dobrar para baixo.',
    ],
  },
  {
    id: 'rosca-martelo-inclinada', name: 'Rosca martelo inclinada', fedbId: 'Incline_Hammer_Curls', equipment: 'halter',
    muscles: ['Braquial', 'Braquiorradial', 'Bíceps'],
    tips: [
      'Banco inclinado, braços pendurados, pegada neutra.',
      'Suba sem mover o cotovelo para frente.',
      'Desça até a extensão completa.',
    ],
  },
  {
    id: 'rosca-spider', name: 'Rosca spider ou concentrada', fedbId: 'Spider_Curl', equipment: 'barra',
    muscles: ['Bíceps (cabeça curta)', 'Braquial'],
    tips: [
      'Peito apoiado no banco inclinado, braços pendurados na vertical.',
      'Contraia forte no topo por 1 s.',
      'Sem balançar; amplitude completa.',
    ],
  },
  {
    id: 'desenv-halteres-sentado', name: 'Desenvolvimento com halteres sentado', fedbId: 'Seated_Dumbbell_Press', equipment: 'halter',
    muscles: ['Deltoide anterior', 'Deltoide lateral', 'Tríceps'],
    tips: [
      'Encosto a ~80–90°, lombar apoiada.',
      'Desça os halteres até a altura das orelhas.',
      'Suba sem bater os halteres, cotovelos levemente à frente do corpo.',
    ],
  },
  {
    id: 'remada-arco', name: 'Remada unilateral com halter em arco', fedbId: null, svg: 'remada-arco', equipment: 'halter',
    muscles: ['Latíssimo do dorso', 'Redondo maior'],
    tips: [
      'Apoie mão e joelho no banco; braço começa estendido à frente do ombro.',
      'Puxe o halter em arco, levando-o em direção ao quadril (não ao peito).',
      'Volte pelo mesmo arco até alongar o dorsal. Faça por lado.',
    ],
  },
  {
    id: 'dragon-flag', name: 'Dragon flag no banco', fedbId: null, svg: 'dragon-flag', equipment: 'corpo',
    muscles: ['Reto abdominal', 'Core', 'Flexores do quadril'],
    tips: [
      'Deitado no banco, segure firme atrás da cabeça; apoio fica nos ombros/escápulas.',
      'Eleve o corpo reto (sem dobrar o quadril) até quase a vertical.',
      'Desça o corpo inteiro em bloco, bem devagar — a descida é o exercício.',
    ],
  },
  {
    id: 'nordica', name: 'Flexão nórdica (ou mesa flexora)', fedbId: 'Natural_Glute_Ham_Raise', equipment: 'corpo', lower: true,
    muscles: ['Posteriores de coxa'],
    tips: [
      'Ajoelhado com os tornozelos presos, quadril estendido (corpo reto dos joelhos à cabeça).',
      'Desça o mais devagar possível resistindo com os posteriores.',
      'Amorteça com as mãos e use-as para voltar, se necessário.',
    ],
  },
  {
    id: 'barra-fixa-neutra', name: 'Barra fixa ou puxada (neutra/supinada)', fedbId: 'Chin-Up', equipment: 'corpo',
    muscles: ['Latíssimo do dorso', 'Bíceps'],
    tips: [
      'Pegada supinada ou neutra, na largura dos ombros.',
      'Puxe até o queixo passar a barra, cotovelos para baixo.',
      'Desça até a extensão completa dos braços.',
    ],
  },
  {
    id: 'triceps-testa', name: 'Tríceps testa (barra EZ)', fedbId: 'EZ-Bar_Skullcrusher', equipment: 'barra',
    muscles: ['Tríceps'],
    tips: [
      'Braços levemente inclinados para trás da vertical (mais tensão).',
      'Desça a barra em direção à testa/atrás da cabeça só flexionando os cotovelos.',
      'Cotovelos fechados, não deixe abrir.',
    ],
  },
  {
    id: 'panturrilha-unilateral', name: 'Panturrilha em pé unilateral', fedbId: 'Standing_Dumbbell_Calf_Raise', equipment: 'halter', lower: true,
    muscles: ['Gastrocnêmio', 'Sóleo'],
    tips: [
      'Ponta do pé num degrau, halter na mão do mesmo lado.',
      'Desça até o alongamento máximo e segure 1 s.',
      'Suba o mais alto possível; sem quicar.',
    ],
  },
]

export const EXERCISE_BY_ID: Record<string, ExerciseDef> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
