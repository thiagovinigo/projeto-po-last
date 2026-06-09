# PO.md — PO Agent AI
**Versão:** 2.0 | **Data:** Junho 2026 | **Status:** Em Desenvolvimento  
**Análise aplicada:** INVEST · Dado-Quando-Então · WSJF · Definition of Ready · Agile PO Skill

---

## Índice

1. [Visão do Produto](#1-visão-do-produto)
2. [Health Score Geral](#2-health-score-geral)
3. [Backlog Completo com Análise INVEST](#3-backlog-completo-com-análise-invest)
4. [Definition of Ready — Status por Story](#4-definition-of-ready--status-por-story)
5. [Critérios de Aceite em Gherkin — Reescritas Necessárias](#5-critérios-de-aceite-em-gherkin--reescritas-necessárias)
6. [Gaps PRD vs Implementação](#6-gaps-prd-vs-implementação)
7. [Análise do Modelo de Dados RefinedStory](#7-análise-do-modelo-de-dados-refinedstory)
8. [Priorização WSJF](#8-priorização-wsjf)
9. [Quick Wins — Menos de 1h](#9-quick-wins--menos-de-1h)
10. [Decomposições Necessárias](#10-decomposições-necessárias)
11. [Plano de Ação Priorizado](#11-plano-de-ação-priorizado)
12. [Análise Competitiva](#12-análise-competitiva)

---

## 1. Visão do Produto

> **"O único produto que transforma uma ideia bruta em artefato de engenharia completo — User Story, BDD, testes, estimativa e arquitetura — em uma única sessão de trabalho."**

**Problema:** POs gastam horas refinando histórias manualmente. O processo é repetitivo, inconsistente entre times e difícil de escalar.

**Solução:** Agente de IA especializado que, a partir de uma frase ou documento, gera automaticamente: histórias INVEST, Gherkin, cenários de teste, estimativas com justificativa técnica, análise de riscos e backlog hierarquizado.

**Público beachhead:** Product Owners e Analistas de Negócio em empresas de tecnologia com 50–500 funcionários.

**Stack atual:** Angular 20 (standalone/zoneless/OnPush) · OpenAI gpt-4o · Supabase · Vercel

---

## 2. Health Score Geral

| Dimensão | Score | Status | Principal Gap |
|----------|-------|--------|---------------|
| Cobertura de Produto (vs PRD) | 90/100 | ✅ | Funcionalidades base implementadas |
| Qualidade das User Stories | 58/100 | ⚠️ | AC em prosa, não Gherkin |
| Clareza dos Critérios de Aceite | 52/100 | ⚠️ | Sem formato Dado-Quando-Então |
| Definition of Ready | 45/100 | ❌ | 6 stories bloqueadas/indefinidas |
| Priorização & WSJF | 55/100 | ⚠️ | SEC-001 pendente há sprints |
| Código vs Especificação | 70/100 | ⚠️ | localStorage ao invés de Supabase |
| Testes & Automação | 20/100 | ❌ | 0% cobertura |
| Segurança | 45/100 | ⚠️ | API key exposta no browser |

**Score Geral: 62/100**

> **Diagnóstico:** O produto tem PRD sólido e visão clara. O problema não é produto — é execução. AC vagas impedem testes automatizados. Stories bloqueadas travam o roadmap. Segurança crítica pendente bloqueia produção.

---

## 3. Backlog Completo com Análise INVEST

### Legenda
✅ Atende · ⚠️ Atende parcialmente · ❌ Não atende · 🔴 Bloqueada · [x] Concluída

---

### SPRINT 1 — Fundação Cloud

#### 🔴 SEC-001 — Proxy Vercel para API
**Bloqueador de produção.** API key exposta diretamente no browser via `dangerouslyAllowBrowser: true`.

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ✅ | |
| Negociável | ✅ | |
| Valiosa | ✅ | Sem isso: não vai a produção |
| Estimável | ✅ | ~3h |
| Small | ✅ | |
| Testável | ✅ | Network tab não mostra chamadas diretas à API |

**AC em Gherkin:**
```gherkin
Cenário: API key nunca exposta no browser
  Dado que a aplicação está em produção
  Quando o usuário inspeciona o Network tab do browser
  Então nenhuma chamada direta a api.openai.com com Authorization header é visível
  E todas as chamadas passam pelo endpoint /api/ai/chat da Vercel
```

---

#### [ ] US-001 — Persistência de backlog em nuvem (Supabase)

**Como** Product Owner,  
**Quero** que meu backlog seja salvo automaticamente no Supabase,  
**Para que** eu acesse meus projetos de qualquer dispositivo sem perder dados.

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ⚠️ | Bloqueada por SEC-001 |
| Negociável | ✅ | localStorage → Supabase |
| Valiosa | ✅ | Perda zero de dados |
| Estimável | ⚠️ | AC vago: "perda impossível" |
| **Small** | ❌ | **>13 SP — PRECISA SPLIT** |
| Testável | ⚠️ | Falta Gherkin + cenário offline |

**⚠️ Problema INVEST:** Story grande demais. Ver decomposição na seção 10.

**AC em Gherkin (reescrito):**
```gherkin
Cenário: Backlog salvo automaticamente
  Dado que o usuário está autenticado
  Quando ele cria ou edita uma história
  Então o backlog é salvo na tabela backlogs do Supabase em até 2 segundos
  E uma indicação visual confirma o salvamento

Cenário: Backlog acessível em outro dispositivo
  Dado que o usuário salvou um backlog no dispositivo A
  Quando ele faz login no dispositivo B
  Então o backlog carrega com todos os projetos e histórias intactos

Cenário: Salvamento offline com sync posterior
  Dado que o dispositivo está sem conexão
  Quando o usuário edita uma história
  Então uma badge "Salvamento offline" é exibida
  E ao reconectar, a sincronização ocorre automaticamente em até 5 segundos
```

---

#### [ ] US-002 — Tratamento de erros com mensagens específicas

**Como** usuário,  
**Quero** ver mensagens de erro claras e acionáveis,  
**Para que** eu saiba exatamente o que deu errado e como resolver.

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ✅ | |
| Negociável | ✅ | |
| Valiosa | ✅ | |
| Estimável | ✅ | ~5 SP |
| Small | ✅ | |
| Testável | ⚠️ | Falta cobrir: rate limit, quota, timeout, parse fail |

**AC em Gherkin (reescrito):**
```gherkin
Cenário: Rate limit da API atingido
  Dado que a quota de requisições está no limite
  Quando o usuário clica em "Refinar História"
  Então exibe toast "Limite de uso da IA atingido. Tente novamente em alguns minutos."
  E o botão "Refinar" fica desabilitado por 60 segundos
  E um contador regressivo é exibido no botão

Cenário: Dispositivo offline
  Dado que o dispositivo está sem conexão
  Quando o usuário tenta realizar qualquer ação de IA
  Então exibe toast "Sem conexão com a internet. Verifique sua rede."
  E a ação é enfileirada para retry automático ao reconectar

Cenário: Timeout na chamada de IA
  Dado que a resposta da IA demora mais de 90 segundos
  Quando o timeout é atingido
  Então exibe toast "A IA está demorando mais que o esperado. Tente novamente."
  E o botão de ação é reabilitado para nova tentativa

Cenário: Resposta JSON inválida da IA
  Dado que a IA retorna um JSON malformado
  Quando o sistema falha em parsear
  Então exibe toast "Erro interno de processamento. Tente novamente."
  E o erro técnico é logado mas não exposto ao usuário

Cenário: Autenticação expirada
  Dado que a sessão do usuário expirou
  Quando ele tenta uma ação protegida
  Então é redirecionado para o login
  Com mensagem "Sua sessão expirou. Faça login novamente."
```

---

#### [x] US-003 — Loading states com skeleton screens ✅ CONCLUÍDO

**Status:** Implementado. Pode ser removido do backlog ativo.

---

#### [ ] US-004 — Validação de formulários em tempo real

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ✅ | |
| Negociável | ✅ | |
| Valiosa | ✅ | |
| Estimável | ✅ | ~4 SP |
| Small | ✅ | |
| Testável | ⚠️ | Falta cenário resubmissão e email+senha simultâneos |

**AC em Gherkin (reescrito):**
```gherkin
Cenário: Email inválido perde foco
  Dado que o usuário está no formulário de login
  Quando ele digita um email sem @ e o campo perde o foco
  Então uma mensagem "Email inválido" aparece em vermelho abaixo do campo
  E o botão "Entrar" permanece desabilitado

Cenário: Senha muito curta
  Dado que o usuário está no cadastro
  Quando a senha digitada tem menos de 6 caracteres
  Então o indicador de força exibe "Senha muito curta — mínimo 6 caracteres"
  E o botão "Cadastrar" permanece desabilitado

Cenário: Confirmação de senha não coincide
  Dado que o usuário digitou uma senha
  Quando ele digita diferente no campo "Confirmar senha"
  Então o erro "As senhas não coincidem" aparece em tempo real no segundo campo
```

---

### SPRINT 2 — Qualidade do Backlog

#### [x] US-005 — Edição inline de histórias no backlog ✅ CONCLUÍDO

---

#### [ ] US-006 — Drag-and-drop para reordenar backlog

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ⚠️ | Acoplado à lógica de ordenação existente |
| Negociável | ✅ | |
| **Valiosa** | ⚠️ | **Validação pendente** vs botões up/down existentes |
| Estimável | ⚠️ | Sem AC definidos |
| **Small** | ❌ | >8 SP (CDK DnD + mobile + acessibilidade) |
| **Testável** | ❌ | **Sem AC** |

**🔴 BLOQUEADA** — Validar valor antes de implementar. Pergunta: "Botões up/down resolvem o problema ou DnD é necessário para o caso de uso real do PO?"

---

#### [ ] US-007 — Busca e filtros no backlog

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ✅ | |
| Negociável | ✅ | |
| Valiosa | ✅ | |
| **Estimável** | ⚠️ | **Campos de filtro não definidos** |
| Small | ⚠️ | Depende da complexidade |
| Testável | ⚠️ | Falta Gherkin |

**⚠️ PENDENTE REFINAMENTO** — Definir campos antes de implementar:
- [ ] Filtro por: Épico, Feature, Status, Estimativa?
- [ ] Busca em: título apenas ou também descrição, AC?
- [ ] Combinação de filtros: AND ou OR?

**AC em Gherkin (esboço):**
```gherkin
Cenário: Busca por título
  Dado que o backlog tem 20 histórias
  Quando o usuário digita "login" no campo de busca
  Então apenas histórias com "login" no título são exibidas (debounce 300ms)
  E o contador "X resultados encontrados" é atualizado

Cenário: Filtro por Épico
  Dado que existem histórias em 3 épicos diferentes
  Quando o usuário seleciona o Épico "Autenticação"
  Então apenas histórias deste épico são exibidas
  E os outros épicos ficam colapsados

Cenário: Nenhum resultado
  Quando a busca não encontra correspondência
  Então exibe "Nenhuma história encontrada para '[termo]'"
  E um botão "Limpar busca" é exibido
```

---

#### [ ] US-008 — Export para CSV

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ✅ | |
| Small | ✅ | ~3 SP |
| Testável | ⚠️ | Falta: caracteres especiais, encoding UTF-8 |

**AC em Gherkin:**
```gherkin
Cenário: Exportação básica
  Dado que o backlog tem histórias
  Quando o usuário clica em "Exportar CSV"
  Então um arquivo é baixado com colunas: Épico, Feature, Título, Persona, Estimativa, Status
  E o encoding é UTF-8

Cenário: Conteúdo com vírgulas e quebras de linha
  Dado que um critério de aceite contém vírgulas
  Quando exportado para CSV
  Então o campo é envolvido em aspas duplas e o CSV permanece válido
```

---

#### [ ] US-028 — Import & Auto-Add All

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ⚠️ | Depende de US-001 para persistência |
| Valiosa | ✅ | |
| Estimável | ⚠️ | Vago: "importar → todas as stories sem clique adicional" |
| Small | ⚠️ | ~5 SP |
| Testável | ⚠️ | AC pouco específico |

---

### SPRINT 3 — Features Inovadoras ⭐

#### [x] US-009 — BDD Gherkin Studio ⚠️ PARCIALMENTE IMPLEMENTADO

Export `.feature` existe. Editor dedicado com coverage indicator não.

| INVEST | Status | Observação |
|--------|--------|------------|
| Small | ❌ | >8 SP (editor + geração + validador + export) — **DIVIDIR** |
| Testável | ⚠️ | Falta: história sem AC, AC malformado, export com erro |

---

#### [x] US-010 — Story Risk Radar ⚠️ PARCIALMENTE IMPLEMENTADO

Base implementada. Faltam tipos `Compliance` e `Rollout` em `validation.model.ts` (QW-002).

---

#### [~] US-011 — Reasoned Estimation Engine 🔴 BLOQUEADA

| INVEST | Status | Observação |
|--------|--------|------------|
| Independente | ⚠️ | Acoplado a "calibração por time" (não existe) |
| **Estimável** | ❌ | **AC completamente ausentes** |
| **Small** | ❌ | >13 SP — **DIVIDIR** |
| **Testável** | ❌ | **Sem AC** |

**AC em Gherkin (proposta):**
```gherkin
Cenário: Estimativa com justificativa técnica
  Dado que uma história foi gerada
  Quando a IA calcula a estimativa
  Então exibe: camadas impactadas (UI/Backend/Banco/Integração), complexidade por camada e justificativa narrativa
  E o total de horas é consistente com a soma das tarefas de desenvolvimento

Cenário: História grande demais
  Dado que a estimativa calculada ultrapassa 8 story points
  Então o sistema exibe alerta "História grande — considere decompor"
  E sugere como dividir em 2+ stories menores

Cenário: Score de confiança
  Dado que a estimativa foi gerada
  Então um score de confiança (Alta/Média/Baixa) é exibido junto à estimativa
  E o score reflete a quantidade de informação disponível na descrição
```

**Decomposição necessária:** Ver seção 10.

---

#### [x] US-012 — Architecture Lens (C4) ✅ IMPLEMENTADO

---

#### [x] US-013 — Backlog Analysis (Dependências + Riscos) ✅ IMPLEMENTADO

---

#### [ ] US-014 — DoR Gatekeeper 🔴 BLOQUEADA

| INVEST | Status | Observação |
|--------|--------|------------|
| **Estimável** | ❌ | "Quais campos são configuráveis?" — indefinido |
| **Small** | ❌ | >8 SP |
| **Testável** | ❌ | Sem AC |

**Próximo passo:** Sessão de refinamento para definir:
- Campos obrigatórios fixos vs. configuráveis
- Interface de configuração (lista de checkboxes? formulário?)
- Comportamento quando reprovado (bloqueia? avisa? sugere?)

---

#### [ ] US-015 — Persona Context Engine 🔴 BLOQUEADA

| INVEST | Status | Observação |
|--------|--------|------------|
| **Estimável** | ❌ | Sem AC, sem interface, escopo indefinido |
| **Small** | ❌ | >13 SP |
| **Testável** | ❌ | Sem AC |

**Decomposição necessária:** Ver seção 10.

---

#### [ ] US-016 — Sprint Simulation 🔴 BLOQUEADA

| INVEST | Status | Observação |
|--------|--------|------------|
| **Estimável** | ❌ | "Dividir em 2 stories" — ainda não feito |
| **Small** | ❌ | >13 SP |
| **Testável** | ❌ | Sem AC |

**Decomposição necessária:** Ver seção 10.

---

### SPRINT 4 — Integrações e Colaboração (v2)

#### [ ] US-017 — Integração com Jira

| INVEST | Status | Observação |
|--------|--------|------------|
| Testável | ⚠️ | Falta cenário: história já existe no Jira |

**AC adicional necessário:**
```gherkin
Cenário: Issue já existe no Jira
  Dado que a história já foi exportada anteriormente
  Quando o usuário tenta exportar novamente
  Então o sistema pergunta "Issue JA-123 já existe. Atualizar ou criar nova?"
```

---

#### [ ] US-018 — Integração com Linear

**Status:** Sem AC. Não está pronta para sprint.

---

#### [ ] US-019 — Compartilhamento (link público read-only)

**AC em Gherkin:**
```gherkin
Cenário: Link compartilhado funciona
  Dado que o PO gerou um link público
  Quando um visitante acessa o link sem conta
  Então visualiza o backlog em modo read-only sem controles de edição

Cenário: Revogação imediata
  Quando o PO revoga o link
  Então acessar o link exibe "Este backlog não está mais disponível"
  E a revogação é efetiva em menos de 5 segundos
```

---

#### [ ] US-020 — Colaboração em tempo real

**AC adicional necessário:**
```gherkin
Cenário: Conflito de edição simultânea
  Dado que dois usuários editam o mesmo campo ao mesmo tempo
  Quando ambos tentam salvar
  Então o segundo usuário vê "Este campo foi editado por [nome]. Suas alterações foram preservadas."
  E pode escolher sobrescrever ou descartar
```

---

### Qualidade e DevX

| Story | Status | SP | AC OK? | Observação |
|-------|--------|----|--------|------------|
| US-021 — ESLint + Prettier | [ ] | 3 | ⚠️ | Falta: quais regras Angular específicas? |
| US-022 — CDN local (marked + tailwind) | [ ] | 3 | ⚠️ | Falta: teste de build sem internet |
| US-023 — CI/CD GitHub Actions | [ ] | 5 | ⚠️ | Falta: timeout policies, retry |
| US-024 — Env vars seguras (skip-worktree) | [x] | — | ✅ | **Concluído** (migrado para OpenAI) |
| US-025 — Testes unitários GeminiService | [ ] | 5 | ❌ | **DIVIDIR em 3 stories** |
| US-026 — Testes E2E Playwright | [ ] | 8 | ⚠️ | Falta: definir exatamente os 3 fluxos |
| US-027 — Hook tsc incremental | [ ] | 2 | ✅ | AC claro |
| US-028 — Pre-commit hook (bloqueia chave) | [ ] | 1 | ✅ | AC claro |

---

## 4. Definition of Ready — Status por Story

| Story | Persona | AC Gherkin | Dependências | Estimativa | Bloqueadores | DoR |
|-------|---------|------------|--------------|------------|--------------|-----|
| SEC-001 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **PRONTA** |
| US-001 | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ SEC-001 | ❌ Split |
| US-002 | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ AC refinar |
| US-004 | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ AC refinar |
| US-006 | ✅ | ❌ | ⚠️ | ❌ | ⚠️ validar valor | ❌ |
| US-007 | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ campos indefinidos | ❌ |
| US-008 | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ AC refinar |
| US-011 | ✅ | ❌ | ❌ | ❌ | ❌ AC ausentes | ❌ |
| US-014 | ✅ | ❌ | ❌ | ❌ | ❌ escopo vago | ❌ |
| US-015 | ⚠️ | ❌ | ❌ | ❌ | ❌ indefinida | ❌ |
| US-016 | ✅ | ❌ | ❌ | ❌ | ❌ precisar dividir | ❌ |

**Resultado: 1/11 stories prontas para sprint (SEC-001)**

---

## 5. Critérios de Aceite em Gherkin — Reescritas Necessárias

### Problema
Praticamente nenhuma story tem AC no formato testável `Dado-Quando-Então`. Os AC atuais estão em linguagem natural (prosa), o que impede geração automática de testes E2E.

### Comparação

**AC atual (prosa):**
> "Dado que a quota do Groq é excedida, quando uma chamada de IA falha, então exibe mensagem de limite atingido"

**AC necessário (Gherkin testável):**
```gherkin
Cenário: Rate limit atingido
  Dado que a quota de requisições da API está esgotada
  Quando o usuário clica em "Refinar História"
  Então exibe toast "Limite de uso da IA atingido. Tente novamente em alguns minutos."
  E o botão "Refinar" é desabilitado por 60 segundos
  E um contador regressivo aparece no botão
```

### Cobertura mínima por AC

Cada story deve ter cenários para:
| Tipo | Obrigatório |
|------|-------------|
| Caminho feliz (happy path) | ✅ |
| Validação de campo | ✅ quando há formulário |
| Erro / falha | ✅ |
| Edge case específico | ✅ |
| Acessibilidade (keyboard nav) | ⚠️ features de UI |
| Performance (tempo < Xs) | ⚠️ features críticas |

### Mínimo de AC por tamanho

| Story Points | AC mínimos |
|--------------|------------|
| 1-2 SP | 3-4 cenários |
| 3-5 SP | 4-6 cenários |
| 8 SP | 5-8 cenários |
| >8 SP | **Dividir a story** |

---

## 6. Gaps PRD vs Implementação

| Funcionalidade PRD | Implementado | Status | Gap |
|-------------------|-------------|--------|-----|
| Autenticação Supabase | ✅ email/senha | OK | — |
| Dashboard de projetos | ✅ localStorage | ⚠️ | Falta US-001 (cloud) |
| Refinamento estratégico | ✅ gpt-4o | OK | Falta cobertura testes |
| Importação PDF/Word | ✅ pdfjs + mammoth | OK | — |
| Backlog hierárquico Épico>Feature>Story | ✅ | OK | — |
| Edição inline de título | ✅ | OK | — |
| Geração PRD/Spec enriquecida | ✅ | OK | — |
| Export `.feature` Gherkin | ✅ básico | ⚠️ | Falta Studio dedicado |
| Análise de Dependências modal | ✅ | OK | — |
| Risk Radar com tipos | ✅ parcial | ⚠️ | Faltam tipos Compliance/Rollout (QW-002) |
| Diagramas C4 Context/Container/Sequência | ✅ | OK | — |
| Reordenação up/down | ✅ | OK | — |
| **Validação INVEST das stories** | ❌ | 🔴 GAP CRÍTICO | Funcionalidade prometida no PRD, não existe no código |
| **Persistência Supabase (backlog)** | ❌ localStorage | 🔴 GAP CRÍTICO | Risco de perda de dados |
| **Toast / Error handling** | ❌ catch genérico | 🔴 GAP CRÍTICO | UX quebrada em erros |
| **Proxy API (SEC-001)** | ❌ | 🔴 GAP SEGURANÇA | Não vai a produção sem isso |
| DoR Gatekeeper | ❌ | Gap v2 | US-014 indefinida |
| Backlog Health Score | ❌ | Gap v2 | US-013 parcial |
| Sprint Simulation | ❌ | Gap v2 | US-016 bloqueada |
| Persona Context Engine | ❌ | Gap v2 | US-015 bloqueada |
| Integração Jira/Linear | ❌ | v2.0 | Fora do escopo v1 |
| Colaboração Realtime | ❌ | v2.0 | Fora do escopo v1 |

---

## 7. Análise do Modelo de Dados RefinedStory

### Cobertura atual de `validation.model.ts`

| Campo | Gerado pela IA | AC Coberto | Testado | Observação |
|-------|---------------|------------|---------|------------|
| `title` | ✅ | ✅ | ✅ | OK |
| `epicSuggestion` | ✅ | ✅ | ✅ | OK |
| `featureSuggestion` | ✅ | ✅ | ✅ | OK |
| `userPersona` | ✅ | ✅ | ✅ | OK |
| `businessNarrative` | ✅ | ✅ | ⚠️ | Pouco testado |
| `acceptanceCriteria` | ✅ | ✅ | ⚠️ | **Não está em Gherkin** |
| `acceptanceCriteriaSummary` | ✅ | ⚠️ | ⚠️ | Redundante com AC? |
| `testScenarios.e2e` | ✅ | ✅ | ❌ | Gerado, não validado |
| `testScenarios.integration` | ✅ | ✅ | ❌ | Gerado, não validado |
| `testScenarios.unit` | ✅ | ✅ | ❌ | Gerado, não validado |
| `storyEstimate` | ✅ | ✅ | ✅ | OK |
| `storyEstimateJustification` | ✅ | ⚠️ | ⚠️ | Presente, falta calibração |
| `developmentTasks` | ✅ | ⚠️ | ❌ | Estrutura OK, sem testes |
| `potentialEdgeCases` | ✅ | ❌ | ❌ | **Gerado mas não incluso nos AC** |
| `technicalConsiderations` | ✅ | ❌ | ❌ | **Gerado mas não incluso nos AC** |
| `identifiedDependencies` | ✅ | ⚠️ | ❌ | Análise existe; AC não menciona |
| `questions` | ✅ | ❌ | ❌ | Gerado mas nunca respondido/resolvido |
| `riskAnalysis` | ✅ | ⚠️ | ❌ | **Faltam tipos Compliance e Rollout** |

### Campos ausentes — recomendados adicionar

```typescript
// Em validation.model.ts

interface RefinedStory {
  // ... campos existentes ...
  
  // Novo: resultado da validação INVEST automática
  investAnalysis?: {
    independent: boolean;
    negotiable: boolean;
    valuable: boolean;
    estimable: boolean;
    small: boolean;
    testable: boolean;
    score: number; // 0-6
    issues: string[]; // lista de problemas encontrados
  };

  // Novo: status de DoR para sprint readiness
  dorStatus?: 'ready' | 'needs-refinement' | 'blocked';
  dorIssues?: string[]; // lista do que falta para DoR

  // Novo: auditoria
  createdAt?: number;
  approvedAt?: number;
  approvedBy?: string;
}
```

### Bug conhecido — QW-002

`Risk.type` em `validation.model.ts` (linha 36) não inclui `'Compliance'` e `'Rollout'` apesar do prompt da IA gerar esses tipos. Correção: 5 minutos.

```typescript
// ATUAL (incorreto)
type: 'Técnico' | 'Negócio' | 'Usabilidade';

// CORRETO
type: 'Técnico' | 'Negócio' | 'Usabilidade' | 'Compliance' | 'Rollout';
```

---

## 8. Priorização WSJF

**WSJF = (Valor de Negócio + Urgência + Redução de Risco) / Tamanho do Job**

| Story | Valor | Urgência | Risco | Tamanho | WSJF | Prioridade |
|-------|-------|----------|-------|---------|------|------------|
| **SEC-001** | 10 | 10 | 10 | 1 | **30** | 🔴 IMEDIATO |
| **US-002** | 8 | 8 | 7 | 2 | **11.5** | 🔴 Sprint 1 |
| **US-001-a** (tabela Supabase) | 9 | 8 | 8 | 2 | **12.5** | 🔴 Sprint 1 |
| **US-004** | 7 | 6 | 4 | 1 | **8.5** | 🟠 Sprint 2 |
| **US-008** (CSV) | 7 | 5 | 3 | 1 | **7.5** | 🟠 Sprint 2 |
| **US-007** (busca) | 6 | 5 | 3 | 2 | **7.0** | 🟠 Sprint 2 |
| **US-011** (estimativa) | 8 | 4 | 5 | 3 | **5.7** | 🟡 Sprint 3 |
| **US-009** (Gherkin Studio) | 8 | 4 | 4 | 3 | **5.3** | 🟡 Sprint 3 |
| **US-015** (personas) | 7 | 3 | 4 | 4 | **3.5** | 🔵 v1.1 |
| **US-016** (sim. sprint) | 7 | 3 | 4 | 5 | **2.8** | 🔵 v1.1 |
| US-017/018 (integrações) | 6 | 2 | 2 | 5 | **2.0** | 🔵 v2.0 |

---

## 9. Quick Wins — Menos de 1h

Correções de alto impacto que podem ser feitas imediatamente:

| # | Quick Win | Arquivo | Esforço | Impacto |
|---|-----------|---------|---------|---------|
| **QW-001** | Remover `@google/genai` do package.json | `package.json` | 2min | Reduz bundle ~150KB |
| **QW-002** | Adicionar `'Compliance' \| 'Rollout'` ao `Risk.type` | `validation.model.ts:35` | 5min | Tipos corretos para Risk Radar |
| **QW-003** | Wrap `JSON.parse(localStorage)` em try/catch | `app.component.ts` | 10min | Previne crash com dados corrompidos |
| **QW-004** | Remover `console.log('Successfully corrected...')` | `gemini.service.ts:~580` | 2min | Remove log de produção |
| **QW-005** | Instalar `@types/marked` e remover `declare var marked: any` | 2 arquivos | 10min | Type safety |
| **QW-006** | `.angular/cache` no `.gitignore` | `.gitignore` | 2min | ✅ Já feito (BUG-02) |

---

## 10. Decomposições Necessárias

### US-001 → 3 stories

| Sub-story | Descrição | SP | Depende de |
|-----------|-----------|-----|------------|
| US-001-a | Criar tabela `backlogs` no Supabase + BacklogService com CRUD básico | 3 | SEC-001 |
| US-001-b | Migrar localStorage → Supabase com sync bidirecional | 5 | US-001-a |
| US-001-c | Modo offline + fila de sync automático ao reconectar | 5 | US-001-b |

### US-011 → 2 stories

| Sub-story | Descrição | SP |
|-----------|-----------|-----|
| US-011-a | Estimativa com justificativa técnica por camada (UI/Backend/Banco/Integração) | 5 |
| US-011-b | Score de confiança + sugestão de decomposição para histórias >8 SP | 5 |

### US-015 → 2 stories

| Sub-story | Descrição | SP |
|-----------|-----------|-----|
| US-015-a | Cadastro e gestão de personas (nome, objetivos, frustrações, contexto técnico) | 3 |
| US-015-b | Seleção automática de persona mais relevante durante geração de histórias | 5 |

### US-016 → 2 stories

| Sub-story | Descrição | SP |
|-----------|-----------|-----|
| US-016-a | Input de capacidade da equipe (velocity, disponibilidade, fator de risco) | 2 |
| US-016-b | Simulação de sprint com 3 cenários (Otimista/Realista/Pessimista) + negociação de escopo | 8 |

### US-025/026 (Testes) → 3 stories

| Sub-story | Descrição | SP |
|-----------|-----------|-----|
| US-026-a | Unit tests GeminiService (mock OpenAI, cobrir: refine, discover, analyze) | 5 |
| US-026-b | Unit tests AuthService + DocumentService | 3 |
| US-026-c | E2E Playwright: login → refinar história → exportar PRD | 8 |

---

## 11. Plano de Ação Priorizado

### Semana 1 — Desbloquear produção

| # | Ação | Esforço | Resultado |
|---|------|---------|-----------|
| 1 | ✅ Resolver **SEC-001** (proxy Vercel serverless) | 3h | App apta para produção |
| 2 | ✅ **QW-002** — Risk.type correto | 5min | Risk Radar completo |
| 3 | ✅ **QW-003** — try/catch JSON.parse | 10min | Previne crash |
| 4 | ✅ **QW-004** — Remover console.log | 2min | Código limpo |
| 5 | ✅ Sessão de refinamento **US-011** (1h) — draft AC Gherkin | 1h | Story pronta para sprint |

### Semana 2-3 — Sprint de qualidade

| # | Ação | Esforço |
|---|------|---------|
| 6 | Converter **todas as AC para Gherkin** (US-001 a US-008) | 4-6h |
| 7 | Implementar **US-002** (ToastService + classifyError) | 1 sprint |
| 8 | Implementar **US-001-a** (tabela Supabase + BacklogService básico) | 1 sprint |
| 9 | Sessão de decomposição: **US-015** + **US-016** | 1h |

### Semana 4+ — Cobertura e DevX

| # | Ação |
|---|------|
| 10 | Iniciar **US-026-c** (E2E Playwright — 3 fluxos críticos) |
| 11 | Implementar **US-023** (CI/CD GitHub Actions) |
| 12 | Iniciar **US-026-a** (Unit tests GeminiService) |
| 13 | Implementar **US-001-b** (sync bidirecional Supabase) |

### v1.1 — Features inovadoras completas

| # | Ação |
|---|------|
| 14 | Implementar **US-011** (Reasoned Estimation com score) |
| 15 | Implementar **US-015** (Persona Context Engine) |
| 16 | Implementar **US-016** (Sprint Simulation) |
| 17 | Evoluir **US-014** (DoR Gatekeeper) |
| 18 | Evoluir **US-013** (Backlog Health Score completo) |

### v2.0 — Integrações

| # | Ação |
|---|------|
| 19 | US-017 — Jira OAuth |
| 20 | US-018 — Linear |
| 21 | US-019 — Share link público |
| 22 | US-020 — Supabase Realtime |

---

## 12. Análise Competitiva

| Concorrente | O que faz | O que não faz |
|-------------|-----------|---------------|
| Jira AI | Breakdown de épicos, sub-tarefas automáticas | Sem BDD real, sem estimativa argumentada, sem C4 |
| ClickUp AI | PRD, histórias, critérios básicos | Sem Gherkin, sem C4, qualidade variável |
| ChatPRD | PRD completo, revisão estilo CPO | Sem Gherkin, sem diagramas, sem estimativas |
| Productboard | Discovery com feedback real de usuários | Sem BDD, sem estimativas, caro |
| Linear AI | Triagem inteligente de issues | Sem geração de histórias, sem BDD, sem PRD |
| Aha! Roadmaps | Estratégia + roadmap + protótipos | Sem Gherkin, sem C4, scoring ≠ estimativa técnica |

**Gap principal:** Nenhum concorrente entrega a cadeia completa — da descrição bruta ao artefato de engenharia — em uma única sessão.

### Diferenciadores únicos do PO Agent AI

| Diferenciador | Status | Nenhum concorrente faz |
|---------------|--------|------------------------|
| BDD Gherkin gerado e exportável como `.feature` | ✅ Implementado | ✅ |
| Estimativa com justificativa técnica por camada | ⚠️ Parcial | ✅ |
| C4 Diagrama gerado a partir de histórias | ✅ Implementado | ✅ |
| Risk Radar por história (não por projeto) | ✅ Implementado | ✅ |
| Sprint Simulation (3 cenários) | ❌ Pendente | ✅ |
| DoR Gatekeeper automático | ❌ Pendente | ✅ |
| Persona Context Engine | ❌ Pendente | ✅ |
| Backlog Health Score ativo | ❌ Pendente | ✅ |

---

*Documento gerado em análise Agile PO — jun/2026 | Framework: INVEST · Dado-Quando-Então · WSJF · DoR*
