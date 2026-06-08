# SPEC — PO Agent AI

**Versão:** 1.1  
**Stack:** Angular 20 · Groq SDK · Supabase · TailwindCSS · pdfjs-dist · mammoth  
**Atualizado:** jun/2026

---

## 1. Arquitetura

```
Browser (Angular SPA)
│
├── Shell (/shell.component.ts)
│   └── router-outlet
│       ├── /login           → LoginComponent
│       ├── /register        → RegisterComponent
│       ├── /                → DashboardComponent  [auth guard]
│       └── /project/:name   → AppComponent        [auth guard]
│
├── Core
│   ├── AuthService          (Supabase auth, signals)
│   ├── AuthGuard            (canActivate)
│   └── supabase.client.ts   (client singleton)
│
├── Services
│   ├── GeminiService        (Groq API — chat completions JSON mode)
│   │   ├── refineUserStoryStrategic()
│   │   ├── processDocumentForBacklog()
│   │   ├── generateDetailedAcceptanceCriteria()
│   │   ├── generateAlternativeTestFormat()
│   │   ├── generateTechnicalArtifact(type: 'doc'|'c4-diagram'|'c4-container'|'sequence-diagram')
│   │   └── generateProjectDocument()
│   ├── DocumentService      (PDF → text via pdfjs, DOCX → text via mammoth)
│   └── DocumentExportService (geração e download de documentos .md)
│
└── Models
    └── validation.model.ts  (todos os tipos da aplicação)
```

---

## 2. Modelos de Dados

### RefinedStory
```typescript
interface RefinedStory {
  title: string;
  epicSuggestion: string;
  featureSuggestion: string;
  userPersona: string;           // "Como <x>, quero <y>, para <z>"
  businessNarrative: string;     // Problema → Solução → Impacto
  interfaceDetails: string;
  acceptanceCriteria: string;    // Gherkin BDD formatado
  acceptanceCriteriaSummary: string; // bullet list markdown
  testScenarios: TestScenarios;  // { e2e, integration, unit }
  storyEstimate: string;         // "12h" (= tasksTotalEstimate)
  storyEstimateJustification: string;
  developmentTasks: DevelopmentTask[];
  tasksTotalEstimate: string;
  potentialEdgeCases: string[];
  technicalConsiderations: string[];
  identifiedDependencies: string[];
  questions: string[];
  riskAnalysis: Risk[];          // type: Técnico | Negócio | Usabilidade | Compliance | Rollout; severity?: baixa | média | alta
  model?: string;
}
```

### Backlog
```typescript
interface Backlog {
  projectName: string;
  items: BacklogItem[];          // BacklogItem extends RefinedStory + id + order
}
```

### ProjectInfo
```typescript
interface ProjectInfo {
  name: string;
  context: string;
  objectives: string;
}
```

---

## 3. Fluxo de IA (GeminiService)

### Chamada base
```
User Input
    ↓
groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [system, user],
  response_format: { type: 'json_object' },
  temperature: 0.4
})
    ↓
JSON.parse(response)
    ↓ (falha)
Auto-correção: segunda chamada com temperature: 0.0
    ↓
Retorno tipado <T>
```

### Endpoints de IA

| Método | Entrada | Saída | Temp |
|--------|---------|-------|------|
| `refineUserStoryStrategic` | string (descrição) | `StrategicRefinementResult` | 0.4 |
| `processDocumentForBacklog` | string (texto doc) | `ExtractedBacklogItems[]` | 0.4 |
| `generateDetailedAcceptanceCriteria` | `RefinedStory` | string (Gherkin expandido) | 0.5 |
| `generateAlternativeTestFormat` | `TestScenarios`, format | string (código Jest/Mocha) | 0.2 |
| `generateTechnicalArtifact` | considerações, deps, `'doc'\|'c4-diagram'\|'c4-container'\|'sequence-diagram'` | string (md ou mermaid) | 0.3 |

---

## 4. Autenticação (Supabase)

```
Register → supabase.auth.signUp(email, password)
Login    → supabase.auth.signInWithPassword(email, password)
Session  → supabase.auth.getSession() + onAuthStateChange
Guard    → AuthService.isAuthenticated() (computed signal)
Logout   → supabase.auth.signOut() → redirect /login
```

- `AuthService` expõe `user` (signal), `isAuthenticated` (computed), `isLoading` (signal)
- `supabase.client.ts` cria o client singleton com `supabaseUrl` e `supabaseAnonKey` do `environment`

