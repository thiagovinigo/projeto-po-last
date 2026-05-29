# Plan: Autenticação + Roteamento Base

**Source PRD**: .claude/prds/po-agent-auth-projects.prd.md
**Selected Milestone**: 1 — Autenticação
**Complexity**: Medium

## Summary

Introduzir autenticação (cadastro + login) e Angular Router no projeto, sem quebrar o validador existente. A decisão de backend recomendada é **Supabase** — resolve auth + PostgreSQL em uma única integração, sem servidor próprio. O `AppComponent` atual (~690 linhas, view via signal) será encapsulado como rota protegida enquanto se introduz estrutura de roteamento e componentes de auth.

## Decisão Recomendada de Backend

**Supabase** (recomendado):
- Auth pronto (email/senha, sessão persistida, refresh automático)
- PostgreSQL gerenciado (base para milestones 2–5)
- Row Level Security — dados de cada usuário isolados por padrão
- SDK Angular/TS oficial (`@supabase/supabase-js`)
- Chave `anon` é pública por design — segura com RLS ativa

Alternativa: backend NestJS + PostgreSQL + JWT — mais controle, mais trabalho.

## Padrões a Espelhar

| Category | Source | Pattern |
|---|---|---|
| Services | `src/services/gemini.service.ts` | `@Injectable({ providedIn: 'root' })`, métodos `async`, retorno `Promise` |
| State | `src/app.component.ts` | `signal()` para estado local, `computed()` para derivados |
| Components | `src/app.component.ts` | `standalone: true`, `changeDetection: ChangeDetectionStrategy.OnPush` |
| Bootstrap | `index.tsx` | `providers: []` em `bootstrapApplication` |
| Naming | `src/services/` | `camelCase` + sufixo `Service`; arquivos `kebab-case.service.ts` |

## Arquivos a Criar / Alterar

| File | Action | Why |
|---|---|---|
| `src/environments/environment.ts` | CREATE | Variáveis de ambiente (Supabase URL, anon key, Groq key) |
| `src/environments/environment.prod.ts` | CREATE | Variáveis de produção |
| `src/app/core/config/supabase.client.ts` | CREATE | Singleton do cliente Supabase |
| `src/app/core/services/auth.service.ts` | CREATE | signIn, signUp, signOut, session signal |
| `src/app/core/guards/auth.guard.ts` | CREATE | Redireciona para /login se não autenticado |
| `src/app/features/auth/login/login.component.ts` | CREATE | Formulário de login |
| `src/app/features/auth/login/login.component.html` | CREATE | UI de login |
| `src/app/features/auth/register/register.component.ts` | CREATE | Formulário de cadastro |
| `src/app/features/auth/register/register.component.html` | CREATE | UI de cadastro |
| `src/app/app.routes.ts` | CREATE | Definição de rotas da aplicação |
| `index.tsx` | UPDATE | Adicionar `provideRouter(routes)` nos providers |
| `src/app.component.ts` | UPDATE | Adicionar `<router-outlet>`, remover lógica de view (mover para rota filha) |
| `angular.json` | UPDATE | Remover API key hardcoded; usar `process.env` via `fileReplacements` |

## Estrutura de Rotas

```
/login               → LoginComponent (público)
/register            → RegisterComponent (público)
/                    → AppComponent atual (protegido por AuthGuard)
  → Preserva fluxo existente: welcome → analyzer → import
```

## Tasks

### Task 1: Instalar Supabase e configurar ambiente

- **Action**: `npm install @supabase/supabase-js`; criar `src/environments/environment.ts` com `supabaseUrl`, `supabaseAnonKey`, `apiKey`; remover API key do `angular.json`
- **Mirror**: Padrão de variáveis de ambiente Angular com `fileReplacements` em `angular.json`
- **Validate**: `ng build --configuration=production` compila sem erro; API key não aparece mais em `angular.json`

### Task 2: Criar cliente Supabase

- **Action**: `src/app/core/config/supabase.client.ts` exporta `createClient(environment.supabaseUrl, environment.supabaseAnonKey)` como singleton
- **Mirror**: Injeção via `providedIn: 'root'` — mesmo padrão de `GeminiService`
- **Validate**: Import do cliente funciona sem erro de compilação

