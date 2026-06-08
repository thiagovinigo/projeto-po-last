# Plan: Error Handling + Loading States

## Summary

Substitui mensagens de erro genéricas por notificações tipificadas e acionáveis, implementa um `ToastService` centralizado para feedback não-bloqueante, e adiciona skeleton loaders para operações de IA (15–30s) e carregamento do dashboard. O resultado é uma UX profissional que mantém confiança do usuário quando a API Groq falha ou fica lenta — algo que nenhum concorrente direto faz de forma específica para POs.

## User Story

Como um Product Owner,  
Quero mensagens de erro claras e feedback visual durante operações longas de IA,  
Para saber exatamente o que aconteceu e o que fazer quando algo falha.

## Problem → Solution

Spinner genérico + "Falha ao obter a validação da IA" para qualquer erro → Toast com mensagem específica por tipo de falha (quota, rede, auth) + skeleton loaders durante operações AI de 15–30s.

## Metadata

- **Complexity**: Medium
- **Source PRD**: `TODO.md` — Alta Prioridade: "Tratamento de erros" + "Loading states"
- **PRD Phase**: N/A
- **Estimated Files**: 8 arquivos (3 criados, 5 atualizados)

---

## UX Design

### Before

```
┌──────────────────────────────────────────────────┐
│  [Refinamento em andamento]                      │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Analisar História  [spinner]  Processan│    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  ❌ Falha ao obter a validação da IA.   │    │
│  │  Por favor, verifique sua chave de API  │    │
│  │  e tente novamente.                     │    │
│  └─────────────────────────────────────────┘    │
│  (mesma mensagem para quota, rede, 500, auth)   │
└──────────────────────────────────────────────────┘
```

### After

```
┌──────────────────────────────────────────────────┐
│  [Refinamento em andamento — skeleton]           │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  ████████████████████████ (título)      │    │
│  │  ████████████ (épico)                   │    │
│  │  ████████████████████████████ (persona) │    │
│  │  ...                                    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [Se falha] Toast no canto superior direito:    │
│  ┌────────────────────────────────────┐         │
│  │ ⚠️ Limite de requisições atingido  │         │
│  │ Aguarde 60s e tente novamente. [X] │         │
│  └────────────────────────────────────┘         │
└──────────────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| IA processando (15–30s) | Botão desabilitado + "Processando..." | Skeleton loader mimetizando o output | Reduz percepção de lentidão |
| Groq quota 429 | "Falha ao obter a validação da IA" | "Limite de requisições atingido. Aguarde alguns minutos." | Acionável |
| Groq key inválida 401 | "Falha ao obter a validação da IA" | "Chave de API inválida. Verifique as configurações." | Diagnóstico direto |
| Rede offline | "Falha ao obter a validação da IA" | "Sem conexão com a internet. Verifique sua rede." | Específico |
| Erro Supabase 5xx | Sem tratamento | Toast "Serviço temporariamente indisponível. Tente novamente." | Novo |
| Auth falhou | Mensagem em inglês do Supabase | Mensagem traduzida em português no campo | Profissional |
| Operação bem-sucedida | Nenhum feedback | Toast verde discreto: "Histórias adicionadas ao backlog ✓" | Confirmação positiva |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/services/gemini.service.ts` | 317-367 | `generateValidation` — onde erros Groq são capturados hoje |
| P0 | `src/app.component.ts` | 376-406 | Pattern atual de try/catch com signals |
| P0 | `src/app/core/services/auth.service.ts` | 25-42 | Pattern de retorno `{ error: string \| null }` |
| P1 | `src/app/features/auth/login/login.component.ts` | 1-29 | Signal-based form sem validação inline |
| P1 | `src/app/features/auth/login/login.component.html` | 1-59 | Template com ngModel |
| P2 | `src/models/validation.model.ts` | 1-142 | Tipos existentes para não duplicar |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Groq SDK error types | `groq-sdk` npm package (instalado v1.2.0) | `Groq.RateLimitError` (429), `Groq.AuthenticationError` (401), `Groq.InternalServerError` (500), `Groq.APIConnectionError` (rede). Todos são subclasses de `Groq.APIError` com `.status` e `.message`. |
| Angular Signals + animation | Angular 20 nativo | `@if` com `@else` em templates usa block syntax v17+. Animações de toast: CSS `transition` + `opacity/transform` |

