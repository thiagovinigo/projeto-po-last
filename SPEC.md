# SPEC — PO Agent AI

**Versão:** 1.2  
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
│   ├── DocumentService      (PDF → text via pdfjs, DOCX → text via mammoth)
│   └── DocumentExportService (geração e download de documentos)
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
  riskAnalysis: Risk[];          // type: Técnico | Negócio | Usabilidade
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
| `analyzeBacklogDependencies` | `BacklogItem[]` | `BacklogDependencyAnalysis` | auto |
| `analyzeBacklogRisks` | `BacklogItem[]` | `BacklogRiskAnalysis` | auto |
| `generateProjectDocument` | `DocumentKind`, draft enriquecido | string (md polido) | 0.3 |

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

| Dado | Onde |
|------|------|
| Backlogs / itens | `localStorage` → key `userStoryBacklogs` |
| Histórico de análises | `localStorage` (por sessão) |
| Autenticação | Supabase (cookie/token via SDK) |
| Info do projeto | `localStorage` embutido no `Backlog` |

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
- **PRD**: Markdown estruturado com histórias + seção de dependências + seção de riscos (geradas por IA antes da exportação)
- **Spec**: Especificação técnica com tarefas e estimativas + seção de dependências + seção de riscos
- **Individual**: Exportação de story única
- **`.feature`**: Arquivo Gherkin por história (Cucumber/Playwright)

### Fluxo enriquecido de geração de documentos

```
Clique em "Gerar PRD" ou "Gerar Spec"
    ↓
analyzeBacklogDependencies() ┐ em paralelo
analyzeBacklogRisks()        ┘ (Promise.all)
    ↓
buildPrdDraft() / buildSpecDraft()
    + buildDependencySection(deps)
    + buildRiskSection(risks)
    ↓
generateProjectDocument(kind, draftEnriquecido)  ← IA polishing
    ↓
modal DocumentViewer com download
```

O botão mostra o passo atual: **"Analisando dependências e riscos..."** → **"Gerando PRD..."**

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

## 10. Convenções

- Todos os componentes: `standalone: true`, `ChangeDetectionStrategy.OnPush`
- DI via `inject()` — sem constructor injection
- Estado via Signals: `signal()`, `computed()`, sem RxJS nos componentes
- Templates: Angular 17+ block syntax (`@if`, `@for` com `track`)
- Sem `console.log` em produção
- Erros de IA exibidos ao usuário com mensagem amigável
