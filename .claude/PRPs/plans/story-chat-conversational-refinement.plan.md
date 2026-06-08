# Plan: Story Chat — Conversational Story Refinement

## Summary

Adiciona um painel de chat conversacional ao lado de qualquer história refinada, permitindo que o PO itere sobre a história via linguagem natural ("adicione um cenário offline", "divida essa história em duas", "torne os critérios mais estritos para segurança"). O chat usa Groq com a história completa como contexto e retorna respostas de texto OU campos atualizados da história, aplicando mudanças em tempo real no painel existente. **Este é o único recurso no mercado de ferramentas de PO que combina chat BDD-focused com atualização dinâmica de histórias.**

## User Story

Como um Product Owner,  
Quero conversar com a IA sobre uma história específica para refiná-la iterativamente,  
Para ajustar critérios de aceite, adicionar cenários e detalhar riscos sem reprocessar do zero.

## Problem → Solution

Refinamento one-shot (input → história imutável) → Chat contextual que mantém a história inteira como contexto e aplica atualizações incrementais via linguagem natural, sem reprocessar toda a história.

## Metadata

- **Complexity**: Medium-Large
- **Source PRD**: `PRD.md` seção 3.7 Ferramentas Auxiliares + pesquisa de mercado (feature nova, não está no TODO.md)
- **PRD Phase**: N/A — feature descoberta por análise de mercado
- **Estimated Files**: 7 (3 criados, 4 atualizados)

---

## Market Research Basis

**O gap confirmado pela pesquisa:**
- Linear for Agents (2025): agentes para gestão genérica — não especializado em BDD story refinement
- ClickUp Brain: Q&A no workspace — não modifica histórias iterativamente
- ProdPad/ChatPRD: geração one-shot — sem chat sobre a história gerada
- Jira AI: sumarização de sprint — não refinamento iterativo de critérios
- **Nenhum concorrente**: chat conversacional BDD-focused que atualiza campos da história em tempo real

**Tendência de mercado (2025-2026):** Shift de "IA reativa" para "IA proativa que monitora e sugere". Este feature posiciona o app na vanguarda deste movimento para o nicho de POs.

---

## UX Design

### Before

```
┌────────────────────────────────────────────────────┐
│  História Refinada                                 │
│  ┌──────────────────────────────────────────────┐ │
│  │  Título: Cadastro de usuário                 │ │
│  │  Critérios: [BDD Gherkin estático]           │ │
│  │  Riscos: [lista estática]                    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Para mudar algo: reprocessar do zero (15-30s)    │
└────────────────────────────────────────────────────┘
```

### After

```
┌────────────────────────────────────────┬────────────────────────────┐
│  História Refinada (live-updated)      │  Chat com IA               │
│  ┌──────────────────────────────────┐  │  ┌──────────────────────┐  │
│  │  Título: Cadastro de usuário     │  │  │  Você: "adicione um  │  │
│  │  Critérios: [BDD atualizado]     │  │  │  cenário offline"    │  │
│  │  [✨ novo cenário offline]       │  │  ├──────────────────────┤  │
│  │  Riscos: [lista atualizada]      │  │  │  IA: "Adicionei o    │  │
│  └──────────────────────────────────┘  │  │  Cenário: Usuário    │  │
│                                        │  │  sem conexão..."     │  │
│                                        │  ├──────────────────────┤  │
│                                        │  │  [input de mensagem] │  │
│                                        │  └──────────────────────┘  │
└────────────────────────────────────────┴────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Modificar história gerada | Reprocessar do zero (15–30s) | Chat: "adicione cenário X" → update instantâneo (3–5s) | Groq é rápido o suficiente |
| Dividir história complexa | Botão "Reprocessar" esperando nova entrada | Chat: "divida essa história em 2" → duas histórias aparecem | Resposta modifica `refinedStories` |
| Adicionar requisito técnico | Impossível sem reprocessar | Chat: "adicione consideração técnica sobre LGPD" → campo atualizado | Atualização parcial |
| Perguntar sobre a história | Sem suporte | Chat: "quais são os riscos principais?" → resposta texto | Q&A sem modificar campos |
| Histórico de refinamentos | Sem histórico | Chat mostra toda a conversa de iterações | Contexto preservado |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/services/gemini.service.ts` | 1-103 | Padrão de prompts estruturados + `generateValidation` + padrão JSON schema |
| P0 | `src/models/validation.model.ts` | 54-96 | Interface `RefinedStory` — campos que o chat pode atualizar |
| P0 | `src/app.component.ts` | 1-60, 376-406 | Estado de histórias + padrão try/catch |
| P1 | `src/services/gemini.service.ts` | 317-367 | `generateValidation` privado — base para o método de chat |
| P2 | `src/app/features/auth/login/login.component.html` | 1-59 | Padrão visual de formulário + Tailwind classes |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Groq chat completions | `groq-sdk` v1.2 instalado | `groq.chat.completions.create({ messages: [{role: 'system'}, ...history, {role: 'user'}], response_format: { type: 'json_object' } })` — history é array de mensagens |
| Groq streaming | groq-sdk v1.2 | `.stream()` disponível mas não necessário para MVP — JSON mode não suporta streaming; usar non-streaming com `response_format: json_object` |

