# Plan: Cloud Persistence — Supabase Backlog Sync

## Summary

Migra o armazenamento de backlogs de `localStorage` para uma tabela `backlogs` no Supabase, criando um `BacklogService` que centraliza todo o CRUD de backlogs e garante isolamento por usuário via Row Level Security. Remove chamadas diretas a `localStorage` de `DashboardComponent` e `AppComponent`, habilitando sync multi-dispositivo e eliminando risco de perda de dados.

## User Story

Como um Product Owner,  
Quero que meus projetos e backlogs sejam salvos na nuvem,  
Para que eu possa acessá-los de qualquer dispositivo sem risco de perda de dados.

## Problem → Solution

`localStorage` sem isolamento por usuário → Supabase `backlogs` com RLS por `user_id`, abstraído por um `BacklogService` injetável e testável.

## Metadata

- **Complexity**: Medium
- **Source PRD**: `PRD.md` — seção 3.2 Dashboard de Projetos + TODO.md Alta Prioridade
- **PRD Phase**: N/A (TODO item standalone)
- **Estimated Files**: 5 arquivos alterados, 2 criados

---

## UX Design

### Before

```
┌────────────────────────────────────────┐
│  Dashboard                             │
│  Projetos carregados do localStorage  │
│  (device-locked, sem sync)             │
│                                        │
│  ⚠️  Limpar cache = perder tudo        │
│  ⚠️  Outro dispositivo = vazio         │
└────────────────────────────────────────┘
```

### After

```
┌────────────────────────────────────────┐
│  Dashboard                             │
│  Projetos sincronizados com Supabase  │
│  (multi-dispositivo, persistente)      │
│                                        │
│  ✅  Mesmo projeto em qualquer browser │
│  ✅  Dados protegidos por RLS          │
└────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Criar projeto | Salva em `localStorage` | Salva no Supabase | Otimista com rollback |
| Carregar projetos | `JSON.parse(localStorage.getItem(...))` | `supabase.from('backlogs').select(...)` | Async, skeleton loading |
| Adicionar história | `saveBacklogsToStorage()` | `backlogService.upsert(...)` | Debounced para evitar N writes |
| Trocar de dispositivo | Dados não aparecem | Dados aparecem imediatamente | Via Supabase auth session |
| Migração | localStorage → sem ação | Detecta dados locais, oferece migração | Uma única vez por usuário |

---

## Mandatory Reading

Arquivos que DEVEM ser lidos antes de implementar:

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/app/core/config/supabase.client.ts` | 1-8 | Padrão de criação do cliente Supabase |
| P0 | `src/app/core/services/auth.service.ts` | 1-43 | Padrão de service com signals + Supabase |
| P0 | `src/app/features/dashboard/dashboard.component.ts` | 1-81 | Todo o código de localStorage a migrar |
| P0 | `src/app.component.ts` | 137-178 | `loadBacklogsFromStorage` e `saveBacklogsToStorage` a migrar |
| P1 | `src/models/validation.model.ts` | 123-142 | Interfaces `Backlog`, `BacklogItem`, `ProjectInfo` |
| P2 | `src/app/app.routes.ts` | 1-29 | Estrutura de rotas para entender lazy loading |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Supabase JS v2 CRUD | `@supabase/supabase-js` instalado como `^2.106.2` | `supabase.from('table').select/insert/update/upsert/delete` — retorna `{ data, error }` |
| Supabase RLS | Políticas no Supabase Dashboard | `auth.uid()` disponível em políticas; anon key é pública por design |
| Angular Signals | Angular 20 nativo | `signal()`, `computed()`, `effect()` — sem RxJS necessário |

---

## Patterns to Mirror

Padrões reais do codebase. Siga exatamente.

### NAMING_CONVENTION
```typescript
// SOURCE: src/app/core/services/auth.service.ts:1-8
// Services: camelCase com sufixo .service.ts, Injectable providedIn root
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
```

### SUPABASE_CALL_PATTERN
```typescript
// SOURCE: src/app/core/services/auth.service.ts:25-29
// Sempre desestruture { error } de retornos Supabase
// Retorne { error: error?.message ?? null } nos métodos públicos
async signUp(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}
```