---

## Patterns to Mirror

Padrões reais do codebase. Siga exatamente.

### SIGNAL_STATE_PATTERN
```typescript
// SOURCE: src/app.component.ts:36-37
// Signals para estado local — sem RxJS, sem BehaviorSubject
isLoading = signal<boolean>(false);
error = signal<string | null>(null);
```

### ERROR_CATCH_PATTERN
```typescript
// SOURCE: src/app.component.ts:393-406
// try/catch com signal + finally
try {
  const result = await this.geminiService.refineUserStoryStrategic(this.userStory());
  this.validationResult.set(result);
} catch (err) {
  console.error(`Error during strategic validation:`, err);
  this.error.set('Falha ao obter a validação da IA. Por favor, verifique sua chave de API e tente novamente.');
} finally {
  this.isLoading.set(false);
  this.activeValidation.set(null);
}
```

### AUTH_ERROR_RETURN_PATTERN
```typescript
// SOURCE: src/app/core/services/auth.service.ts:25-29
// Retorno { error: string | null } — não lança exceção
async signUp(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}
```

### INJECT_PATTERN
```typescript
// SOURCE: src/app/features/auth/login/login.component.ts:14
// inject() sem constructor
private auth = inject(AuthService);
```

### COMPONENT_PATTERN
```typescript
// SOURCE: src/app/features/auth/login/login.component.ts:6-12
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### TEMPLATE_BLOCK_SYNTAX
```html
<!-- SOURCE: src/app/features/auth/login/login.component.html:11-15 -->
<!-- Usa @if moderno (v17+) com block syntax -->
@if (error()) {
  <div class="mb-4 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
    {{ error() }}
  </div>
}
```

---

## Unified Discovery Table

| Category | File:Lines | Pattern | Key Snippet |
|---|---|---|---|
| Error signal | `src/app.component.ts:37` | `signal<string \| null>` | `error = signal<string \| null>(null)` |
| Loading signal | `src/app.component.ts:36` | `signal<boolean>` | `isLoading = signal<boolean>(false)` |
| Try/catch | `src/app.component.ts:393-406` | try/catch + finally | `finally { this.isLoading.set(false) }` |
| Auth error | `src/app/core/services/auth.service.ts:26-29` | retorna objeto | `return { error: error?.message ?? null }` |
| Template @if | `login.component.html:11-15` | block syntax Angular 17+ | `@if (error()) { <div>...</div> }` |
| Groq try/catch | `src/services/gemini.service.ts:334-367` | dois níveis de catch | erro inicial → auto-correção |

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/services/toast.service.ts` | CREATE | Central de notificações toast não-bloqueantes |
| `src/components/toast/toast.component.ts` | CREATE | Componente visual dos toasts (overlay) |
| `src/components/toast/toast.component.html` | CREATE | Template dos toasts com animação |
| `src/components/skeleton/story-skeleton.component.ts` | CREATE | Skeleton loader para o painel de refinamento |
| `src/services/gemini.service.ts` | UPDATE | Classificar erros Groq em vez de mensagem genérica |
| `src/app.component.ts` | UPDATE | Usar ToastService + SkeletonComponent |
| `src/app/features/auth/login/login.component.ts` | UPDATE | Traduzir erros Supabase para português |
| `src/app/features/auth/register/register.component.ts` | UPDATE | Traduzir erros Supabase para português |
| `src/shell.component.ts` | UPDATE | Renderizar `<app-toast-outlet>` globalmente |

