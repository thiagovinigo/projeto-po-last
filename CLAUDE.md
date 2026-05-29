# CLAUDE.md — PO Agent AI

## Projeto

**PO Agent AI** — ferramenta web Angular para Product Owners refinarem histórias de usuário, gerar backlog estruturado e exportar documentos de produto, usando Groq (Llama 3.3 70B) como motor de IA.

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

## Estrutura de Arquivos

```
src/
├── app.component.ts/html        # View principal: analyzer + backlog + import
├── shell.component.ts           # Shell com router-outlet
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
│   ├── gemini.service.ts        # Cliente Groq (renomeado por compatibilidade)
│   ├── document.service.ts      # Parse de PDF/Word
│   └── document-export.service.ts # Exportação de PRD/spec/markdown
├── models/validation.model.ts   # Todos os tipos TypeScript
└── environments/
    ├── environment.ts           # Dev (apiKey Groq + Supabase)
    └── environment.prod.ts      # Prod
```

## Rotas

| Rota | Componente | Auth |
|------|-----------|------|
| `/login` | LoginComponent | pública |
| `/register` | RegisterComponent | pública |
| `/` | DashboardComponent | protegida |
| `/project/:name` | AppComponent | protegida |

## Como Rodar Localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

A API key do Groq está em `src/environments/environment.ts` (`apiKey`). Não commitar com chave real — usar `.env.local` ou substituir localmente.

## Comandos Úteis

```bash
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção
npm run preview    # preview do build de produção
```

## Convenções de Código

- **Componentes**: standalone, `ChangeDetectionStrategy.OnPush`, `inject()` (sem constructor injection)
- **Estado**: Signals (`signal`, `computed`, `effect`)
- **Formulários**: Template-driven com FormsModule (projeto usa `ngModel`)
- **Serviços**: `providedIn: 'root'`, lógica de negócio fora dos componentes
- **Tipos**: todos em `src/models/validation.model.ts`
- **Imutabilidade**: usar spread `{...obj}` ao atualizar estado

## Padrões IA (GeminiService → Groq)

- Todas as chamadas de IA passam por `src/services/gemini.service.ts`
- Respostas estruturadas: `response_format: { type: 'json_object' }`
- Schema descrito no system prompt (não via API nativa)
- Auto-correção de JSON em caso de falha de parse
- Modelo único: `llama-3.3-70b-versatile` (constante `MODEL`)

## Segurança

- API key nunca deve ser commitada no `angular.json` (usar placeholder `__GROQ_API_KEY__`)
- Chaves reais ficam em `src/environments/environment.ts` (gitignored via `.env.local`)
- Supabase anon key é pública por design (RLS no banco)
- Auth guard protege todas as rotas de produto

## Regras ECC Instaladas

`.claude/rules/ecc/` contém:
- `common/` — coding style, git workflow, testing, security
- `angular/` — signals, OnPush, inject(), standalone, forms
- `typescript/` — tipos explícitos, sem `any`, Zod
- `web/` — performance, CSP, animações, design quality
