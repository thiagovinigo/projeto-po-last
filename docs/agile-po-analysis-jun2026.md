# Análise Agile PO — PO Agent AI
**Data:** Junho 2026 | **Framework:** INVEST + Dado-Quando-Então + WSJF + DoR

---

## 1. RESUMO EXECUTIVO

### Health Score por Dimensão

| Dimensão | Score | Status |
|----------|-------|--------|
| **Cobertura de Produto (vs PRD)** | 90/100 | ✅ Excelente |
| **Qualidade das User Stories** | 58/100 | ⚠️ Crítica |
| **Clareza dos Critérios de Aceite** | 52/100 | ⚠️ Crítica |
| **Definition of Ready (DoR)** | 45/100 | ❌ Fraco |
| **Priorização & WSJF** | 55/100 | ⚠️ Mediocre |
| **Código vs Especificação** | 70/100 | ⚠️ Moderado |
| **Testes & Automação** | 20/100 | ❌ Crítico |
| **Segurança** | 45/100 | ⚠️ Crítica |

**Score Geral: 62/100**

---

## 2. ANÁLISE INVEST POR USER STORY

### Sprint 1 — Fundação Cloud

#### US-001: BacklogService + Persistência Supabase
| Critério | Status | Feedback |
|----------|--------|----------|
| **I**ndependente | ⚠️ | Bloqueada por SEC-001 |
| **N**egociável | ✅ | localStorage → Supabase |
| **V**aliosa | ✅ | Perda zero de dados |
| **E**stimável | ⚠️ | AC vago: "perda impossível" |
| **S**mall | ❌ | >13 SP — dividir em 3 |
| **T**estável | ⚠️ | Falta Gherkin + teste offline |

**Split necessário:**
- US-001-a: Criar tabela + API (3 SP)
- US-001-b: Sync bidirecional (5 SP)
- US-001-c: Offline mode + fila de sync (5 SP)

#### US-002: ToastService + Erros Groq
| Critério | Status | Feedback |
|----------|--------|----------|
| **I**ndependente | ✅ | |
| **N**egociável | ✅ | |
| **V**aliosa | ✅ | |
| **E**stimável | ✅ | ~5 SP |
| **S**mall | ✅ | |
| **T**estável | ⚠️ | Falta Gherkin; cobrir: rate limit, quota, timeout, parse fail |

**AC em Gherkin necessário:**
```gherkin
Scenario: Rate limit atingido
  Given que a quota de requisições está no limite
  When o usuário clica em "Refinar História"
  Then exibe toast "Limite de uso da IA atingido. Tente novamente em X minutos"
  And botão "Refinar" fica desabilitado por X minutos
```

#### US-004: Validação On Blur
| Critério | Status | Feedback |
|----------|--------|----------|
| **I**ndependente | ✅ | |
| **S**mall | ✅ | ~4 SP |
| **T**estável | ⚠️ | Falta Gherkin; falta cenário resubmissão |

---

### Sprint 2 — Qualidade do Backlog

#### US-006: Drag-and-Drop
| Critério | Status | Feedback |
|----------|--------|----------|
| **V**aliosa | ⚠️ | **Validação pendente** vs up/down existente |
| **E**stimável | ⚠️ | Sem AC — estimativa incerta |
| **S**mall | ❌ | >8 SP (DnD + mobile + a11y) |
| **T**estável | ❌ | Sem AC |

**🔴 Bloqueada** — Validar valor antes de implementar

#### US-007: Busca e Filtros
**⚠️ Pendente** — Campos de filtro não definidos. Definir antes de implementar.

#### US-008: Export CSV
| Critério | Status | |
|----------|--------|--|
| **S**mall | ✅ | ~3 SP |
| **T**estável | ⚠️ | Falta: caracteres especiais, encoding |

---

### Sprint 3 — Features Inovadoras

#### US-011: Reasoned Estimation
**🔴 BLOQUEADA** — AC completamente ausentes. AC mínimos necessários:
```gherkin
Scenario: Estimativa gerada com justificativa
  Given uma história com contexto técnico
  When a IA calcula estimativa
  Then exibe: camadas impactadas, complexidade por camada, justificativa narrativa
  And se estimativa > 8 SP, sugere decomposição
```

#### US-014: DoR Gatekeeper
**🔴 BLOQUEADA** — Definir quais campos são configuráveis antes de implementar

#### US-015: Persona Context Engine
**🔴 BLOQUEADA** — Sem AC, sem interface, escopo indefinido
**Split necessário:**
- US-015-a: Cadastro de personas (3 SP)
- US-015-b: Seleção automática na geração (5 SP)

#### US-016: Sprint Simulation
**🔴 BLOQUEADA** — Dividir em:
- US-016-a: Input de capacidade da equipe (2 SP)
- US-016-b: Simulação com 3 cenários (8 SP)

---

## 3. DEFINITION OF READY (DoR)

| Critério | Coverage | Observação |
|----------|----------|------------|
| Persona identificada | ⚠️ 60% | US-011, US-015 faltam |
| AC numerados | ❌ 30% | Apenas US-005, US-012 |
| AC em Gherkin | ❌ 10% | Praticamente nenhuma |
| Dependências mapeadas | ⚠️ 50% | SEC-001 citada; outros não |
| Estimativa presente | ✅ 80% | Faltam US-011/014/015/016 |
| Bloqueadores resolvidos | ❌ 40% | 6 stories bloqueadas |
| Protótipo/design | ❌ 20% | Nenhuma story tem wireframe |