### Task 3: Criar AuthService

- **Action**: `auth.service.ts` com signals `user = signal<User | null>(null)` e `isAuthenticated = computed(() => !!user())`, métodos `signIn(email, password)`, `signUp(email, password)`, `signOut()`, e `initSession()` que restaura sessão ao carregar
- **Mirror**: `@Injectable({ providedIn: 'root' })`, `async/Promise`, mesmo padrão de `GeminiService`
- **Validate**: `ng build` sem erros de tipo; `initSession()` chamado no `APP_INITIALIZER`

### Task 4: Criar AuthGuard

- **Action**: `auth.guard.ts` — `CanActivateFn` que verifica `authService.isAuthenticated()`; redireciona para `/login` se falso
- **Mirror**: Functional guard (Angular 20 — sem classe)
- **Validate**: Acessar `/` sem login redireciona para `/login`

### Task 5: Configurar Angular Router

- **Action**: `app.routes.ts` com rotas `/login` (LoginComponent), `/register` (RegisterComponent), `/` (AppComponent atual, canActivate: [authGuard]); adicionar `provideRouter(routes)` em `index.tsx`
- **Mirror**: Bootstrap em `index.tsx` segue padrão atual de `providers: []`
- **Validate**: `ng serve`; navegação entre `/login` e `/register` funciona; `/` redireciona para login sem sessão

### Task 6: Criar LoginComponent

- **Action**: Formulário email + senha com `FormsModule` (`ngModel`); chama `authService.signIn()`; redireciona para `/` no sucesso; exibe erro inline no falha; link para `/register`
- **Mirror**: `standalone: true`, `OnPush`, signals para estado de loading/error
- **Validate**: Login com credenciais válidas → navega para `/`; credenciais inválidas → erro visível; sem reload de página

### Task 7: Criar RegisterComponent

- **Action**: Formulário email + senha + confirmação de senha; validação de match client-side; chama `authService.signUp()`; redireciona para `/login` no sucesso com mensagem de confirmação
- **Mirror**: Mesmo padrão do LoginComponent
- **Validate**: Cadastro com email novo → redireciona para login; senhas diferentes → erro sem chamar API

### Task 8: Atualizar AppComponent para suportar router-outlet

- **Action**: Adicionar `<router-outlet>` no `app.component.html`; mover o conteúdo atual (welcome/analyzer/import) para um componente separado `src/app/features/main/main.component.ts` que será a rota `/`; manter toda lógica existente intacta
- **Mirror**: Manter `standalone: true`, `OnPush`, signals — não quebrar nada existente
- **Validate**: Fluxo de validação de histórias continua funcionando após refatoração

## Validation

```bash
# Build sem erros
ng build

# Servir e verificar rotas
ng serve
# Abrir http://localhost:3000/login → deve mostrar formulário de login
# Abrir http://localhost:3000/ sem login → deve redirecionar para /login
# Criar conta → confirmar no Supabase Dashboard → logar → acessar /
# Recarregar página em / autenticado → sessão deve persistir
```

## Segurança — Ação Imediata

> **CRÍTICO**: A API key do Groq (`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`) está hardcoded em `angular.json`. Deve ser rotacionada e movida para variável de ambiente antes do próximo commit em branch compartilhada.

Ação: Revogar a key no painel Groq, gerar nova, colocar em `.env` local (gitignored).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Supabase não confirmado como escolha | Alta | Plano assume Supabase; se mudar, Tasks 1–3 mudam — resto do plano permanece válido |
| Refatoração do AppComponent quebra validador | Média | Task 8 é a última; validar fluxo completo antes de marcar milestone como done |
| API key hardcoded vazar em histórico git | Alta | Revogar imediatamente; adicionar `.env` ao `.gitignore` antes de qualquer push |

## Acceptance

- [ ] Usuário consegue criar conta com email + senha
- [ ] Usuário consegue logar com credenciais criadas
- [ ] Sessão persiste após reload da página
- [ ] `/` inacessível sem autenticação (redireciona para `/login`)
- [ ] Fluxo de validação de histórias existente continua funcionando
- [ ] API key do Groq não está mais hardcoded em nenhum arquivo commitado
- [ ] `ng build` sem erros