## NOT Building

- Reactive Forms para login/register — escopo separado; este plano mantém template-driven
- Barra de progresso com % real durante IA — impossível sem streaming (a ser feito em plano futuro)
- Offline queue (enfileirar requests quando sem internet) — complexidade desnecessária para MVP
- Error boundary global (NgRx effects) — over-engineering para este stack
- Sentry / Datadog error tracking — produção, não MVP

---

## Step-by-Step Tasks

### Task 1: Criar `ToastService`

- **ACTION**: Criar serviço singleton que mantém uma lista de toasts como signal
- **IMPLEMENT**:
  ```typescript
  // src/services/toast.service.ts
  import { Injectable, signal } from '@angular/core';

  export type ToastType = 'error' | 'success' | 'warning' | 'info';

  export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
  }

  @Injectable({ providedIn: 'root' })
  export class ToastService {
    readonly toasts = signal<Toast[]>([]);

    show(message: string, type: ToastType = 'info', duration = 5000): void {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      this.toasts.update(list => [...list, { id, message, type, duration }]);
      setTimeout(() => this.dismiss(id), duration);
    }

    error(message: string): void { this.show(message, 'error', 7000); }
    success(message: string): void { this.show(message, 'success', 3000); }
    warning(message: string): void { this.show(message, 'warning', 5000); }

    dismiss(id: string): void {
      this.toasts.update(list => list.filter(t => t.id !== id));
    }
  }
  ```
- **MIRROR**: `INJECT_PATTERN`, `SIGNAL_STATE_PATTERN`
- **IMPORTS**: `Injectable`, `signal` de `@angular/core`
- **GOTCHA**: `Math.random().toString(36).slice(2)` é suficiente para IDs únicos no front-end; não usar `crypto.randomUUID()` pois não está disponível em todos os contextos
- **VALIDATE**: `tsc --noEmit` sem erros; importar em AppComponent e chamar `toastService.error('teste')` na inicialização para verificar visualmente

### Task 2: Criar `ToastComponent` (outlet global)

- **ACTION**: Criar componente que renderiza os toasts sobrepostos no canto superior direito da tela
- **IMPLEMENT**:
  ```typescript
  // src/components/toast/toast.component.ts
  import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
  import { ToastService, Toast } from '../../services/toast.service';

  @Component({
    selector: 'app-toast-outlet',
    standalone: true,
    templateUrl: './toast.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class ToastComponent {
    readonly toastService = inject(ToastService);
  }
  ```

  ```html
  <!-- src/components/toast/toast.component.html -->
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-300"
        [class]="toastClasses(toast.type)"
      >
        <span class="flex-1">{{ toast.message }}</span>
        <button
          (click)="toastService.dismiss(toast.id)"
          class="text-current opacity-60 hover:opacity-100 transition flex-shrink-0"
          aria-label="Fechar notificação"
        >✕</button>
      </div>
    }
  </div>
  ```

  ```typescript
  // Adicionar método toastClasses ao componente
  toastClasses(type: Toast['type']): string {
    const base = 'bg-gray-900 border';
    const map: Record<Toast['type'], string> = {
      error:   'border-red-700 text-red-300',
      success: 'border-green-700 text-green-300',
      warning: 'border-yellow-700 text-yellow-300',
      info:    'border-blue-700 text-blue-300',
    };
    return `${base} ${map[type]}`;
  }
  ```
- **MIRROR**: `COMPONENT_PATTERN`, `TEMPLATE_BLOCK_SYNTAX`
- **IMPORTS**: `Component`, `inject`, `ChangeDetectionStrategy` de `@angular/core`; `ToastService`, `Toast`
- **GOTCHA**: Usar `@for ... track toast.id` não `*ngFor` — projeto usa sintaxe Angular 17+ block syntax. Usar `@for` sem `@NgFor`
- **VALIDATE**: Toast aparece e desaparece após o tempo configurado; botão ✕ funciona