---

## Patterns to Mirror

### SERVICE_PATTERN
```typescript
// SOURCE: src/services/gemini.service.ts:1-13
// Injectable providedIn root, campo privado groq, sem constructor DI
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private groq: Groq;
  constructor() {
    const apiKey = environment.apiKey;
    if (!apiKey) throw new Error('API key not configured...');
    this.groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
```

### GROQ_JSON_CALL_PATTERN
```typescript
// SOURCE: src/services/gemini.service.ts:191-202
// Chamada direta ao Groq (sem generateValidation) quando resposta não precisa de auto-correção
const response = await this.groq.chat.completions.create({
  model: MODEL,
  messages: [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: prompt }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.5
});
return response.choices[0].message.content?.trim() ?? '';
```

### ERROR_CATCH_PATTERN
```typescript
// SOURCE: src/app.component.ts:393-406
try {
  const result = await this.geminiService.refineUserStoryStrategic(...);
  this.validationResult.set(result);
} catch (err) {
  this.error.set('Mensagem de erro amigável.');
} finally {
  this.isLoading.set(false);
}
```

### SIGNAL_IMMUTABLE_UPDATE
```typescript
// SOURCE: src/app.component.ts:170-182
// Atualiza signal com spread — nunca mutação direta
this.backlogs.update(backlogs => {
  return backlogs.map(b =>
    b.projectName === active.projectName
      ? { ...b, items: [...b.items, newBacklogItem] }
      : b
  );
});
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

### INJECT_PATTERN
```typescript
// SOURCE: src/app/features/auth/login/login.component.ts:14
private auth = inject(AuthService);
```

---

## New Types to Add

```typescript
// Adicionar em src/models/validation.model.ts

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface StoryUpdatePayload {
  updatedFields?: Partial<Pick<RefinedStory,
    | 'acceptanceCriteria'
    | 'acceptanceCriteriaSummary'
    | 'potentialEdgeCases'
    | 'technicalConsiderations'
    | 'identifiedDependencies'
    | 'riskAnalysis'
    | 'questions'
    | 'testScenarios'
    | 'developmentTasks'
    | 'storyEstimate'
    | 'tasksTotalEstimate'
    | 'userPersona'
    | 'businessNarrative'
  >>;
  reply: string;
  splitIntoStories?: RefinedStory[];
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/models/validation.model.ts` | UPDATE | Adicionar `ChatMessage` e `StoryUpdatePayload` |
| `src/services/gemini.service.ts` | UPDATE | Novo método `chatWithStory()` |
| `src/components/story-chat/story-chat.component.ts` | CREATE | Componente de chat com painel de mensagens |
| `src/components/story-chat/story-chat.component.html` | CREATE | Template: input + histórico de mensagens |
| `src/app.component.ts` | UPDATE | Integrar `StoryChatComponent`, gerenciar estado do chat |

## NOT Building

- Persistência do histórico de chat em banco de dados — chat é sessão; ao recarregar, histórico é limpo
- Chat em múltiplas histórias simultaneamente — uma história por vez
- Streaming de resposta (SSE/WebSocket) — Groq JSON mode não suporta streaming; MVP usa response completo
- Divisão automática de histórias no backlog via chat — apenas exibe as sub-histórias sugeridas, o PO decide se adiciona
- Multi-turn context window management — Groq Llama 3.3 70B tem 128k tokens; para MVP, enviar todo o histórico

---

## Step-by-Step Tasks

### Task 1: Adicionar tipos `ChatMessage` e `StoryUpdatePayload`

- **ACTION**: Adicionar as duas interfaces no final de `src/models/validation.model.ts`
- **IMPLEMENT**: (código acima na seção "New Types to Add")
- **MIRROR**: Padrão de interfaces em `validation.model.ts` — interfaces simples sem métodos, campos tipados explicitamente
- **IMPORTS**: Nenhum — usa apenas tipos já existentes (`RefinedStory`, etc.)
- **GOTCHA**: `Partial<Pick<RefinedStory, ...>>` — só incluir os campos que o chat pode modificar. NÃO incluir `title` ou `epicSuggestion` para forçar o PO a reprocessar se quiser mudar o título
- **VALIDATE**: `tsc --noEmit` sem erros

### Task 2: Criar método `chatWithStory` no `GeminiService`

- **ACTION**: Adicionar método público que aceita story, histórico de chat e mensagem do usuário, retornando reply + campos atualizados opcionais
- **IMPLEMENT**:
  ```typescript
  // src/services/gemini.service.ts — adicionar após generateProjectDocument
  async chatWithStory(
    story: RefinedStory,
    history: ChatMessage[],
    userMessage: string
  ): Promise<StoryUpdatePayload> {
    const systemInstruction = `
      Você é um assistente especialista em Product Management e BDD conversacional.
      Você está analisando e refinando uma User Story específica com o Product Owner.

      **CONTEXTO DA HISTÓRIA ATUAL:**
      Título: ${story.title}
      Épico: ${story.epicSuggestion}
      Feature: ${story.featureSuggestion}
      Persona: ${story.userPersona}
      Narrativa: ${story.businessNarrative}

      Critérios de Aceite (BDD):
      ${story.acceptanceCriteria}

      Casos Extremos: ${story.potentialEdgeCases.join(', ')}
      Considerações Técnicas: ${story.technicalConsiderations.join(', ')}
      Dependências: ${story.identifiedDependencies.join(', ')}
      Estimativa: ${story.storyEstimate}

      **REGRAS:**
      1. Responda sempre em português.
      2. Se a mensagem é uma PERGUNTA sobre a história, retorne apenas { "reply": "sua resposta", "updatedFields": null }.
      3. Se a mensagem é um PEDIDO DE MODIFICAÇÃO, aplique a mudança e retorne:
         { "reply": "descrição do que foi alterado", "updatedFields": { ...campos modificados... } }
      4. Se solicitado DIVIDIR a história em duas, retorne:
         { "reply": "divisão sugerida", "splitIntoStories": [ {...história1...}, {...história2...} ] }
      5. Mantenha SEMPRE o formato Gherkin nos critérios de aceite.
      6. Palavras-chave BDD em negrito (**Dado**, **Quando**, **Então**, **E**).
      7. Responda APENAS com JSON válido, sem markdown fences.

      **JSON SCHEMA:**
      {
        "reply": "string (obrigatório — mensagem ao usuário em português)",
        "updatedFields": { ...campos opcionais conforme necessário... } | null,
        "splitIntoStories": [ ...array de RefinedStory opcionais se divisão foi pedida... ] | null
      }
    `;

    const groqHistory = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    try {
      const response = await this.groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          ...groqHistory,
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const raw = response.choices[0].message.content?.trim() ?? '{}';
      return JSON.parse(raw) as StoryUpdatePayload;
    } catch (error) {
      throw new Error('Falha ao processar a mensagem. Tente novamente.');
    }
  }
  ```
- **MIRROR**: `GROQ_JSON_CALL_PATTERN`, `SERVICE_PATTERN`
- **IMPORTS**: `ChatMessage`, `StoryUpdatePayload` de `../models/validation.model`
- **GOTCHA**: `history.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))` — Groq aceita exatamente esses dois roles. `assistant` é o role para mensagens anteriores da IA
- **GOTCHA**: O system prompt inclui a história COMPLETA — isso consome tokens mas garante contexto preciso. Para histórias grandes, a soma pode aproximar 4k tokens do system prompt. Groq Llama 3.3 70B tem 128k de contexto — seguro
- **VALIDATE**: Testar chamada direta com uma história simples e mensagem "adicione um cenário de erro 404" — verificar que retorna `{ reply: "...", updatedFields: { acceptanceCriteria: "..." } }`

### Task 3: Criar `StoryChatComponent`

- **ACTION**: Criar componente standalone com painel de chat + histórico de mensagens
- **IMPLEMENT**:
  ```typescript
  // src/components/story-chat/story-chat.component.ts
  import { Component, signal, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { GeminiService } from '../../services/gemini.service';
  import { RefinedStory, ChatMessage, StoryUpdatePayload } from '../../models/validation.model';

  @Component({
    selector: 'app-story-chat',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './story-chat.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class StoryChatComponent {
    private gemini = inject(GeminiService);

    story = input.required<RefinedStory>();
    storyUpdated = output<StoryUpdatePayload>();

    messages = signal<ChatMessage[]>([]);
    currentMessage = signal('');
    isLoading = signal(false);
    error = signal<string | null>(null);

    readonly SUGGESTIONS = [
      'Adicione um cenário para usuário sem conexão',
      'Torne os critérios de segurança mais estritos',
      'Divida essa história em 2 histórias menores',
      'Quais são os principais riscos técnicos?',
    ];

    async sendMessage(): Promise<void> {
      const msg = this.currentMessage().trim();
      if (!msg || this.isLoading()) return;

      const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: Date.now() };
      this.messages.update(list => [...list, userMsg]);
      this.currentMessage.set('');
      this.isLoading.set(true);
      this.error.set(null);

      try {
        const payload = await this.gemini.chatWithStory(
          this.story(),
          this.messages().slice(0, -1), // histórico sem a mensagem atual
          msg
        );

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: payload.reply,
          timestamp: Date.now()
        };
        this.messages.update(list => [...list, assistantMsg]);

        if (payload.updatedFields || payload.splitIntoStories) {
          this.storyUpdated.emit(payload);
        }
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : 'Erro ao processar mensagem.');
        this.messages.update(list => list.slice(0, -1)); // remove mensagem do user se falhou
      } finally {
        this.isLoading.set(false);
      }
    }

    useSuggestion(suggestion: string): void {
      this.currentMessage.set(suggestion);
    }

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    }
  }
  ```

  ```html
  <!-- src/components/story-chat/story-chat.component.html -->
  <div class="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
      <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      <span class="text-sm font-medium text-gray-300">Chat com IA — refinamento iterativo</span>
    </div>

    <!-- Sugestões rápidas (apenas quando sem mensagens) -->
    @if (messages().length === 0) {
      <div class="px-4 py-3 space-y-2">
        <p class="text-xs text-gray-500">Sugestões:</p>
        @for (suggestion of SUGGESTIONS; track suggestion) {
          <button
            (click)="useSuggestion(suggestion)"
            class="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition"
          >
            {{ suggestion }}
          </button>
        }
      </div>
    }

    <!-- Histórico de mensagens -->
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
      @for (msg of messages(); track msg.timestamp) {
        <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
          <div
            class="max-w-[85%] px-3 py-2 rounded-lg text-sm"
            [class]="msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-800 text-gray-200 rounded-bl-sm'"
          >
            {{ msg.content }}
          </div>
        </div>
      }
      @if (isLoading()) {
        <div class="flex justify-start">
          <div class="bg-gray-800 px-3 py-2 rounded-lg rounded-bl-sm">
            <div class="flex gap-1">
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Erro -->
    @if (error()) {
      <div class="px-4 py-2 text-xs text-red-400 bg-red-950 border-t border-red-900">
        {{ error() }}
      </div>
    }

    <!-- Input -->
    <div class="px-4 py-3 border-t border-gray-800">
      <div class="flex gap-2">
        <textarea
          [ngModel]="currentMessage()"
          (ngModelChange)="currentMessage.set($event)"
          (keydown)="onKeydown($event)"
          name="chatMessage"
          placeholder="Refine esta história... (Enter para enviar)"
          rows="2"
          class="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
        ></textarea>
        <button
          (click)="sendMessage()"
          [disabled]="isLoading() || !currentMessage().trim()"
          class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition self-end"
        >
          ↑
        </button>
      </div>
    </div>
  </div>
  ```
- **MIRROR**: `COMPONENT_PATTERN`, `INJECT_PATTERN`, `SIGNAL_IMMUTABLE_UPDATE`
- **IMPORTS**: `Component`, `signal`, `input`, `output`, `inject`, `ChangeDetectionStrategy` de `@angular/core`; `FormsModule` de `@angular/forms`
- **GOTCHA**: `input.required<RefinedStory>()` é a API moderna de Angular 17+ para inputs — sem `@Input()`. O `output<StoryUpdatePayload>()` é o equivalente moderno de `@Output() EventEmitter`
- **GOTCHA**: `min-h-0` na div de histórico é necessário em layouts flex para que `overflow-y-auto` funcione corretamente — sem isso, o div cresce infinitamente
- **VALIDATE**: Componente renderiza sem erros; sugestões rápidas aparecem quando sem mensagens; Enter envia mensagem

### Task 4: Integrar `StoryChatComponent` no `AppComponent`

- **ACTION**: Ler o template `app.component.html`, localizar a seção onde as histórias são exibidas, e adicionar o painel de chat ao lado de cada história (layout side-by-side em telas largas)
- **IMPLEMENT**:
  ```typescript
  // src/app.component.ts — adicionar import e estado de chat
  import { StoryChatComponent } from './components/story-chat/story-chat.component';
  // Nos imports do @Component: [..., StoryChatComponent]

  // Estado do chat — um histórico por story index
  chatOpenForStory = signal<number | null>(null);

  toggleChat(storyIndex: number): void {
    this.chatOpenForStory.update(current =>
      current === storyIndex ? null : storyIndex
    );
  }

  applyStoryUpdate(storyIndex: number, payload: StoryUpdatePayload): void {
    this.validationResult.update(currentResult => {
      if (!currentResult || currentResult.validationType !== 'strategic') return currentResult;
      const stories = [...currentResult.refinedStories];
      const current = stories[storyIndex];

      if (payload.updatedFields) {
        stories[storyIndex] = { ...current, ...payload.updatedFields };
      }
      // Se o chat sugeriu divisão, apenas exibir aviso (PO decide se adiciona ao backlog)
      return { ...currentResult, refinedStories: stories };
    });
  }
  ```

  ```html
  <!-- Em app.component.html — no loop de stories, após o card da história -->
  <!-- Botão de toggle para o chat -->
  <button
    (click)="toggleChat(storyIndex)"
    class="mt-3 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
  >
    <span>{{ chatOpenForStory() === storyIndex ? '✕ Fechar' : '💬 Refinar via Chat' }}</span>
  </button>

  <!-- Painel de chat -->
  @if (chatOpenForStory() === storyIndex) {
    <div class="mt-3 h-96">
      <app-story-chat
        [story]="story"
        (storyUpdated)="applyStoryUpdate(storyIndex, $event)"
      />
    </div>
  }
  ```
- **MIRROR**: `SIGNAL_IMMUTABLE_UPDATE`, `TEMPLATE_BLOCK_SYNTAX`
- **IMPORTS**: `StoryChatComponent` de `./components/story-chat/story-chat.component`; `StoryUpdatePayload` de `./models/validation.model`
- **GOTCHA**: **LEIA `app.component.html` antes de editar** — o template tem ~700 linhas. Localizar exatamente onde o loop de `result.refinedStories` renderiza cada story card e inserir o botão + painel APÓS o card existente
- **GOTCHA**: `chatOpenForStory` é um único signal (número do índice), não um objeto por story — simplifica o estado mas significa que apenas um chat fica aberto por vez (comportamento desejado)
- **VALIDATE**: Botão "Refinar via Chat" aparece sob cada história; clicar abre/fecha o painel; mensagem modifica a história em tempo real

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `chatWithStory` — pergunta | mensagem "Quais são os riscos?" | `{ reply: "Os riscos são...", updatedFields: null }` | Não |
| `chatWithStory` — atualização | mensagem "adicione cenário offline" | `{ reply: "Adicionei...", updatedFields: { acceptanceCriteria: "..." } }` | Não |
| `chatWithStory` — divisão | mensagem "divida em 2 histórias" | `{ reply: "...", splitIntoStories: [story1, story2] }` | Sim |
| `applyStoryUpdate` com `updatedFields` | payload com `acceptanceCriteria` atualizado | signal `validationResult` atualizado com novos critérios | Não |
| `applyStoryUpdate` com `updatedFields: null` | payload apenas com `reply` | signal `validationResult` inalterado | Sim |
| `StoryChatComponent.sendMessage` — vazio | mensagem vazia | Sem chamada à IA | Sim |
| `StoryChatComponent.onKeydown` Enter | keydown Enter (não Shift) | Chama `sendMessage()` | Não |
| `StoryChatComponent.onKeydown` Shift+Enter | keydown Shift+Enter | NÃO chama `sendMessage()` | Sim |

### Edge Cases Checklist

- [x] Mensagem vazia → não envia
- [x] Duplo-clique em enviar → `isLoading()` bloqueia segunda chamada
- [x] IA retorna JSON sem `updatedFields` → story não é modificada
- [x] IA retorna `splitIntoStories` → aviso exibido, sem adição automática ao backlog
- [x] Story com critérios muito longos → system prompt excede? Verificar: Llama 3.3 tem 128k tokens
- [x] Histórico de chat longo (50+ msgs) → ainda funciona? Sim, 128k é suficiente para MVP
- [ ] IA retorna JSON malformado → JSON.parse falha → catch mostra erro amigável

---

## Validation Commands

### TypeScript check
```bash
cd projeto-po-last && npx tsc --noEmit
```
EXPECT: Zero erros — especialmente `input.required` e `output` (Angular 17+ signal inputs)

### Build de produção
```bash
cd projeto-po-last && npm run build
```
EXPECT: Build completa

### Dev server
```bash
cd projeto-po-last && npm run dev
```
EXPECT: Servidor em http://localhost:3000

### Verificar signal inputs (Angular 20)
```bash
grep -rn "input.required\|output<" src/components/story-chat/
```
EXPECT: `input.required<RefinedStory>()` e `output<StoryUpdatePayload>()` presentes

### Manual Validation

- [ ] Abrir uma história refinada → botão "💬 Refinar via Chat" aparece abaixo
- [ ] Clicar no botão → painel de chat abre à direita da história
- [ ] Clicar em sugestão "Adicione um cenário para usuário sem conexão" → preenche input
- [ ] Enviar mensagem → loading indicator (3 dots animados) → resposta da IA aparece
- [ ] Resposta com `updatedFields.acceptanceCriteria` → critérios no card da história atualizam em tempo real
- [ ] Enter sem Shift envia; Shift+Enter cria quebra de linha
- [ ] "Divida em 2 histórias" → IA responde descrevendo a divisão (sem adicionar automaticamente)
- [ ] Clicar "✕ Fechar" → painel fecha, histórico é limpo

---

## Acceptance Criteria

- [ ] Botão "Refinar via Chat" visível sob cada história refinada
- [ ] Chat abre/fecha corretamente com toggle
- [ ] Mensagens de texto aparecem no histórico (user + assistant)
- [ ] Campos da história atualizam em tempo real quando IA retorna `updatedFields`
- [ ] Enter envia, Shift+Enter quebra linha
- [ ] `tsc --noEmit` sem erros
- [ ] `npm run build` sem erros

## Completion Checklist

- [ ] `input.required<T>()` usado em vez de `@Input()` (Angular 20 pattern)
- [ ] `output<T>()` usado em vez de `@Output() EventEmitter` (Angular 20 pattern)
- [ ] `inject()` em vez de constructor DI
- [ ] Signals com spread para imutabilidade (`{ ...current, ...payload.updatedFields }`)
- [ ] `isLoading` bloqueia envio duplo
- [ ] Erros mostrados inline no chat (não no toast global)
- [ ] Chat fechado ao reprocessar a história principal (evitar estado stale)
- [ ] Template usa `@if` e `@for` (block syntax Angular 17+)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `app.component.html` não lido — template pode ter estrutura diferente | Alta | Médio | **OBRIGATÓRIO: Ler `app.component.html` antes da Task 4** |
| IA retorna `updatedFields` com campos extras não tipados | Média | Baixo | `{ ...current, ...payload.updatedFields }` — campos extras são ignorados pelo TypeScript strict |
| System prompt com história longa excede latência aceitável | Baixa | Baixo | Llama 3.3 70B processa 4k tokens de contexto em ~2s no Groq |
| `input.required` não disponível em versão Angular instalada | Baixa | Alto | Verificar: `@angular/core: ^20.3.0` — `input.required` disponível desde v17.1 |
| Chat stale após reprocessar história principal | Alta | Médio | Fechar chat (reset `chatOpenForStory.set(null)`) ao chamar `validateStory()` |

## Notes

- **Por que não persistir histórico de chat?** Chat é uma sessão de trabalho temporária. POs não voltam a revisar conversas antigas — o que importa é o resultado (história atualizada), não o processo. Adicionar persistência aumentaria complexidade sem retorno claro.
- **Por que `h-96` fixo no painel?** Altura fixa garante que o painel não empurre o conteúdo abaixo. Em telas pequenas pode scroll o painel. Alternativa: `min-h-64 max-h-96 resize-y` se desejar redimensionamento.
- **Por que não usar o painel de chat como substituição do refinamento one-shot?** O chat É complementar, não substituto. O one-shot gera a história base em ~20s. O chat refina incrementalmente em ~3s. São dois modos de uso diferentes.
- **Feature que nenhum concorrente tem:** A combinação de (a) output BDD Gherkin estruturado + (b) chat iterativo que modifica campos específicos da história é única no mercado de tools para PO em 2026.

## Market Differentiation

| Concorrente | Geração de Story | Chat sobre a Story | BDD Output | Update incremental |
|---|---|---|---|---|
| Linear | ✅ (básico) | ❌ | ❌ | ❌ |
| Jira AI | ✅ (básico) | ❌ | ❌ | ❌ |
| ClickUp Brain | ✅ (hallucina) | ✅ (workspace Q&A) | ❌ | ❌ |
| ProdPad | ✅ | ❌ | ❌ | ❌ |
| **Este app** | **✅ (BDD completo)** | **✅ (novo)** | **✅** | **✅ (novo)** |
