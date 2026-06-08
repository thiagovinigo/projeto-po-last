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

---

## Sprint 1 — Fundação Cloud (Alta Prioridade)

- [ ] **US-001** — `BacklogService`: abstrair localStorage em serviço + migrar para Supabase (tabela `backlogs`)
- [ ] **US-002** — `ToastService` + `classifyGroqError`: erros globais centralizados com mensagens PT-BR
- [x] **US-003** — Skeleton loading: cards do dashboard com `animate-pulse` ✓
- [ ] **US-004** — Validação em tempo real: login/register só têm erro pós-submit — falta feedback por campo on blur

---

## Sprint 2 — Qualidade do Backlog

- [x] **US-005** — Edição inline de título no backlog via duplo clique (Enter salva, Esc cancela)
- [ ] **US-006** — Drag-and-drop: reordenação via CDK DragDrop (existe up/down por botão)
- [ ] **US-007** — Busca e filtros no backlog (por título, épico, feature)
- [ ] **US-008** — Export para CSV (existe apenas export .md)

---

## Sprint 3 — Features Inovadoras ⭐

- [x] **US-009** — Gherkin export: botão "Export .feature" gera arquivo Cucumber/Playwright pronto
- [x] **US-010** — Risk Radar: tipos `Compliance` e `Rollout` + campo `severity` + badges na UI + prompt atualizado
- [~] **US-011** — Reasoned Estimation: campos existem — falta calibração por time e score de confiança
- [x] **US-012** — Architecture Lens: 3 botões — C4 Contexto · C4 Contêineres · Diagrama de Sequência
- [x] **US-013** — Backlog Analysis: botões "Dependências" e "Riscos" no header com modal estruturado
- [ ] **US-014** — DoR Gatekeeper: validação de Definition of Ready configurável
- [ ] **US-015** — Persona Context Engine: personas reutilizáveis como contexto de geração
- [ ] **US-016** — Sprint Simulation: 3 cenários preditivos (otimista/realista/pessimista)

---

## Sprint 4 — Geração de Documentos Enriquecida

- [x] **US-017** — PRD e Spec enriquecidos: antes de gerar, roda análise de dependências + riscos em paralelo e injeta seções no documento
- [ ] **US-018** — Integração Jira: exportar histórias via OAuth
- [ ] **US-019** — Integração Linear: criar issues a partir do backlog
- [ ] **US-020** — Compartilhamento: link público read-only de um backlog
- [ ] **US-021** — Colaboração em tempo real via Supabase Realtime

---

## Qualidade e DevX

- [ ] **US-022** — ESLint: `ng lint` com regras Angular recomendadas
- [ ] **US-023** — Bundlar dependências CDN: `marked.js` e `tailwindcss` localmente
- [ ] **US-024** — CI/CD: GitHub Actions com build + lint + testes + deploy Vercel
- [x] **US-025** — Variáveis de ambiente seguras: placeholder `__GROQ_API_KEY__` no git + `skip-worktree`
- [ ] **US-026** — Testes unitários: cobertura 80% em `GeminiService`, `AuthService`, `DocumentService`
- [ ] **US-027** — Testes E2E Playwright: login → criar projeto → refinar história → exportar

---

## Bugs Conhecidos

- [x] **BUG-01** `environment.ts` com chave real — resolvido: placeholder no git + skip-worktree local
- [ ] **BUG-02** `.angular/cache` — verificar `.gitignore`
- [ ] **BUG-03** Arquivos com `:` no nome em `feature/document-import` impedem `git checkout` no Windows