### Task 3: Adicionar `ToastComponent` ao `ShellComponent`

- **ACTION**: Ler e atualizar `shell.component.ts` para incluir `<app-toast-outlet>` globalmente
- **IMPLEMENT**:
  ```typescript
  // src/shell.component.ts — adicionar import e declarations
  import { ToastComponent } from './components/toast/toast.component';
  // ... no @Component imports: [..., ToastComponent]
  ```
  ```html
  <!-- No template do shell, após <router-outlet>: -->
  <app-toast-outlet />
  ```
- **MIRROR**: `COMPONENT_PATTERN`
- **GOTCHA**: Ler `shell.component.ts` antes de editar para entender o template atual
- **VALIDATE**: Toast renderizado corretamente em qualquer rota

### Task 4: Criar utilitário `classifyGroqError`

- **ACTION**: Criar função pura que classifica erros do Groq SDK em mensagens em português
- **IMPLEMENT**:
  ```typescript
  // src/services/groq-error.util.ts
  export function classifyGroqError(error: unknown): Error {
    if (error instanceof Error) {
      const status = (error as { status?: number }).status;
      const msg = error.message?.toLowerCase() ?? '';

      if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
        return new Error('Limite de requisições da IA atingido. Aguarde alguns minutos e tente novamente.');
      }
      if (status === 401 || msg.includes('invalid api key') || msg.includes('authentication')) {
        return new Error('Chave de API da IA inválida. Verifique as configurações do ambiente.');
      }
      if (status === 503 || status === 500 || msg.includes('server error') || msg.includes('overloaded')) {
        return new Error('Serviço de IA temporariamente indisponível. Tente novamente em instantes.');
      }
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch') || msg.includes('networkerror')) {
        return new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
      }
    }
    return new Error('Falha ao processar a requisição de IA. Tente novamente.');
  }
  ```
- **MIRROR**: N/A — função pura sem dependências Angular
- **IMPORTS**: Nenhum
- **GOTCHA**: O Groq SDK v1.2 usa o padrão da OpenAI SDK — `error.status` é o HTTP status code. Não usar `instanceof Groq.RateLimitError` sem verificar se o export existe no bundle — usar verificação por `.status` é mais seguro
- **VALIDATE**: Escrever testes unitários simples (ou verificar no console) para cada caso

### Task 5: Atualizar `GeminiService` para usar `classifyGroqError`

- **ACTION**: Substituir a mensagem genérica no método `generateValidation` pelo utilitário de classificação
- **IMPLEMENT**: Substituir o bloco catch em `generateValidation` (linhas 334-367):
  ```typescript
  // src/services/gemini.service.ts — adicionar import no topo
  import { classifyGroqError } from './groq-error.util';

  // No método generateValidation, substituir:
  // ANTES:
  // } catch (error) {
  //   console.error('Initial JSON parse failed. Attempting self-correction.', error);
  //   ...
  //   throw new Error('Falha ao receber uma resposta da IA.');
  // }

  // DEPOIS — no catch externo, antes do try de auto-correção:
  } catch (error) {
    if (!jsonText) {
      // Erro de chamada de API (não de parse) — classificar
      throw classifyGroqError(error);
    }
    // jsonText existe mas parse falhou — tentar auto-correção (lógica existente mantida)
    try {
      // ... lógica existente de auto-correção
    } catch (correctionError) {
      throw classifyGroqError(correctionError);
    }
  }
  ```
- **MIRROR**: `ERROR_CATCH_PATTERN`
- **IMPORTS**: `classifyGroqError` de `./groq-error.util`
- **GOTCHA**: A lógica de auto-correção JSON (second try/catch interno) DEVE ser mantida intacta — apenas o erro final deve usar `classifyGroqError`. Não remover o mecanismo de self-correction
- **VALIDATE**: Testar com chave Groq inválida — deve mostrar mensagem específica de autenticação

