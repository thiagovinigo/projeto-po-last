# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**PO Agent AI** — Angular 20 web tool for Product Owners that transforms raw feature descriptions into refined user stories, structured backlogs, and exportable product documents using Groq (Llama 3.3 70B).

## Commands

```bash
npm install          # install dependencies
npm run dev -- --port 4200   # dev server at http://localhost:4200 (porta 3000 ocupada por outro projeto)
npm run build        # production build (run after any Angular change to catch template errors)
npm run preview      # serve production build locally
npx tsc --noEmit     # type-check without building
```

No test runner is configured. `@playwright/test` is installed as a dev dependency (for future E2E).

## Architecture

### Bootstrap Flow

`index.html` → `<app-root>` → `ShellComponent` (`shell.component.ts`) → `ngOnInit` calls `auth.initSession()` → Supabase session loaded → `RouterOutlet` activates routes.

`ShellComponent` is the true root. It owns session initialization. `AppComponent` is **not** the root — it's the `/project/:name` route component (a 718-line God Component handling the full project workspace).

### Routing

| Route | Component | Guard |
|---|---|---|
| `/login` | `LoginComponent` | public |
| `/register` | `RegisterComponent` | public |
| `/` | `DashboardComponent` | `authGuard` |
| `/project/:name` | `AppComponent` | `authGuard` |

All routes lazy-load via `loadComponent`. The `authGuard` redirects unauthenticated users to `/login`.

### Data Flow

1. **Auth**: `AuthService` wraps Supabase auth, exposes `user = signal<User|null>()` and `isAuthenticated = computed(...)`. `supabase.client.ts` is the singleton client.

2. **Backlog persistence**: Currently `localStorage` only. `DashboardComponent` and `AppComponent` both call `localStorage.getItem/setItem('userStoryBacklogs')` directly — no service abstraction. Migration to Supabase is planned (see `.claude/PRPs/plans/cloud-persistence-supabase.plan.md`).

3. **AI pipeline**: All Groq calls go through `src/services/gemini.service.ts` (named for historical reasons — it uses Groq, not Gemini). The private `generateValidation<T>()` method handles JSON mode + auto-correction on parse failure. Direct `groq.chat.completions.create()` calls are used for non-JSON responses.

4. **Types**: All TypeScript interfaces live in `src/models/validation.model.ts`. `RefinedStory` is the core domain type. `BacklogItem extends RefinedStory` adding `id` and `order`.

5. **Architecture Lens**: `generateTechnicalArtifact()` aceita 4 tipos: `'doc'`, `'c4-diagram'` (C4 Context), `'c4-container'` (C4 Container), `'sequence-diagram'`. Cada tipo tem prompt especializado.

6. **Risk model**: `Risk.type` inclui `'Compliance'` e `'Rollout'` além dos originais. `Risk.severity` é opcional (`'baixa'|'média'|'alta'`) — campos existentes não foram removidos.

7. **Inline edit**: `AppComponent` tem `inlineEditId` e `inlineEditTitle` signals. Duplo clique no título no backlog ativa edição inline. Modal de edição completo ainda existe via botão de lápis.

### CDN Dependencies (loaded in `index.html`)

TailwindCSS, `marked.js`, and Font Awesome are loaded via CDN — **not bundled**. `marked` is accessed as a global `declare var marked: any` in `AppComponent`. TailwindCSS classes are available in all templates without imports. These must be available at runtime; there is no PostCSS pipeline.

## Code Conventions

**Angular 20 patterns to follow:**
- Standalone components with `ChangeDetectionStrategy.OnPush`
- `inject()` for dependency injection — no constructor injection
- Signals: `signal()`, `computed()`, `linkedSignal()`, `input.required<T>()`, `output<T>()`
- Template block syntax: `@if`, `@for (... track item.id)`, `@else` — not `*ngIf`/`*ngFor`
- Forms: template-driven with `ngModel` (existing pattern) — not reactive forms

**State updates must be immutable:**
```typescript
// CORRECT
this.backlogs.update(list => list.map(b => b.name === name ? { ...b, items: [...b.items, newItem] } : b));
// WRONG: b.items.push(newItem)
```

**Services** return `{ error: string | null }` for operations with auth; throw `Error` for AI operations.

