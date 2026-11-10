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

## Publicar no GitHub Pages

1. Crie um repositório **público** no GitHub chamado `treino-pwa` (pode ser outro nome — o build se ajusta sozinho).
2. Na pasta do projeto:
   ```bash
   git init -b main
   git add .
   git commit -m "Treino PWA"
   git remote add origin https://github.com/SEU_USUARIO/treino-pwa.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Aba **Actions**: o workflow “Deploy no GitHub Pages” roda (testes + build + deploy). Se tiver rodado antes do passo 3, clique em “Re-run jobs”.
5. Link final: **`https://SEU_USUARIO.github.io/treino-pwa/`**

Cada `git push` na `main` publica uma nova versão; o app se atualiza sozinho na próxima vez que você abrir com internet.

## Instalar no celular

Abra o link uma vez com internet (isso baixa tudo para uso offline):

- **Android (Chrome)**: menu ⋮ → **Instalar app** (ou “Adicionar à tela inicial”).
- **iPhone (Safari)**: botão **Compartilhar** → **Adicionar à Tela de Início**. Precisa ser pelo Safari.

Depois disso funciona sem internet, inclusive as animações.

> No iPhone a vibração não existe na web e o som do descanso só toca com o app aberto (a contagem continua certa mesmo se a tela apagar). A tela fica acesa durante o descanso quando o aparelho permite.

## Backup

Os dados ficam **só no aparelho** (IndexedDB do navegador). Apagar os dados do navegador, ou desinstalar o app no iPhone, apaga o histórico.

- **Ajustes → Exportar JSON**: baixa `treino-backup-AAAA-MM-DD.json`. Guarde no Drive/iCloud/e‑mail (sugestão: 1× por semana).
- **Ajustes → Importar JSON**: restaura um backup (substitui os dados atuais) — também serve para passar para outro celular.