---

## 5. Persistência

| Dado | Onde | Status |
|------|------|--------|
| Backlogs / itens | `localStorage` → key `userStoryBacklogs` | ⚠️ Migrar para Supabase (US-001) |
| Histórico de análises | `localStorage` (por sessão) | atual |
| Autenticação | Supabase (cookie/token via SDK) | atual |
| Info do projeto | `localStorage` embutido no `Backlog` | ⚠️ Migrar para Supabase (US-001) |
| Personas | `localStorage` (planejado: Supabase) | US-015 |
| Calibração de estimativas | `localStorage` (planejado: Supabase) | US-011 |

### Plano de migração para Supabase (US-001)
```
BacklogService (novo)
  ├── saveBacklog(userId, backlog) → supabase.from('backlogs').upsert()
  ├── loadBacklogs(userId)        → supabase.from('backlogs').select()
  └── deleteBacklog(id)           → supabase.from('backlogs').delete()

Tabela: backlogs
  id          uuid primary key
  user_id     uuid references auth.users
  name        text
  items       jsonb   (array de BacklogItem serializado)
  project_info jsonb
  created_at  timestamptz
  updated_at  timestamptz
```

---

## 6. Processamento de Documentos

### PDF
```
File → FileReader.readAsArrayBuffer
     → pdfjsLib.getDocument(buffer)
     → page.getTextContent() por página
     → texto concatenado → GeminiService.processDocumentForBacklog()
```

### DOCX
```
File → FileReader.readAsArrayBuffer
     → mammoth.extractRawText({ arrayBuffer })
     → texto → GeminiService.processDocumentForBacklog()
```

---

## 7. Exportação de Documentos

`DocumentExportService` gera arquivos para download:
- **PRD**: Markdown estruturado com todas as histórias do backlog
- **Spec**: Especificação técnica com tarefas e estimativas
- **Individual**: Exportação de story única

---

## 8. Configuração de Ambiente

### `environment.ts` (dev)
```typescript
export const environment = {
  production: false,
  apiKey: '<GROQ_API_KEY>',        // chave Groq
  supabaseUrl: '<SUPABASE_URL>',
  supabaseAnonKey: '<SUPABASE_ANON_KEY>',
};
```

### `environment.prod.ts` (prod)
Mesmo shape, com fileReplacement configurado no `angular.json`.

---

## 9. Build e Deploy

```bash
# Dev
npm run dev             # porta 3000

# Build prod
npm run build           # output: dist/

# Preview
npm run preview
```

### angular.json — configurações relevantes
- `browser`: `index.tsx` (entry point)
- `assets`: `pdf.worker.min.mjs` copiado de `pdfjs-dist/build` para `/pdfjs`
- `fileReplacements` (prod): `environment.ts` → `environment.prod.ts`

---

## 10. Novos Serviços Planejados

| Serviço | Responsabilidade | Story |
|---------|-----------------|-------|
| `BacklogService` | Abstração de persistência localStorage → Supabase | US-001 |
| `ToastService` | Notificações de erro/sucesso centralizadas | US-002 |
| `GherkinStudioService` | Geração e export de arquivos `.feature` BDD | US-009 |
| `RiskAnalysisService` | Risk Radar estruturado por história | US-010 |
| `EstimationService` | Estimativa argumentada com calibração por equipe | US-011 |
| `ArchitectureLensService` | Geração de C4 + diagramas de sequência | US-012 |
| `BacklogHealthService` | Monitor de qualidade e score contínuo | US-013 |
| `DorGatekeeperService` | Validação de DoR configurável | US-014 |
| `PersonaService` | CRUD de personas + contexto para geração | US-015 |
| `SprintSimulationService` | Simulação de sprint com 3 cenários | US-016 |

---

## 11. Convenções

- Todos os componentes: `standalone: true`, `ChangeDetectionStrategy.OnPush`
- DI via `inject()` — sem constructor injection
- Estado via Signals: `signal()`, `computed()`, sem RxJS nos componentes
- Templates: Angular 17+ block syntax (`@if`, `@for` com `track`)
- Sem `console.log` em produção
- Erros de IA exibidos ao usuário via `ToastService` (não alert/console)
- Novos campos em `RefinedStory` sempre opcionais (`campo?: tipo`) — nunca remover campos existentes