**Resultado: ~45% DoR — Maioria NÃO está pronta para sprint**

---

## 4. GAPS PRD vs IMPLEMENTAÇÃO

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| Autenticação Supabase | ✅ | OK |
| Dashboard projetos | ⚠️ | localStorage apenas (falta US-001) |
| Refinamento estratégico | ✅ | OK (falta cobertura testes) |
| Importação PDF/Word | ✅ | OK |
| Backlog hierárquico | ✅ | OK |
| Geração PRD/Spec enriquecida | ✅ | OK |
| Export `.feature` | ✅ | OK (falta Studio dedicado) |
| Risk Radar | ⚠️ | Faltam tipos Compliance/Rollout (QW-002) |
| C4 Diagrama | ✅ | OK |
| **Validação INVEST** | ❌ | **GAP CRÍTICO — não existe** |
| **Persistência Supabase** | ❌ | **GAP CRÍTICO** |
| **Toast/Error handling** | ❌ | **GAP CRÍTICO** |
| DoR Gatekeeper | ❌ | Gap v2 |
| Health Score | ❌ | Gap v2 |
| Sprint Simulation | ❌ | Gap v2 |

---

## 5. CAMPOS `RefinedStory` — COBERTURA

| Campo | AC? | Testes? | Status |
|-------|-----|---------|--------|
| title, epic, feature, persona | ✅ | ✅ | OK |
| acceptanceCriteria | ✅ | ⚠️ | **Falta converter para Gherkin** |
| testScenarios (e2e/int/unit) | ✅ | ❌ | **Gerados mas não validados** |
| potentialEdgeCases | ⚠️ | ❌ | Gerados mas não em AC |
| riskAnalysis | ✅ | ⚠️ | Faltam tipos Compliance/Rollout |
| questions | ✅ | ❌ | Gerados mas nunca resolvidos |

**Campos ausentes no modelo:**
- `investAnalysis: InvestCriteria` — Validação INVEST não existe
- `dorStatus: 'ready' | 'needs-refinement'` — Tracking automático DoR
- `acceptance: 'approved' | 'rejected'` — Quem aprovou?

---

## 6. RECOMENDAÇÕES PRIORIZADAS

### Imediato (Esta semana)

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | **SEC-001** — Proxy Vercel para Groq | 2-3h | Desbloqueador produção |
| 2 | **QW-002** — Adicionar `'Compliance' \| 'Rollout'` a `Risk.type` | 5min | Tipos corretos |
| 3 | **QW-003** — `try/catch` no `JSON.parse` localStorage | 5min | Previne crash |
| 4 | **QW-004** — Remover `console.log` em gemini.service.ts | 2min | Limpeza |
| 5 | **Refinamento US-011** — Escrever AC em Gherkin | 1h | Desbloqueia feature |

### Curto prazo (Próximas 2 sprints)

| # | Ação | Esforço |
|---|------|---------|
| 6 | Converter **100% AC para Gherkin** | 4-6h |
| 7 | Implementar **US-001** (split 3 stories) | 2 sprints |
| 8 | Implementar **US-002** (ToastService) | 1 sprint |
| 9 | Decompor **US-015** em 2 stories | 1h refinamento |
| 10 | Decompor **US-016** em 2 stories | 1h refinamento |

### Médio prazo (Sprints 3-4)

| # | Ação |
|---|------|
| 11 | Testes Playwright — 3 fluxos críticos (US-027) |
| 12 | Unit tests GeminiService (US-026-a) |
| 13 | CI/CD GitHub Actions (US-024) |

---

## 7. MATRIZ DE PROBLEMAS × IMPACTO

| # | Problema | Severidade | Fix Time |
|---|----------|-----------|----------|
| P1 | SEC-001 não resolvido | 🔴 CRÍTICA | 2-3h |
| P2 | US-001 bloqueada | 🔴 CRÍTICA | 2 sprints |
| P3 | AC não em Gherkin | 🔴 CRÍTICA | 1 sprint |
| P4 | US-011/015/016 indefinidas | 🟠 ALTA | 6-8h refinamento |
| P5 | Risk.type incompleto | 🟠 ALTA | 5min (QW-002) |
| P6 | US-006 não validado | 🟠 ALTA | 30min |
| P7 | US-007 sem campos filtro | 🟡 MÉDIA | 30min |
| P8 | Testes 0% cobertura | 🟡 MÉDIA | 2-3 sprints |
| P9 | JSON.parse sem try/catch | 🟡 MÉDIA | 5min (QW-003) |
| P10 | Sem DoR gatekeeper | 🔵 BAIXA | v2 |

---

## Conclusão

O projeto tem **PRD sólido (90/100) e visão clara**. O problema não é produto, é execução:

- ✅ Funcionalidades base implementadas
- ❌ Qualidade das stories: 58/100 (AC vagas, sem Gherkin)
- ❌ Definition of Ready: 45/100 (6 stories bloqueadas)
- ❌ Testes: 0/100 (nenhuma cobertura)
- ❌ Segurança: 45/100 (SEC-001 pendente)

**Recomendação:** Pausar novas features por 1-2 sprints. Resolver bloqueadores (SEC-001, AC em Gherkin, testes básicos) e limpar backlog. Depois retomar roadmap com confiança.
