# TODO — PO Agent AI

## Legenda
- `[ ]` pendente · `[x]` concluído · `[~]` parcial (existe, incompleto) · `[!]` bloqueado

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
- [x] Critérios de aceite em Gherkin gerados e exibidos (campo `acceptanceCriteria`)
- [x] Modal de edição completo de histórias no backlog
- [x] Reordenação de histórias com botões up/down
- [x] Skeleton loader no painel do analyzer (`animate-pulse`)
- [x] ECC rules instaladas (.claude/rules/ecc/)
- [x] CLAUDE.md, PRD.md, SPEC.md, TODO.md, storys.md criados
- [x] Supabase restaurado e usuário teste criado

---

## Sprint 1 — Fundação Cloud (Alta Prioridade)

- [ ] **US-001** — `BacklogService`: abstrair localStorage em serviço + migrar para Supabase (tabela `backlogs`)
- [ ] **US-002** — `ToastService` + `classifyGroqError`: erros globais centralizados com mensagens PT-BR
- [x] **US-003** — Skeleton loading: cards do dashboard com `animate-pulse` ✓ — falta no backlog (items)
- [ ] **US-004** — Validação em tempo real: login/register têm apenas erro pós-submit — falta feedback por campo on blur

---

## Sprint 2 — Qualidade do Backlog (Média Prioridade)

- [x] **US-005** — Edição inline: duplo clique no título da história no backlog (Enter salva, Esc cancela) + modal completo para edição full
- [ ] **US-006** — Drag-and-drop: existe up/down por botão — falta arrastar e soltar via CDK DragDrop
- [ ] **US-007** — Busca e filtros no backlog (por título, épico, feature) — não existe
- [ ] **US-008** — Export para CSV — só existe export .md, falta gerar CSV

---

## Sprint 3 — Features Inovadoras (Diferenciação) ⭐

- [x] **US-009** — Gherkin export: botão "Export .feature" gera arquivo Cucumber/Playwright pronto — falta componente studio dedicado e coverage indicator
- [x] **US-010** — Risk Radar: tipos `Compliance` e `Rollout` adicionados + campo `severity` (baixa/média/alta) + badges coloridos na UI + prompt atualizado
- [~] **US-011** — Reasoned Estimation: **campos `storyEstimate` + justificativa já existem** — falta calibração por time, comparação com histórias similares, score de confiança
- [x] **US-012** — Architecture Lens: 3 botões — C4 Contexto · C4 Contêineres · Diagrama de Sequência — cada um com prompt especializado
- [ ] **US-013** — Backlog Health Score: monitor ativo de qualidade — não existe
- [ ] **US-014** — DoR Gatekeeper: validação de Definition of Ready configurável — não existe
- [ ] **US-015** — Persona Context Engine: personas reutilizáveis como contexto de geração — não existe
- [ ] **US-016** — Sprint Simulation: 3 cenários preditivos (otimista/realista/pessimista) — não existe

---

## Sprint 4 — Integrações e Colaboração (v2)

- [ ] **US-017** — Integração Jira: exportar histórias via OAuth
- [ ] **US-018** — Integração Linear: criar issues a partir do backlog
- [ ] **US-019** — Compartilhamento: link público read-only de um backlog
- [ ] **US-020** — Colaboração em tempo real via Supabase Realtime

---

## Qualidade e DevX

- [ ] **US-021** — ESLint: `ng lint` com regras Angular recomendadas
- [ ] **US-022** — Bundlar dependências CDN: `marked.js` e `tailwindcss` localmente
- [ ] **US-023** — CI/CD: GitHub Actions com build + lint + testes + deploy Vercel
- [ ] **US-024** — Variáveis de ambiente seguras: placeholder `__GROQ_API_KEY__` no git
- [ ] **US-025** — Testes unitários: cobertura 80% em `GeminiService`, `AuthService`, `DocumentService`
- [ ] **US-026** — Testes E2E Playwright: login → criar projeto → refinar história → exportar

---

## Bugs Conhecidos

- [ ] **BUG-01** `environment.ts` com chave Groq real commitada — usar placeholder no git (Alta)
- [ ] **BUG-02** `.angular/cache` verificar se está no `.gitignore` (Média)
- [ ] **BUG-03** Arquivos com `:` no nome em `feature/document-import` impedem `git checkout` no Windows (Média)
