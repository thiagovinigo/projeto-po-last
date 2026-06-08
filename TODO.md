# TODO — PO Agent AI

## Legenda
- `[ ]` pendente · `[x]` concluído · `[~]` parcial · `[!]` bloqueado

---

## Fundação (Concluído)

- [x] Setup Angular 20 standalone + zoneless + OnPush
- [x] Integração Groq SDK (Llama 3.3 70B) — migrado de Gemini
- [x] Autenticação Supabase (login, register, auth guard)
- [x] Dashboard de projetos com localStorage
- [x] Roteamento Angular com lazy loading
- [x] Refinamento estratégico de histórias via IA
- [x] Importação de PDF e Word com geração de backlog
- [x] Backlog hierárquico (Épico > Feature > História)
- [x] Geração de PRD e Spec a partir do backlog
- [x] Painel de informações do projeto (editável)
- [x] Histórico de análises por sessão
- [x] Exportação de documentos (.md)
- [x] Expansão detalhada de critérios de aceite ("Detalhar com IA")
- [x] Geração de C4Context Mermaid via `generateTechnicalArtifact`
- [x] Conversão de testes para Jest/Mocha
- [x] `riskAnalysis: Risk[]` no modelo com UI por tipo (Técnico/Negócio/Usabilidade)
- [x] `storyEstimate` + `storyEstimateJustification` gerados e exibidos pela IA
- [x] Critérios de aceite em Gherkin gerados e exibidos
- [x] Modal de edição completo de histórias no backlog
- [x] Reordenação de histórias com botões up/down
- [x] Skeleton loader no painel do analyzer
- [x] ECC rules instaladas (.claude/rules/ecc/)
- [x] CLAUDE.md, PRD.md, SPEC.md, TODO.md, storys.md criados
- [x] Supabase restaurado e usuário teste criado (teste@teste.com)
- [x] Chave Groq configurada + BUG-01 resolvido (placeholder no git)
- [x] Sistema de agentes coaching: po-coach + story-validator + backlog-reviewer + dev-reviewer + automation-scout + dor-checker

---

## 🔴 Segurança Crítica (Resolver ANTES de qualquer deploy público)

- [ ] **SEC-001** — Proxy Vercel Serverless para Groq: API key nunca exposta no browser — remover `dangerouslyAllowBrowser: true` do GeminiService
  - _Critério: Network tab não mostra chamadas diretas a `api.groq.com` com token visível_

---

## Sprint 1 — Fundação Cloud (Alta Prioridade)

- [ ] **US-001** — `BacklogService`: abstrair localStorage em serviço + migrar para Supabase (tabela `backlogs`)
  - _Critério: perda de dados impossível — backlog persiste após limpar browser_
- [ ] **US-002** — `ToastService` + `classifyGroqError`: erros Groq (rate limit, quota, timeout, parse fail) exibem toast PT-BR amigável
  - _Critério: desligar rede → usuário vê toast, não tela congelada_
- [x] **US-003** — Skeleton loading: cards do dashboard com `animate-pulse`
- [ ] **US-004** — Validação on blur: login/register com feedback por campo (não só pós-submit)
  - _Critério: erro aparece ao sair do campo email/senha, botão submit não é único trigger_

---

## Sprint 2 — Qualidade do Backlog

- [x] **US-005** — Edição inline de título no backlog via duplo clique (Enter salva, Esc cancela)
- [ ] **US-006** — Drag-and-drop: reordenação via CDK DragDrop _(valor para PO vs. up/down atual precisa ser validado)_
- [ ] **US-007** — Busca e filtros no backlog: por título, épico, feature _(definir campos de filtro antes de implementar)_
- [ ] **US-008** — Export para CSV _(especificar colunas antes de implementar)_
- [ ] **US-028** — "Import & Auto-Add All": 1 clique importa documento e adiciona todas as stories ao backlog
  - _Critério: importar PDF → todas as stories no backlog sem clique adicional_

---

## Sprint 3 — Features Inovadoras ⭐

- [x] **US-009** — Gherkin export: botão "Export .feature" gera arquivo Cucumber/Playwright pronto
- [x] **US-010** — Risk Radar: tipos `Compliance` e `Rollout` + campo `severity` + badges na UI + prompt atualizado
- [~] **US-011** — Reasoned Estimation: campos existem — **falta**: calibração SP/hora por projeto + score de confiança na UI
  - _AC necessário: configurar velocidade do time (SP/hora); score aparece junto à estimativa_