### SIGNAL_STATE_PATTERN
```typescript
// SOURCE: src/app/features/dashboard/dashboard.component.ts:18-23
// Signals declarados no nível da classe, sem construtor para DI
backlogs = signal<Backlog[]>([]);
showCreateInput = signal(false);
newProjectName = signal('');
errorMessage = signal<string | null>(null);
hasProjects = computed(() => this.backlogs().length > 0);
```

### INJECT_PATTERN
```typescript
// SOURCE: src/app/features/dashboard/dashboard.component.ts:15-17
// Use inject() — NUNCA constructor injection
private router = inject(Router);
private auth = inject(AuthService);
```

### COMPONENT_PATTERN
```typescript
// SOURCE: src/app/features/dashboard/dashboard.component.ts:7-14
// Standalone, OnPush, templateUrl separado
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### SUPABASE_CLIENT_PATTERN
```typescript
// SOURCE: src/app/core/config/supabase.client.ts:1-7
// Singleton exportado, usa environment
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
```

### ERROR_HANDLING_PATTERN
```typescript
// SOURCE: src/app.component.ts:393-406
// try/catch com signals: isLoading false no finally, error.set() no catch
try {
  const result = await this.geminiService.refineUserStoryStrategic(...);
  this.validationResult.set(result);
} catch (err) {
  this.error.set('Mensagem de erro amigável.');
} finally {
  this.isLoading.set(false);
}
```

---

## Supabase Schema (SQL a executar no Dashboard)

```sql
-- Executar no Supabase SQL Editor antes de implementar
CREATE TABLE IF NOT EXISTS backlogs (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name   TEXT        NOT NULL,
  items          JSONB       NOT NULL DEFAULT '[]',
  info           JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_name)
);