### Task 6: Atualizar `AppComponent` para usar `ToastService`

- **ACTION**: Substituir `this.error.set(...)` por `this.toastService.error(...)` nos métodos `validateStory`, `generateAlternativeTests`, `generateTechnicalArtifact`, `generateDetailedAC`, `generatePrd`, `generateSpec`
- **IMPLEMENT**:
  ```typescript
  // Adicionar injeção no AppComponent
  private toastService = inject(ToastService);

  // Substituir em validateStory():
  // ANTES: this.error.set('Falha ao obter a validação da IA...');
  // DEPOIS:
  } catch (err) {
    this.toastService.error(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
  }

  // Manter this.error signal para erros de formulário inline (ex: "história não pode estar vazia")
  // ToastService é para erros de rede/API; signals são para erros de validação de input
  ```
- **MIRROR**: `ERROR_CATCH_PATTERN`, `INJECT_PATTERN`
- **IMPORTS**: `ToastService` de `./services/toast.service`
- **GOTCHA**: NÃO remover completamente `this.error` signal — ainda é usado para erros de input do usuário (ex: história vazia). `ToastService` é para erros assíncronos de API/rede
- **VALIDATE**: Criar história com chave Groq inválida → toast vermelho específico aparece no canto

### Task 7: Criar `StorySkeletonComponent`

