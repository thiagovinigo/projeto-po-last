# PO Agent — Autenticação, Projetos e Backlog Validado

## Problem

Times de PO, PMs e produto escrevem histórias de usuário de formas inconsistentes, sem um validador que os guie a pensar em dependências, duplicatas e pendências. O resultado são projetos que falham, retrabalho e necessidade de retreinamento constante. Hoje o validador existe mas não está atrelado a um usuário nem a um projeto — o contexto se perde.

## Evidence

- Observação direta do criador da ferramenta: times de PO falhando recorrentemente na escrita de histórias
- Necessidade de retreinamento constante motivou a criação do validador atual
- Assumption — volume de falhas e retrabalho precisa de validação via métricas de uso após lançamento

## Users

- **Primary**: Product Owner, PM, membro de time de produto — profissional que escreve, refina e valida histórias de usuário dentro de um projeto de software
- **Not for**: desenvolvedores e stakeholders sem papel ativo no refinamento de histórias

## Hypothesis

Acreditamos que **uma plataforma com autenticação, dashboard de projetos e validação/refinamento de histórias integrado por projeto** irá **reduzir falhas e retrabalho nos times de PO** para **POs, PMs e times de produto**.
Saberemos que deu certo quando **POs usarem a ferramenta autonomamente, sem precisar de retreinamento constante, e gerarem backlogs com PRD e spec.md validados**.

## Success Metrics

| Metric | Target | How measured |
|---|---|---|
| Histórias validadas por usuário/semana | Crescimento semana a semana | Analytics de uso |
| Projetos criados e mantidos ativos | > 1 projeto ativo por usuário | Dashboard interno |
| Redução de retreinamento reportado | Percepção do criador | Feedback qualitativo |
| PRDs/spec.md gerados por projeto | ≥ 1 por projeto completo | Contagem de exports |

## Scope

**Esta entrega** é uma evolução do validador existente, não um MVP isolado. Tudo abaixo faz parte do escopo:

### Autenticação
- Cadastro de nova conta (e-mail + senha no mínimo)
- Login de conta existente
- Sessão persistida (usuário não perde contexto ao recarregar)

### Dashboard "Meus Projetos"
- Listagem de projetos do usuário autenticado
- Botão para criar novo projeto
- Acesso direto ao validador/refinador de histórias a partir do dashboard (evolução do fluxo atual)

### Projeto e Backlog
- Ao criar um projeto, o nome do produto é automaticamente o nome do backlog
- Nome do backlog é editável
- Dentro do projeto: visualização do backlog (histórias) e botão para validar/refinar nova história

### Validação e Refinamento de Histórias (evolução do que existe hoje)
- Validação individual de história (fluxo atual integrado ao projeto)
- Verificação de dependências entre histórias do mesmo backlog
- Detecção de duplicatas
- Sinalização de pendências

### Geração de Documentos
- Ao final do backlog ou a cada história validada: geração de PRD
- Geração de spec.md validado, refinado e incrementado por história

**Out of scope**
- Nenhum item foi explicitamente diferido pelo stakeholder nesta fase

## Delivery Milestones

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Autenticação | Usuário consegue criar conta e logar, sessão persiste | in-progress | `.claude/plans/po-agent-auth-projects.plan.md` |
| 2 | Dashboard de Projetos | Usuário vê seus projetos e cria novos a partir do dashboard | pending | — |
| 3 | Projeto com Backlog editável | Dentro do projeto, backlog com nome do produto editável e lista de histórias | pending | — |
| 4 | Integração do Validador | Fluxo de validar/refinar história existente integrado ao projeto/backlog | pending | — |
| 5 | Geração de PRD e spec.md | Exportação automática após validação de histórias | pending | — |

## Decisions

| Decisão | Escolha | Observação |
|---|---|---|
| Banco de dados | PostgreSQL | Persistência de projetos, backlogs e histórias |
| Backend / Auth | A definir | Supabase resolve auth + PostgreSQL gerenciado em uma decisão |
| Geração de PRD/spec.md | Nova funcionalidade | Não existe na base atual — milestone 5 é desenvolvimento do zero |

## Open Questions

- [ ] O validador atual será refatorado ou apenas encapsulado dentro do contexto de projeto?
- [ ] Backend de autenticação: Supabase (recomendado — inclui PostgreSQL + auth prontos) ou backend próprio + PostgreSQL separado?

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Escolha de backend de auth atrasada bloqueia toda a entrega | Alta | Alto | Decidir Supabase vs próprio antes de iniciar milestone 1 |
| Integração do validador existente exige refatoração significativa | Média | Médio | Mapear dependências do validador atual antes do milestone 4 |
| Geração de PRD/spec.md é funcionalidade nova e pode ser subestimada | Alta | Médio | Planejar milestone 5 separadamente com spike técnico |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