ALTER TABLE backlogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_backlogs"  ON backlogs FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "insert_own_backlogs"  ON backlogs FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_backlogs"  ON backlogs FOR UPDATE  USING (auth.uid() = user_id);
CREATE POLICY "delete_own_backlogs"  ON backlogs FOR DELETE  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backlogs_updated_at
  BEFORE UPDATE ON backlogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/services/backlog.service.ts` | CREATE | Centraliza CRUD de backlogs via Supabase. Remove acoplamento direto nos componentes. |
| `src/app/features/dashboard/dashboard.component.ts` | UPDATE | Substituir `localStorage.getItem/setItem` por chamadas ao `BacklogService`. |
| `src/app.component.ts` | UPDATE | Substituir `loadBacklogsFromStorage`/`saveBacklogsToStorage` por `BacklogService`. |
| `src/models/validation.model.ts` | UPDATE | Adicionar interface `BacklogRow` para tipagem da resposta Supabase. |
| `src/app/core/config/supabase.client.ts` | UPDATE | Adicionar tipagem genérica do banco com `Database` type (opcional mas recomendado). |

## NOT Building

- Realtime sync (Supabase Realtime / WebSockets) — v2 escopo, não v1
- Compartilhamento de backlog via link público — item separado do TODO
- Migração automática de dados localStorage → Supabase — será opcional, iniciada pelo usuário
- Versionamento de histórias — fora do escopo deste plano
- Offline-first com queue de sync — fora do escopo

---

## Step-by-Step Tasks

### Task 1: Adicionar interface `BacklogRow` ao modelo

- **ACTION**: Adicionar tipo que representa uma linha da tabela `backlogs` no Supabase
- **IMPLEMENT**:
  ```typescript
  // Em src/models/validation.model.ts — após a interface Backlog existente
  export interface BacklogRow {
    id: string;
    user_id: string;
    project_name: string;
    items: BacklogItem[];
    info: ProjectInfo | null;
    created_at: string;
    updated_at: string;
  }
  ```
- **MIRROR**: Padrão de interfaces em `validation.model.ts` — interfaces simples sem métodos
- **IMPORTS**: Nenhum import adicional necessário
- **GOTCHA**: `items` e `info` são JSONB no Supabase mas retornam como objetos TypeScript — o cliente Supabase v2 faz o parse automaticamente
- **VALIDATE**: `tsc --noEmit` sem erros

### Task 2: Criar `BacklogService`

- **ACTION**: Criar `src/services/backlog.service.ts` com CRUD completo via Supabase
- **IMPLEMENT**:
  ```typescript
  import { Injectable } from '@angular/core';
  import { inject } from '@angular/core';
  import { AuthService } from '../app/core/services/auth.service';
  import { supabase } from '../app/core/config/supabase.client';
  import { Backlog, BacklogItem, BacklogRow, ProjectInfo } from '../models/validation.model';

  const TABLE = 'backlogs';
  const LOCAL_KEY = 'userStoryBacklogs';

  @Injectable({ providedIn: 'root' })
  export class BacklogService {
    private auth = inject(AuthService);

    async loadAll(): Promise<Backlog[]> {
      const userId = this.auth.user()?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from(TABLE)
        .select('project_name, items, info')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as BacklogRow[]).map(row => ({
        projectName: row.project_name,
        items: row.items ?? [],
        info: row.info ?? undefined,
      }));
    }

    async create(projectName: string): Promise<void> {
      const userId = this.auth.user()?.id;
      if (!userId) throw new Error('Usuário não autenticado.');

      const { error } = await supabase.from(TABLE).insert({
        user_id: userId,
        project_name: projectName,
        items: [],
      });

      if (error) {
        if (error.code === '23505') throw new Error('Já existe um projeto com esse nome.');
        throw new Error(error.message);
      }
    }

    async save(projectName: string, items: BacklogItem[], info?: ProjectInfo): Promise<void> {
      const userId = this.auth.user()?.id;
      if (!userId) return;

      const { error } = await supabase
        .from(TABLE)
        .update({ items, info: info ?? null })
        .eq('user_id', userId)
        .eq('project_name', projectName);

      if (error) throw new Error(error.message);
    }

    async delete(projectName: string): Promise<void> {
      const userId = this.auth.user()?.id;
      if (!userId) return;

      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('project_name', projectName);

      if (error) throw new Error(error.message);
    }
  }
  ```
- **MIRROR**: `SUPABASE_CALL_PATTERN`, `INJECT_PATTERN`, `NAMING_CONVENTION`
- **IMPORTS**: `Injectable`, `inject` de `@angular/core`; `supabase` de config; interfaces de model
- **GOTCHA**: `supabase.from(TABLE).update(...)` requer `.eq('user_id', userId)` mesmo com RLS ativo — RLS é segurança no banco, mas a query ainda precisa do filtro para retornar a linha correta
- **GOTCHA**: `items` é passado como objeto JavaScript — o cliente Supabase serializa para JSONB automaticamente
- **VALIDATE**: `tsc --noEmit` sem erros; arquivo criado em `src/services/`

### Task 3: Migrar `DashboardComponent`

- **ACTION**: Substituir toda manipulação direta de `localStorage` em `DashboardComponent` por chamadas ao `BacklogService`
- **IMPLEMENT**:
  ```typescript
  // Adicionar import e injeção
  private backlogService = inject(BacklogService);
  isLoadingBacklogs = signal(false);

  // Substituir loadBacklogs():
  async ngOnInit(): Promise<void> {
    this.isLoadingBacklogs.set(true);
    try {
      const backlogs = await this.backlogService.loadAll();
      this.backlogs.set(backlogs);
    } catch {
      this.errorMessage.set('Não foi possível carregar os projetos. Tente novamente.');
    } finally {
      this.isLoadingBacklogs.set(false);
    }
  }

  // Substituir createProject():
  async createProject(): Promise<void> {
    const name = this.newProjectName().trim();
    if (!name) return;
    try {
      await this.backlogService.create(name);
      await this.ngOnInit(); // Recarrega lista
      this.router.navigate(['/project', name]);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Erro ao criar projeto.');
    }
  }
  ```
- **MIRROR**: `ERROR_HANDLING_PATTERN`, `SIGNAL_STATE_PATTERN`, `INJECT_PATTERN`
- **IMPORTS**: `BacklogService` de `../../services/backlog.service` (ajustar path relativo)
- **GOTCHA**: `ngOnInit` precisa ser `async` — Angular suporta mas não é o padrão. Alternativamente, criar método `private loadBacklogs()` async separado chamado do `ngOnInit`
- **GOTCHA**: Remover a interface `OnInit` e converter para método `ngOnInit(): void` que chama um método async interno para evitar warning do linter
- **VALIDATE**: Dashboard carrega projetos após login; criar projeto navega para `/project/:name`

### Task 4: Migrar `AppComponent`

- **ACTION**: Substituir `loadBacklogsFromStorage()` e `saveBacklogsToStorage()` em `AppComponent` por chamadas ao `BacklogService`
- **IMPLEMENT**:
  ```typescript
  // Injetar BacklogService
  private backlogService = inject(BacklogService);

  // Substituir loadBacklogsFromStorage() — chamado no constructor:
  private async loadBacklogs(): Promise<void> {
    try {
      const backlogs = await this.backlogService.loadAll();
      this.backlogs.set(backlogs);
      if (backlogs.length > 0 && !this.selectedBacklogName()) {
        this.selectedBacklogName.set(backlogs[0].projectName);
      }
    } catch {
      this.error.set('Não foi possível carregar o backlog do projeto.');
    }
  }

  // Substituir saveBacklogsToStorage():
  private async saveBacklog(projectName: string): Promise<void> {
    const backlog = this.backlogs().find(b => b.projectName === projectName);
    if (!backlog) return;
    try {
      await this.backlogService.save(backlog.projectName, backlog.items, backlog.info);
    } catch {
      this.error.set('Falha ao salvar o backlog. Verifique sua conexão.');
    }
  }
  ```
- **MIRROR**: `ERROR_HANDLING_PATTERN`, `INJECT_PATTERN`
- **IMPORTS**: `BacklogService` de `./services/backlog.service`
- **GOTCHA**: O constructor do `AppComponent` atualmente chama `this.loadBacklogsFromStorage()` sincronamente. Converter para async: remover a chamada do constructor e mover para `ngOnInit()` (que já existe)
- **GOTCHA**: `saveBacklogsToStorage()` é chamado em ~6 lugares em `AppComponent`. Cada chamada deve virar `await this.saveBacklog(selectedProjectName)` passando o nome do projeto afetado para evitar salvar todos os backlogs a cada operação
- **VALIDATE**: Adicionar história ao backlog persiste no Supabase; recarregar a página mantém os dados

### Task 5: Remover `localStorage` residual

- **ACTION**: Buscar e remover todas as referências restantes a `localStorage` em `DashboardComponent` e `AppComponent`
- **IMPLEMENT**: Após as Tasks 3 e 4, verificar se ainda há chamadas a `localStorage.getItem/setItem` e removê-las
  ```bash
  # Verificar referências residuais
  grep -n "localStorage" src/app.component.ts src/app/features/dashboard/dashboard.component.ts
  ```
- **MIRROR**: N/A — remoção de código
- **GOTCHA**: `AppComponent` tem um guard `if (typeof localStorage !== 'undefined')` para SSR-safety. Pode ser removido junto com a chamada
- **VALIDATE**: `grep -rn "localStorage" src/` retorna apenas resultados em `backlog.service.ts` (que usa como fallback) ou nenhum resultado

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `loadAll` com usuário autenticado | Supabase retorna 2 projetos | `signal` tem 2 backlogs | Não |
| `loadAll` sem usuário | `auth.user()` = null | Retorna `[]` sem chamar Supabase | Sim |
| `create` com nome duplicado | Supabase retorna error.code `23505` | Lança `Error('Já existe um projeto...')` | Sim |
| `save` com erro de rede | Supabase retorna error genérico | Lança Error com mensagem | Sim |
| `loadAll` com erro Supabase | Supabase retorna error | Lança Error com message | Sim |

> **Nota**: Testes unitários do `BacklogService` devem mockar o cliente `supabase` usando `vi.mock` (Vitest) ou `jasmine.createSpyObj`. O projeto não tem framework de testes configurado — instalar Vitest via `ng add @analogjs/vitest` ou usar Karma padrão do Angular.

### Edge Cases Checklist

- [x] Usuário não autenticado → `loadAll` retorna `[]`
- [x] Supabase offline/erro → mensagem de erro amigável no signal
- [x] Nome de projeto duplicado → erro específico sem crash
- [x] Backlog com 0 histórias → `save` com `items: []` funciona
- [x] `info` null/undefined → `save` aceita `null`
- [ ] Sessão expirada durante save → Supabase retorna 401 → tratar como "sessão inválida, faça login"
- [ ] Itens JSONB muito grandes → Supabase tem limite de 1GB por linha (irrelevante na prática)

---

## Validation Commands

### Verificar tipos TypeScript
```bash
cd projeto-po-last && npx tsc --noEmit
```
EXPECT: Zero erros de tipo

### Build de produção
```bash
cd projeto-po-last && npm run build
```
EXPECT: Build completa sem erros

### Dev server
```bash
cd projeto-po-last && npm run dev
```
EXPECT: Servidor em `http://localhost:4200` (ou 3000 conforme CLAUDE.md)