- **ACTION**: Criar skeleton loader que mimetiza o layout do painel de story refinement durante carregamento
- **IMPLEMENT**:
  ```typescript
  // src/components/skeleton/story-skeleton.component.ts
  import { Component, ChangeDetectionStrategy } from '@angular/core';

  @Component({
    selector: 'app-story-skeleton',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <div class="animate-pulse space-y-4 p-6 bg-gray-900 rounded-xl border border-gray-800">
        <!-- Título -->
        <div class="h-6 bg-gray-700 rounded w-3/4"></div>
        <!-- Épico / Feature chips -->
        <div class="flex gap-2">
          <div class="h-5 bg-gray-700 rounded-full w-24"></div>
          <div class="h-5 bg-gray-700 rounded-full w-28"></div>
        </div>
        <!-- Persona -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-700 rounded w-5/6"></div>
        </div>
        <!-- Narrativa -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-700 rounded w-4/5"></div>
          <div class="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
        <!-- Estimativa -->
        <div class="flex gap-4 pt-2">
          <div class="h-8 bg-gray-700 rounded w-20"></div>
          <div class="h-8 bg-gray-700 rounded w-28"></div>
        </div>
      </div>
    `,
  })
  export class StorySkeletonComponent {}
  ```
- **MIRROR**: `COMPONENT_PATTERN`
- **IMPORTS**: `Component`, `ChangeDetectionStrategy` de `@angular/core`
- **GOTCHA**: `animate-pulse` é uma classe Tailwind CSS — disponível via CDN (já configurado no projeto). Não precisa instalar nada adicional
- **VALIDATE**: Componente renderiza sem erros; animação pulse visível

### Task 8: Integrar `StorySkeletonComponent` no `AppComponent`

- **ACTION**: Mostrar `<app-story-skeleton>` durante `isLoading()` no painel de refinamento, em vez do simples "Processando..."
- **IMPLEMENT**:
  ```typescript
  // AppComponent — adicionar import
  import { StorySkeletonComponent } from './components/skeleton/story-skeleton.component';
  // No @Component.imports: [..., StorySkeletonComponent]
  ```
  ```html
  <!-- No template app.component.html, na seção do resultado de refinamento -->
  <!-- ANTES: o botão ficava desabilitado, sem skeleton -->
  <!-- DEPOIS: -->
  @if (isLoading() && activeValidation() === 'strategic') {
    <app-story-skeleton />
    <app-story-skeleton class="opacity-60" />
  } @else if (validationResult()) {
    <!-- resultado existente -->
  }
  ```
- **MIRROR**: `TEMPLATE_BLOCK_SYNTAX`
- **GOTCHA**: Ler o template `app.component.html` antes de editar — o arquivo não foi lido nesta sessão. Localizar a seção `@if (validationResult())` e adicionar o skeleton ANTES dela
- **VALIDATE**: Clicar em "Analisar" → skeleton aparece durante 15–30s → resultado real substitui skeleton

### Task 9: Traduzir erros Supabase em LoginComponent e RegisterComponent

- **ACTION**: Mapear as mensagens de erro em inglês do Supabase para português em `LoginComponent`
- **IMPLEMENT**:
  ```typescript
  // src/app/features/auth/login/login.component.ts
  // Substituir a linha: this.error.set(error);
  // Por:
  this.error.set(translateAuthError(error));
  ```

  ```typescript
  // src/app/core/utils/auth-error.util.ts — novo arquivo utilitário
  export function translateAuthError(error: string | null): string | null {
    if (!error) return null;
    const e = error.toLowerCase();
    if (e.includes('invalid login credentials') || e.includes('invalid email or password')) {
      return 'E-mail ou senha incorretos.';
    }
    if (e.includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
    }
    if (e.includes('user already registered') || e.includes('already been registered')) {
      return 'Este e-mail já está cadastrado. Tente fazer login.';
    }
    if (e.includes('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (e.includes('unable to validate email address')) {
      return 'E-mail inválido. Verifique o formato.';
    }
    return 'Erro de autenticação. Tente novamente.';
  }
  ```
- **MIRROR**: `ERROR_CATCH_PATTERN`
- **IMPORTS**: `translateAuthError` de `../../../core/utils/auth-error.util`
- **GOTCHA**: Aplicar o mesmo `translateAuthError` no `RegisterComponent` (mesmo padrão de error signal)
- **VALIDATE**: Tentar login com senha errada → "E-mail ou senha incorretos." em português

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `classifyGroqError` com status 429 | `Error` com `.status = 429` | Mensagem "Limite de requisições..." | Não |
| `classifyGroqError` com status 401 | `Error` com `.status = 401` | Mensagem "Chave de API inválida..." | Não |
| `classifyGroqError` com "fetch failed" | `TypeError('Failed to fetch')` | Mensagem "Sem conexão..." | Sim |
| `classifyGroqError` com erro desconhecido | `Error('unknown')` | Mensagem genérica de fallback | Sim |
| `ToastService.show()` | mensagem + tipo | Toast adicionado ao signal | Não |
| `ToastService.dismiss(id)` | id válido | Toast removido do signal | Não |
| `ToastService.dismiss(id)` | id inválido | Signal inalterado, sem crash | Sim |
| `translateAuthError('invalid login credentials')` | string em inglês | "E-mail ou senha incorretos." | Não |
| `translateAuthError(null)` | null | null | Sim |

### Edge Cases Checklist

- [x] Toast com duração 0 → não deve aparecer infinitamente (usar duration mínimo de 1000ms)
- [x] Múltiplos toasts simultâneos → aparecem empilhados sem sobreposição
- [x] Groq erro desconhecido → mensagem genérica sem crash
- [x] Rede offline durante upload de documento → mensagem específica
- [x] `classifyGroqError` com `null` ou `undefined` → não quebra
- [ ] Auto-correção JSON falha E erro de rede → erro de rede tem prioridade na mensagem

---

## Validation Commands

### TypeScript check
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
EXPECT: Servidor em `http://localhost:3000` (conforme CLAUDE.md)

### Verificar erros genéricos residuais
```bash
grep -n "Falha ao obter a validação da IA" src/app.component.ts src/services/gemini.service.ts
```
EXPECT: Nenhum resultado (todas as mensagens genéricas substituídas)

### Verificar console.log residuais (regra ECC)
```bash
grep -rn "console.error\|console.log" src/services/gemini.service.ts src/app.component.ts
```
EXPECT: Apenas `console.error` nos catch blocks com contexto claro

### Manual Validation

- [ ] Inserir história válida → skeleton aparece durante processamento AI → resultado real aparece
- [ ] Inserir chave Groq inválida → toast vermelho "Chave de API inválida..." aparece
- [ ] Desativar rede Wi-Fi e tentar → toast "Sem conexão com a internet..."
- [ ] Login com senha errada → mensagem em português no formulário
- [ ] Cadastro com e-mail já existente → "Este e-mail já está cadastrado. Tente fazer login."
- [ ] Adicionar história ao backlog → toast verde "Histórias adicionadas ao backlog ✓"
- [ ] Toast fecha sozinho após tempo configurado
- [ ] Botão ✕ no toast fecha imediatamente

---

## Acceptance Criteria

- [ ] Zero mensagens de erro em inglês visíveis ao usuário
- [ ] Skeleton aparece durante toda a operação AI (enquanto `isLoading() === true`)
- [ ] Toast específico para cada tipo de falha Groq (quota, auth, rede, server)
- [ ] Mensagens de erro de auth em português nos forms
- [ ] `npm run build` sem erros
- [ ] `tsc --noEmit` sem erros

## Completion Checklist

- [ ] `ToastService` criado e injetado via `inject()`
- [ ] `ToastComponent` adicionado ao `ShellComponent`
- [ ] `classifyGroqError` cobre os 4 tipos principais (429, 401, 5xx, rede)
- [ ] `GeminiService.generateValidation` usa `classifyGroqError` (auto-correção mantida)
- [ ] `AppComponent` usa `toastService.error()` para erros async
- [ ] `StorySkeletonComponent` visível durante `isLoading()`
- [ ] `translateAuthError` aplicado em Login E Register
- [ ] Nenhuma mensagem genérica em inglês visível ao usuário
- [ ] Padrão `inject()` em todos os novos componentes/services
- [ ] Signals usados para estado local

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `app.component.html` não foi lido — template pode ter estrutura diferente do esperado | Média | Médio | **Ler `app.component.html` antes de editar** na Task 8 (OBRIGATÓRIO) |
| `shell.component.ts` pode não ter router-outlet ou ter estrutura diferente | Média | Baixo | Ler antes de editar na Task 3 |
| Tailwind CDN pode não incluir `animate-pulse` em alguns browsers | Baixa | Baixo | Verificar no browser antes de fechar; fallback: `@keyframes pulse` manual |
| Groq SDK v1.2 pode não exportar as classes de erro por nome | Baixa | Médio | Já mitigado: `classifyGroqError` usa `(error as {status?:number}).status` em vez de `instanceof` |
| `AppComponent` tem signal `error` usado em template — remover pode quebrar template | Alta | Médio | NÃO remover `error` signal; usá-lo em paralelo com ToastService para erros inline |

## Notes

- **Por que ToastService em vez de um signal no AppComponent?** O toast precisa funcionar em QUALQUER rota (login, dashboard, project). Um signal local no AppComponent não é visível no Dashboard. O ShellComponent é o lugar certo para renderizar o outlet.
- **Por que manter `error` signal E adicionar ToastService?** `error` signal é para erros de validação inline (campo vazio, arquivo grande demais) — pertence ao componente. ToastService é para erros assíncronos de API — pertence ao shell. Separação de responsabilidades.
- **Skeleton vs progress bar**: Skeleton é mais simples de implementar, não requer events do Groq SDK (que não suporta streaming de progresso nesta versão), e reduz a percepção de lentidão melhor do que uma barra estática de % genérico.
- **Arquivo `app.component.html` não lido**: Este plano exige leitura de `app.component.html` antes da Task 8 — o template é extenso (~700+ linhas correspondentes ao componente) e não foi incluído aqui para não exceder contexto. O implementador DEVE lê-lo antes de editar.
