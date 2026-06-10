# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**PO Agent AI** — ferramenta web Angular para Product Owners refinarem histórias de usuário, gerar backlog estruturado e exportar documentos de produto enriquecidos com análise de dependências e riscos, usando OpenAI (GPT-4o) como motor de IA.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Angular 20 (standalone, zoneless, OnPush) |
| IA | OpenAI SDK (`openai` npm) — `gpt-4o` / `gpt-4o-mini` |
| Auth | Supabase (email/senha) |
| Estilos | TailwindCSS (CDN) + marked.js (CDN) |
| Build | `@angular/build:application` (esbuild) |
| Persistência | localStorage (backlogs/histórico) + Supabase (auth) |
| PDF/Word | pdfjs-dist + mammoth |
| Deploy | Vercel (frontend) + Railway (server) |

## Comandos

```bash
# Desenvolvimento (angular.json defaulta para porta 3000; use 4200 se 3000 estiver ocupada)
npm run dev -- --port 4200

# Build de produção (OBRIGATÓRIO rodar após qualquer mudança de template)
npm run build

# Type-check sem build
npx tsc --noEmit

# E2E (Playwright — vários configs para cenários diferentes)
npx playwright test --config=playwright.debug.config.ts
npx playwright test --config=playwright.deployed.config.ts

# Backend (server/)
cd server && npm install && npm run dev
```

Usuário de teste: `teste@teste.com` / `teste123`

## Arquitetura

### Estrutura de Arquivos

```
src/
├── app.component.ts/html        # "God Component" do projeto — analyzer + backlog + modais
├── shell.component.ts           # Shell com <router-outlet> + auth.initSession()
├── index.tsx                    # Entry point (não index.html — ver angular.json "browser")
├── app/
│   ├── app.routes.ts            # Rotas com lazy-load + authGuard
│   ├── core/
│   │   ├── config/supabase.client.ts
│   │   ├── guards/auth.guard.ts
│   │   └── services/auth.service.ts
│   └── features/
│       ├── auth/login|register
│       ├── dashboard/           # Lista de projetos (backlogs por usuário)
│       ├── document-viewer/     # Visualizador de PRD/spec gerado
│       └── project-info/        # Painel de info do projeto (editável)
├── services/
│   ├── gemini.service.ts        # Cliente OpenAI (nome histórico — NÃO renomear)
│   ├── document.service.ts      # Parse de PDF/Word via pdfjs-dist + mammoth
│   └── document-export.service.ts # Export: PRD/spec/markdown/.feature
├── models/validation.model.ts   # Todos os tipos TypeScript do domínio
└── environments/
    ├── environment.ts           # Dev (apiKey OpenAI — protegido por skip-worktree)
    └── environment.prod.ts      # Prod (apiKey injetada pelo Vercel via sed)
server/                          # Backend Express (Railway)
```

### Roteamento

| Rota | Componente | Auth |
|------|-----------|------|
| `/login` | LoginComponent | pública |
| `/register` | RegisterComponent | pública |
| `/` | DashboardComponent | protegida |
| `/project/:name` | AppComponent | protegida |

Todas as rotas usam `loadComponent` (lazy). O `authGuard` é funcional (`CanActivateFn`).

### GeminiService — Cliente OpenAI

`src/services/gemini.service.ts` é o único ponto de chamada à API de IA. O nome "Gemini" é histórico — o serviço usa `openai` npm com OpenAI.

- `MODEL = 'gpt-4o'` — refinamento completo (schema complexo)
- `MODEL_FAST = 'gpt-4o-mini'` — descoberta e tarefas simples
- Todas as respostas estruturadas usam `response_format: { type: 'json_object' }`
- Auto-correção: segunda tentativa com `temperature: 0.0` em caso de falha de parse
- Timeout: 180 segundos por chamada

### Geração de Documentos (PRD / Spec)

Ao clicar em "Gerar PRD.md" ou "Gerar spec.md", `AppComponent` orquestra:
1. `analyzeBacklogDependencies()` + `analyzeBacklogRisks()` em **paralelo**
2. Resultados serializados em seções markdown
3. Draft enriquecido passado para `generateProjectDocument()`
4. Label do botão reflete o passo atual durante o processo

## Convenções

- **Componentes**: standalone, `ChangeDetectionStrategy.OnPush`, `inject()` — sem constructor injection
- **Estado**: Signals (`signal`, `computed`) — sem RxJS nos componentes
- **Formulários**: Template-driven com `ngModel` (padrão do projeto; não migrar para Reactive Forms sem necessidade)
- **Tipos**: todos em `src/models/validation.model.ts` — nunca remover campos existentes de `RefinedStory`; novos campos sempre opcionais (`campo?: tipo`)
- **Imutabilidade**: spread `{...obj}` ao atualizar estado — nunca mutar diretamente

## Segurança / API Key

- `environment.ts` usa placeholder `__OPENAI_API_KEY__` — protegido por `git update-index --skip-worktree`
- No Vercel, o build injeta a chave via `sed -i "s|__OPENAI_API_KEY__|$OPENAI_API_KEY|g" src/environments/environment.prod.ts`
- Supabase anon key é pública por design (RLS no banco)
- Para restaurar a chave localmente após clonar: editar `src/environments/environment.ts` e rodar `git update-index --skip-worktree src/environments/environment.ts`

## PRPs Planejados

`.claude/PRPs/plans/`:

| Plan | Story | Status |
|------|-------|--------|
| `cloud-persistence-supabase.plan.md` | US-001 | pendente |
| `error-handling-loading-states.plan.md` | US-002 | pendente |
| `gherkin-studio.plan.md` | US-009 | pendente (export .feature já feito) |
| `risk-radar.plan.md` | US-010 | pendente (base implementada) |
| `architecture-lens.plan.md` | US-012 | pendente (base implementada) |
| `backlog-health-score.plan.md` | US-013 | pendente (análise modal feita) |
| `dor-gatekeeper.plan.md` | US-014 | pendente |
| `persona-context-engine.plan.md` | US-015 | pendente |
| `sprint-simulation.plan.md` | US-016 | pendente |