## AI Service Patterns (`gemini.service.ts`)

- Model constant: `const MODEL = 'llama-3.3-70b-versatile'`
- Structured JSON responses: always use `response_format: { type: 'json_object' }` and describe the full schema in the system prompt
- The client is initialized with `dangerouslyAllowBrowser: true` — the Groq API key is exposed to the browser. This is a known limitation for the current client-side-only architecture.
- `generateValidation<T>()` (private) handles two-attempt error recovery: first parse attempt, then self-correction prompt if JSON is malformed.

## Planned Feature PRPs

Implementation plans are stored in `.claude/PRPs/plans/`:

| Plan | Story | Description |
|---|---|---|
| `cloud-persistence-supabase.plan.md` | US-001 | Migrate `localStorage` → Supabase `backlogs` table + `BacklogService` |
| `error-handling-loading-states.plan.md` | US-002/003 | `ToastService`, `classifyGroqError`, skeleton loaders, translated auth errors |
| `story-chat-conversational-refinement.plan.md` | — | Chat panel per story for iterative BDD refinement via Groq |
| `gherkin-studio.plan.md` | US-009 | BDD Gherkin Studio with `.feature` export for Cucumber/Playwright |
| `risk-radar.plan.md` | US-010 | Story Risk Radar — 4-dimension risk analysis per story |
| `reasoned-estimation.plan.md` | US-011 | Technical estimation with narrative justification + team calibration |
| `architecture-lens.plan.md` | US-012 | C4 Context + Container + sequence diagrams from user stories |
| `backlog-health-score.plan.md` | US-013 | Active backlog quality monitor with AI Coach |
| `dor-gatekeeper.plan.md` | US-014 | Automated configurable Definition of Ready gate |
| `persona-context-engine.plan.md` | US-015 | Personas as dynamic context in story generation |
| `sprint-simulation.plan.md` | US-016 | Sprint simulation with 3 predictive scenarios |

Run `/prp-implement .claude/PRPs/plans/<name>.plan.md` to execute a plan.

## Output Format — Não Alterar

O schema JSON de saída do refinamento estratégico (`StrategicRefinementResult` → `RefinedStory[]`) está estabilizado e **não deve ser modificado**. O fluxo de adicionar histórias ao backlog depende exatamente deste contrato:

```
GeminiService.refineUserStoryStrategic()
  → StrategicRefinementResult { refinedStories: RefinedStory[] }
    → addStoryToBacklog() cria BacklogItem (RefinedStory + id + order)
      → localStorage / Supabase
```

Todos os campos de `RefinedStory` (`acceptanceCriteria`, `testScenarios`, `developmentTasks`, `riskAnalysis`, etc.) são exibidos no template `app.component.html`. Adicionar, remover ou renomear campos quebra o template e o backlog silenciosamente.

Se precisar de campos novos, **adicione-os como opcionais** (`campo?: tipo`) em `src/models/validation.model.ts` e atualize o system prompt em `gemini.service.ts` mantendo todos os campos existentes. Nunca remova campos do schema.

## Known Constraints

- `AppComponent` (`src/app.component.ts`) is 718+ lines — a God Component. When editing it, read the full file first. The template (`app.component.html`) is equally large.
- `GeminiService` is named for historical reasons — it wraps Groq, not Google Gemini.
- `marked.js` parses markdown in `markdownToHtml()` using `bypassSecurityTrustHtml` — safe only because content comes from the Groq API, not user input.
- After any Angular template or type change, run `npm run build` to catch errors that `tsc --noEmit` may miss (Angular templates are not checked by `tsc` alone).
- Dev server runs on **port 4200** (port 3000 is occupied by another local project).
- Backlog currently persists in `localStorage` only — `BacklogService` migration to Supabase is the next priority (US-001).
- Never add `console.log` — use `ToastService` (US-002) for user-facing feedback once implemented.
- New fields in `RefinedStory` must always be optional (`campo?: tipo`) — removing or renaming existing fields silently breaks the backlog and template.

## ECC Rules

`.claude/rules/ecc/` contains active coding rules:
- `common/` — coding style, git, testing, security
- `angular/` — signals, OnPush, `inject()`, standalone, forms
- `typescript/` — explicit types, no `any`
- `web/` — performance, CSP, design quality
