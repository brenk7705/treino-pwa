// Baixa as imagens (posição inicial/final) do free-exercise-db para public/exercises/
// e mostra quais exercícios do plano ficaram sem correspondência.
// Uso: npm run fetch-exercises   (Node >= 23.6, que lê .ts nativamente)
import { mkdir, writeFile, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXERCISES } from '../src/data/exerciseMap.ts'

const RAW = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'exercises')

const exists = (p) => access(p).then(() => true, () => false)

const res = await fetch(`${RAW}/dist/exercises.json`)
if (!res.ok) throw new Error(`Falha ao baixar exercises.json: ${res.status}`)
const dataset = await res.json()
const byId = new Map(dataset.map((e) => [e.id, e]))

const matched = []
const unmatched = []
const invalid = []
const ids = [...new Set(EXERCISES.filter((e) => e.fedbId).map((e) => e.fedbId))]

for (const e of EXERCISES) {
  if (!e.fedbId) unmatched.push(e)
  else if (!byId.has(e.fedbId)) invalid.push(e)
  else matched.push(e)
}

let downloaded = 0
for (const id of ids) {
  const entry = byId.get(id)
  if (!entry) continue
  const dir = join(outDir, id)
  await mkdir(dir, { recursive: true })
  for (const [i, rel] of entry.images.slice(0, 2).entries()) {
    const file = join(dir, `${i}.jpg`)
    if (await exists(file)) continue
    const r = await fetch(`${RAW}/exercises/${rel}`)
    if (!r.ok) throw new Error(`Falha ao baixar ${rel}: ${r.status}`)
    await writeFile(file, Buffer.from(await r.arrayBuffer()))
    downloaded++
  }
}

console.log(`\n✔ ${matched.length} exercícios com imagens do free-exercise-db (${ids.length} ids únicos, ${downloaded} imagens novas baixadas)`)
for (const e of matched) console.log(`   ${e.name.padEnd(52)} → ${e.fedbId}`)
console.log(`\n✖ ${unmatched.length} SEM correspondência (usam animação SVG de boneco):`)
for (const e of unmatched) console.log(`   ${e.name.padEnd(52)} → svg:${e.svg}`)
if (invalid.length) {
  console.log(`\n⚠ ${invalid.length} com fedbId inexistente no dataset (corrija em exerciseMap.ts):`)
  for (const e of invalid) console.log(`   ${e.name} → ${e.fedbId}`)
  process.exitCode = 1
}
