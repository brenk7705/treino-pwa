# Treino — PWA de treino pessoal

App de treino offline (Vite + React + TypeScript + Tailwind + Dexie/IndexedDB), feito para o meu plano FB/FR.

- **Hoje**: abre o treino do dia da semana (com troca manual), cards com miniatura animada.
- **Execução**: animação, sugestão “Hoje tente: X kg”, séries pré‑preenchidas com a última vez, botão “✓ Série feita” que inicia o descanso.
- **Descanso**: contagem grande, vibração + som, +15/−15/pular, continua ao trocar de tela (e até ao recarregar).
- **Progressão**: principal (top set + back‑off 90%), moderado (% do top set de referência), dupla progressão em acessórios/isolados, arredondamento por equipamento, aviso de deload.
- **Histórico**: gráfico do top set e 1RM estimada (Epley) + lista de sessões.
- **Semana / Ajustes**: visão seg–dom, backup JSON, edição do plano.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes das regras de progressão
npm run build      # gera dist/
```

`npm run fetch-exercises` baixa novamente as imagens do [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público) para `public/exercises/` e mostra quais exercícios do plano ficaram sem correspondência (esses usam boneco SVG). O mapeamento fica em `src/data/exerciseMap.ts`.

## Publicação

**App no ar: https://treino-brenk.netlify.app** (Netlify, projeto `treino-brenk`).

Para publicar uma nova versão (precisa do Netlify CLI logado: `npm i -g netlify-cli` e `netlify login`):

```bash
npm run deploy
```

O código fica em https://github.com/brenk7705/treino-pwa. O workflow do GitHub Pages em `.github/workflows/deploy.yml` é opcional e só roda manualmente.

## Instalar no celular

Abra **https://treino-brenk.netlify.app** uma vez com internet (isso baixa tudo para uso offline):

- **Android (Chrome)**: menu ⋮ → **Instalar app** (ou “Adicionar à tela inicial”).
- **iPhone (Safari)**: botão **Compartilhar** → **Adicionar à Tela de Início**. Precisa ser pelo Safari.

Depois disso funciona sem internet, inclusive as animações.

> No iPhone a vibração não existe na web e o som do descanso só toca com o app aberto (a contagem continua certa mesmo se a tela apagar). A tela fica acesa durante o descanso quando o aparelho permite.

## Backup

Os dados ficam **só no aparelho** (IndexedDB do navegador). Apagar os dados do navegador, ou desinstalar o app no iPhone, apaga o histórico.

- **Ajustes → Exportar JSON**: baixa `treino-backup-AAAA-MM-DD.json`. Guarde no Drive/iCloud/e‑mail (sugestão: 1× por semana).
- **Ajustes → Importar JSON**: restaura um backup (substitui os dados atuais) — também serve para passar para outro celular.
