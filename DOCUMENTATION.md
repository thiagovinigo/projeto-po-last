# PO Agent AI - Documentação Técnica Completa

Esta documentação fornece uma visão profunda da arquitetura, implementação, lógica de IA e fluxos de dados do **PO Agent AI**.

---

## 1. Visão Geral

O **PO Agent AI** é uma ferramenta de Product Management autônomo. Ele utiliza o modelo Gemini 2.5 Flash para analisar, decompor e refinar histórias de usuário, gerando artefatos técnicos, critérios de aceite, cenários de teste e estimativas de esforço.

---

## 2. Arquitetura do Sistema

O sistema é uma aplicação **Single Page Application (SPA)** construída com **Angular 20+** (Zoneless).

### Stack Tecnológica
*   **Framework:** Angular 20+ (Standalone Components, Signals).
*   **Estilização:** Tailwind CSS (via CDN).
*   **IA:** Google Gemini API (`@google/genai` SDK).
*   **Persistência:** `localStorage` (Browser).
*   **Build:** Angular CLI / Vite.

---

## 3. Frontend (Angular)

### Estrutura de Componentes
A aplicação é centralizada no `AppComponent` (`/src/app.component.ts`), que gerencia:
*   **Estado da UI:** Visualização atual (`welcome`, `analyzer`, `import`), abas ativas, loading states.
*   **Estado de Dados:** Histórico de validações, Backlogs de projetos, histórias em edição.
*   **Lógica de Negócio:** Chamadas ao `GeminiService`, manipulação de arquivos, cópia para clipboard, persistência no `localStorage`.

### Reatividade com Signals
O uso de `signal` permite uma reatividade granular e eficiente:
*   `userStory`: Input do usuário.
*   `validationResult`: Resultado da IA (pode ser `StrategicRefinementResult`, `ValidationResult` ou `AdvancedValidationResult`).
*   `backlogs`: Estado dos projetos de backlog.
*   `isLoading`: Controle de UI para estados de carregamento.

---

## 4. Agente de IA (Gemini Service)

O `GeminiService` (`/src/services/gemini.service.ts`) é o núcleo do agente.

### Estrutura de Prompts e Schemas
O serviço utiliza **Structured Output** (via `responseSchema`) para garantir que a IA retorne JSONs que o frontend possa consumir sem erros de parse.

#### Principais Prompts (System Instructions):
1.  **Refinamento Estratégico (`refineUserStoryStrategic`):**
    *   **Papel:** Especialista em Gestão de Produtos e Engenharia de Software.
    *   **Tarefa:** Avaliar complexidade, dividir histórias, refinar e gerar artefatos (BDD, testes, estimativas, riscos).
    *   **Regras:** Formato Gherkin estrito, consistência entre estimativas de tarefas e estimativa total, análise de riscos detalhada.

2.  **Importação de Documentos (`processDocumentForBacklog`):**
    *   **Papel:** Agente PO Autônomo.
    *   **Tarefa:** Analisar documentos longos, identificar Épicos/Features e gerar histórias refinadas para cada Feature.

### Mecanismo de Auto-Correção
Para garantir a robustez, o serviço implementa um padrão de **tentativa e correção**:
1.  Tenta parsear o JSON da resposta inicial.
2.  Se falhar, envia o JSON corrompido de volta para o Gemini com uma instrução de sistema: *"You are an automated JSON repair tool. Fix the syntax..."*.
3.  Tenta parsear novamente a resposta corrigida.

---

## 5. Modelos de Dados (`/src/models/validation.model.ts`)

A estrutura de dados é fortemente tipada para garantir a consistência entre o que a IA gera e o que o Angular renderiza.

*   **`RefinedStory`**: O objeto central que contém todos os artefatos de uma história refinada (título, persona, narrativa, critérios de aceite, testes, tarefas, riscos, etc.).
*   **`StrategicRefinementResult`**: O envelope de resposta para o refinamento estratégico, contendo uma lista de `RefinedStory`.
*   **`BacklogItem`**: Extensão de `RefinedStory` com `id` e `order` para gestão no backlog.

---

## 6. Fluxos de Dados

### Fluxo de Refinamento
1.  Usuário insere história bruta.
2.  `AppComponent` chama `GeminiService.refineUserStoryStrategic()`.
3.  `GeminiService` envia o prompt + `refinedStorySchema` para o Gemini.
4.  Gemini retorna JSON estruturado.
5.  `AppComponent` atualiza `validationResult` (Signal).
6.  Angular renderiza o resultado (BDD, testes, etc.).

### Fluxo de Importação
1.  Usuário envia arquivo (`.txt`/`.md`).
2.  `AppComponent` lê arquivo via `FileReader`.
3.  `GeminiService.processDocumentForBacklog()` envia o texto para a IA.
4.  IA retorna um array de Features, cada uma com suas histórias refinadas.
5.  `AppComponent` atualiza o backlog do projeto selecionado.

---

## 7. Segurança e Configuração

*   **API Key:** A chave `API_KEY` deve ser configurada no ambiente. O serviço valida a existência da chave antes de inicializar o SDK.
*   **Persistência:** O histórico e os backlogs são salvos no `localStorage`. Isso significa que os dados não são sincronizados entre diferentes navegadores ou dispositivos.
*   **Limites:** O frontend impõe um limite de 500KB por arquivo na importação para manter o uso dentro dos limites de contexto da API.

---

## 8. Manutenção e Extensão

*   **Adicionar novas funcionalidades:** Crie novos métodos no `GeminiService` seguindo o padrão de `generateValidation`.
*   **Atualizar Prompts:** As instruções do sistema estão localizadas dentro dos métodos do `GeminiService`. Ao atualizar, certifique-se de que o `responseSchema` ainda corresponde à nova estrutura de prompt.
*   **Alterar UI:** O `app.component.html` utiliza Tailwind CSS. Para adicionar novos componentes, utilize as classes utilitárias existentes para manter a consistência visual.
