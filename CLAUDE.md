# CLAUDE.md — PO Agent AI

## Projeto

**PO Agent AI** — ferramenta web Angular para Product Owners refinarem histórias de usuário, gerar backlog estruturado e exportar documentos de produto enriquecidos com análise de dependências e riscos, usando Groq (Llama 3.3 70B) como motor de IA.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Angular 20 (standalone, zoneless, OnPush) |
| IA | Groq SDK — `llama-3.3-70b-versatile` |
| Auth | Supabase (email/senha) |
| Estilos | TailwindCSS (CDN) + marked.js (CDN) |
| Build | `@angular/build:application` (esbuild + Vite dev) |
| Persistência | localStorage (backlogs/histórico) + Supabase (auth) |
| PDF/Word | pdfjs-dist + mammoth |

## Como Rodar Localmente

```bash
npm install
npm run dev -- --port 4200   # porta 3000 ocupada por outro projeto local
```

Usuário de teste: `teste@teste.com` / `teste123`

A API key do Groq está em `src/environments/environment.ts` (`apiKey`). Não commitar com chave real — o git usa `skip-worktree` neste arquivo. Restaurar a chave localmente após clonar.

## Comandos Úteis

```bash
npm run dev -- --port 4200   # servidor de desenvolvimento
npm run build                # build de produção (sempre rodar após mudanças de template)
npm run preview              # preview do build de produção
npx tsc --noEmit             # type-check sem build
```

## Estrutura de Arquivos

```
src/
├── app.component.ts/html        # God Component: analyzer + backlog + import + modais
├── shell.component.ts           # Shell com router-outlet + auth.initSession()
├── app/
│   ├── app.routes.ts            # /login /register / /project/:name
│   ├── core/
│   │   ├── config/supabase.client.ts
│   │   ├── guards/auth.guard.ts
│   │   └── services/auth.service.ts
│   └── features/
│       ├── auth/login|register
│       ├── dashboard/           # Lista de projetos (backlogs)
│       ├── document-viewer/     # Visualizador de PRD/spec gerado
│       └── project-info/        # Painel de info do projeto (editável)
├── services/
│   ├── gemini.service.ts        # Cliente Groq (nome histórico — usa Groq, não Gemini)
│   ├── document.service.ts      # Parse de PDF/Word
│   └── document-export.service.ts # Exportação: PRD/spec/markdown/.feature
├── models/validation.model.ts   # Todos os tipos TypeScript
└── environments/
    ├── environment.ts           # Dev (apiKey Groq + Supabase — não commitar chave real)
    └── environment.prod.ts      # Prod
```

## Rotas

| Rota | Componente | Auth |
|------|-----------|------|
| `/login` | LoginComponent | pública |
| `/register` | RegisterComponent | pública |
| `/` | DashboardComponent | protegida |
| `/project/:name` | AppComponent | protegida |

## Funcionalidades Implementadas

### Backlog
- Hierarquia Épico > Feature > História
- Edição inline de título (duplo clique → Enter salva / Esc cancela)
- Modal de edição completo (botão lápis)
- Reordenação up/down
- Botões de análise IA no header: **Dependências** e **Riscos** (abrem modal estruturado)

### Analyzer
- Refinamento estratégico de histórias via IA
- Export `.feature` por história (Cucumber/Playwright)
- "Detalhar com IA" para expandir Gherkin
- Geração de: C4 Contexto · C4 Contêineres · Diagrama de Sequência
- Conversão de testes para Jest/Mocha

### Geração de Documentos (PRD / Spec)
O fluxo enriquecido ao clicar em "Gerar PRD.md" ou "Gerar spec.md":
1. Roda `analyzeBacklogDependencies()` + `analyzeBacklogRisks()` em **paralelo**
2. Serializa os resultados em seções markdown
3. Anexa ao draft antes de passar para `generateProjectDocument()`
4. Label do botão mostra o passo atual: "Analisando dependências e riscos..." → "Gerando PRD..."

### Risk Radar
`Risk.type` inclui: `'Técnico' | 'Negócio' | 'Usabilidade' | 'Compliance' | 'Rollout'`  
`Risk.severity?` opcional: `'baixa' | 'média' | 'alta'` — badges coloridos na UI

### Dashboard
- Skeleton loading com `animate-pulse` enquanto projetos carregam

## Padrões IA (GeminiService)

- Todas as chamadas passam por `src/services/gemini.service.ts`
- Respostas estruturadas: `response_format: { type: 'json_object' }`
- Schema completo descrito no system prompt
- Auto-correção de JSON: segunda tentativa com `temperature: 0.0` em caso de falha
- Modelo único: `llama-3.3-70b-versatile` (constante `MODEL`)

## Convenções de Código

- **Componentes**: standalone, `ChangeDetectionStrategy.OnPush`, `inject()` (sem constructor injection)
- **Estado**: Signals (`signal`, `computed`) — sem RxJS nos componentes
- **Formulários**: Template-driven com `ngModel` (padrão do projeto)
- **Tipos**: todos em `src/models/validation.model.ts` — nunca remover campos existentes de `RefinedStory`
- **Imutabilidade**: spread `{...obj}` ao atualizar estado — nunca mutar diretamente
- **Novos campos em `RefinedStory`**: sempre opcionais (`campo?: tipo`)

## Segurança

- API key nunca commitada — usar placeholder `__GROQ_API_KEY__` no git
- `git update-index --skip-worktree src/environments/environment.ts` para ignorar mudanças locais
- Supabase anon key é pública por design (RLS no banco)
- Auth guard protege todas as rotas de produto

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

## Regras ECC Instaladas

`.claude/rules/ecc/` contém:
- `common/` — coding style, git workflow, testing, security
- `angular/` — signals, OnPush, inject(), standalone, forms
- `typescript/` — tipos explícitos, sem `any`
- `web/` — performance, CSP, animações, design quality