### Verificar localStorage residual
```bash
grep -rn "localStorage" src/ --include="*.ts"
```
EXPECT: Apenas em `backlog.service.ts` (se mantiver fallback) ou nenhum resultado nos componentes

### Manual Validation

- [ ] Login com conta existente → projetos aparecem no Dashboard
- [ ] Criar novo projeto → aparece na lista imediatamente
- [ ] Navegar para projeto → adicionar história → recarregar página → história persiste
- [ ] Fazer login no mesmo browser privado (dados limpos) → projetos aparecem via Supabase
- [ ] Fazer login em segundo browser → mesmo projetos aparecem (multi-dispositivo)

---

## Acceptance Criteria

- [ ] Todos os backlogs são salvos na tabela `backlogs` do Supabase
- [ ] Nenhuma chamada direta a `localStorage` em `DashboardComponent` ou `AppComponent`
- [ ] Criar projeto → persiste no Supabase
- [ ] Adicionar/remover história → persiste no Supabase
- [ ] Recarregar página → dados não se perdem
- [ ] Login em outro dispositivo → dados aparecem
- [ ] `npm run build` sem erros
- [ ] `tsc --noEmit` sem erros

## Completion Checklist

- [ ] Código segue padrão `inject()` (sem constructor injection)
- [ ] Signals usados para estado local dos componentes
- [ ] `isLoading` signal para feedback visual durante operações async
- [ ] Erros retornam mensagens em português amigáveis
- [ ] `BacklogService` tem único método por operação (KISS)
- [ ] `BacklogRow` tipado — sem `any` no retorno do Supabase
- [ ] SQL de migração documentado e executado no Supabase Dashboard
- [ ] localStorage completamente removido dos componentes
- [ ] Build verde

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `AppComponent` é God Component (718 linhas) — difícil de testar e refatorar | Alta | Médio | Plano foca APENAS na migração de storage. Não refatorar o componente neste plano. |
| Sessão Supabase expirada durante operação | Baixa | Alto | Capturar erro 401, limpar `user signal`, redirecionar para login |
| Usuário tem dados em localStorage de versão anterior | Média | Médio | Não migrar automaticamente — usuário recomeça com backlog limpo (aceitável para MVP) |
| `save()` chamado a cada operação pode causar write amplification | Média | Baixo | Debounce de 500ms em `saveBacklog()` ou upsert apenas quando backlog muda |
| RLS mal configurada expõe dados entre usuários | Baixa | Crítico | Testar manualmente com 2 contas distintas antes de fechar |

## Security Notes

- **API Key Groq exposta**: `GeminiService` usa `dangerouslyAllowBrowser: true`. Este plano NÃO corrige isso — é risco separado que requer um proxy server. Documentado para plano futuro.
- **Supabase anon key**: É pública por design; a segurança está no RLS configurado acima.
- **`bypassSecurityTrustHtml`**: Usado em `markdownToHtml` sem sanitização prévia — risco de XSS se o conteúdo vier de terceiros. Fora do escopo deste plano.

## Notes

- **Por que não manter localStorage como fallback offline?** Para manter o código simples. Offline-first com sync é complexidade desnecessária para MVP. Quando offline, o app mostrará erro amigável.
- **Por que não usar Supabase Realtime?** Realtime (WebSockets) é excelente para multi-usuário simultâneo, mas para sync entre dispositivos do mesmo usuário o simples `loadAll()` ao montar o componente é suficiente.
- **Ordem de tasks**: Tasks 1 → 2 → 3 → 4 → 5. Task 2 é bloqueante para 3 e 4.
- **SQL deve ser executado manualmente** no Supabase Dashboard antes de qualquer teste — o cliente Angular não tem permissão para criar tabelas.