- [x] **US-012** — Architecture Lens: 3 botões — C4 Contexto · C4 Contêineres · Diagrama de Sequência
- [x] **US-013** — Backlog Analysis: botões "Dependências" e "Riscos" no header com modal estruturado
- [ ] **US-014** — DoR Gatekeeper: _(refinar antes de implementar — definir quais campos são configuráveis)_
- [ ] **US-015** — Persona Context Engine: _(BLOQUEADA — sem AC, sem especificação de interface, escopo indefinido)_
- [ ] **US-016** — Sprint Simulation: _(BLOQUEADA — dividir em 2 stories: "Input de capacidade" + "Geração de cenários")_

---

## Sprint 4 — Geração de Documentos Enriquecida

- [x] **US-017** — PRD e Spec enriquecidos com análise de dependências + riscos em paralelo antes da geração
- [ ] **US-018** — Integração Jira: exportar histórias via OAuth
- [ ] **US-019** — Integração Linear: criar issues a partir do backlog
- [ ] **US-020** — Compartilhamento: link público read-only de um backlog
- [ ] **US-021** — Colaboração em tempo real via Supabase Realtime

---

## Qualidade e DevX

- [ ] **US-022** — ESLint: `ng add @angular-eslint/schematics` + regras Angular recomendadas
  - _Critério: `npm run lint` passa sem erros_
- [ ] **US-023** — Bundlar CDN localmente: instalar `marked` + `tailwindcss` no bundle — remover CDN do index.html
  - _Critério: `npm run build` inclui marked/tailwind sem dependências externas_
- [ ] **US-024** — CI/CD: GitHub Actions com build + lint + tsc + deploy Vercel + substituição de secrets
  - _Critério: PR falha se build quebra; merge na main faz deploy automático_
- [x] **US-025** — Variáveis de ambiente seguras: placeholder `__GROQ_API_KEY__` no git + `skip-worktree`
- [ ] **US-026** — Testes unitários: iniciar por `GeminiService` (mock Groq) — cobertura 80%
  - _Dividir: US-026a GeminiService · US-026b AuthService · US-026c DocumentService_
- [ ] **US-027** — Testes E2E Playwright: 3 fluxos prioritários — login · refinar história · exportar PRD
- [ ] **US-029** — Hook Claude Code: tsc incremental + build verification no Stop da sessão
- [ ] **US-030** — Pre-commit hook: bloquear commit se detectar chave Groq real (`gsk_`)

---

## Quick Wins Técnicos (< 1h total)

- [ ] **QW-001** — Remover `@google/genai` de package.json (`npm uninstall @google/genai`) — reduz bundle ~150KB
- [ ] **QW-002** — Corrigir `Risk.type` em `validation.model.ts:36` — adicionar `'Compliance' | 'Rollout'` ao union
- [ ] **QW-003** — `try/catch` no `JSON.parse` do localStorage — previne crash com dados corrompidos
- [ ] **QW-004** — Remover `console.log('Successfully corrected...')` de `gemini.service.ts:428`
- [ ] **QW-005** — Instalar `@types/marked` — elimina `declare var marked: any` em 2 arquivos
- [x] **QW-006** — Adicionar `.angular/cache` ao `.gitignore` (BUG-02)

---

## Bugs Conhecidos

- [x] **BUG-01** `environment.ts` com chave real — resolvido: placeholder no git + skip-worktree local
- [x] **BUG-02** `.angular/cache` no `.gitignore` — resolvido (QW-006)
- [ ] **BUG-03** Arquivos com `:` no nome em `feature/document-import` impedem `git checkout` no Windows

---

## Diagnóstico PO Coach (jun/2026)

> Última análise: `@po-coach` — Health Score **62/100**

| Dimensão | Score |
|----------|-------|
| Produto (cobertura PRD) | 90/100 ✅ |
| Qualidade das Stories | 58/100 ⚠️ |
| Código / Arquitetura | 55/100 ⚠️ |
| Automação / DevX | 20/100 ❌ |
| Testes | 0/100 ❌ |
| Segurança | 45/100 ⚠️ |

**Stories bloqueadas que precisam refinamento antes de entrar em sprint:**
- US-011: definir o que é "calibração por time" e "score de confiança" — AC ausentes
- US-015: completamente indefinida — sem AC, sem interface, sem tamanho
- US-016: grande demais — dividir em "Input de capacidade" + "Geração de cenários"
- US-026/027: dividir em histórias menores por service/fluxo
