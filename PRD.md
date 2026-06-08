# PRD — PO Agent AI

**Versão:** 1.1  
**Status:** Em desenvolvimento  
**Stack:** Angular 20 + Groq (Llama 3.3 70B) + Supabase  
**Atualizado:** jun/2026 — pós análise competitiva

---

## 1. Visão do Produto

**PO Agent AI** é uma ferramenta web para Product Owners que transforma descrições funcionais brutas em histórias de usuário refinadas, backlogs estruturados e documentos de produto prontos para uso — tudo impulsionado por IA.

### Problema

POs gastam horas refinando histórias manualmente, escrevendo critérios de aceite, estimando tarefas e organizando o backlog. O processo é repetitivo, inconsistente entre times e difícil de escalar.

### Solução

Um agente de IA especializado em Product Management que, a partir de uma frase ou documento, gera automaticamente:
- Histórias de usuário no padrão INVEST
- Critérios de aceite em Gherkin (BDD)
- Cenários de teste (E2E, integração, unitário)
- Estimativas de desenvolvimento com justificativas
- Análise de riscos e dependências
- Backlog completo hierarquizado (Épico > Feature > História)
- Documentos exportáveis (PRD, Spec, Markdown)

---

## 2. Usuários-Alvo

| Perfil | Dor Principal |
|--------|--------------|
| Product Owner | Refinamento lento, critérios inconsistentes |
| Analista de Negócios | Dificuldade em decompor épicos em histórias |
| Tech Lead | Estimativas subjetivas, falta de tarefas técnicas detalhadas |
| Scrum Master | Backlog desorganizado, histórias sem critérios testáveis |

---

## 3. Funcionalidades

### 3.1 Autenticação (MVP)
- Cadastro com e-mail e senha via Supabase
- Login e logout
- Proteção de rotas (auth guard)
- Sessão persistida

### 3.2 Dashboard de Projetos
- Listagem de projetos (backlogs) do usuário
- Criar novo projeto com nome personalizado
- Navegar para o workspace do projeto
- Dados persistidos no localStorage

### 3.3 Refinamento de Histórias de Usuário
- Input de texto livre para descrever a funcionalidade
- Análise e refinamento via Groq (Llama 3.3 70B)
- Output estruturado com:
  - Título e sugestões de Épico/Feature
  - Persona do usuário (Como... quero... para...)
  - Narrativa de negócio (Problema → Solução → Impacto)
  - Critérios de aceite em BDD/Gherkin com cenários
  - Resumo dos critérios em bullet list
  - Cenários de teste E2E (Cypress), integração e unitários
  - Estimativa total e por tarefa
  - Tarefas de desenvolvimento detalhadas (Frontend, Backend, QA, DevOps)
  - Edge cases, considerações técnicas, dependências
  - Dúvidas para o time
  - Análise de riscos (Técnico, Negócio, Usabilidade)
- Divisão automática de histórias complexas em sub-histórias

### 3.4 Importação de Documentos
- Upload de PDF e Word (.docx)
- Extração de texto e processamento via IA
- Geração automática de backlog completo (Épicos > Features > Histórias)
- Cada história gerada com refinamento completo

### 3.5 Gerenciamento de Backlog
- Visualização hierárquica: Épico > Feature > História
- Adicionar/remover histórias do backlog
- Reordenação por drag-and-drop (planejado)
- Múltiplos backlogs por conta
- Informações do projeto editáveis (nome, contexto, objetivos)

### 3.6 Geração de Documentos
- PRD (Product Requirements Document) a partir do backlog
- Especificação técnica a partir do backlog
- Diagramas C4 (arquitetura de contêineres) via Mermaid
- Documentação técnica em Markdown
- Exportação para arquivo

### 3.7 Ferramentas Auxiliares
- Expansão detalhada de critérios de aceite
- Conversão de testes para Jest ou Mocha
- Histórico de análises da sessão
- Cópia de stories com um clique

---

## 4. Não-Funcional

| Requisito | Meta |
|-----------|------|
| Tempo de resposta da IA | < 30s por história |
| Tempo de carregamento inicial | < 3s |
| Suporte a navegadores | Chrome, Firefox, Safari (últimas 2 versões) |
| Responsividade | Desktop first (1024px+) |
| Segurança | API keys nunca expostas em produção |

---

## 5. Features Inovadoras (Diferenciação — Sprint 3)

> Baseadas em análise competitiva de jun/2026. Nenhum concorrente (Jira AI, ClickUp AI, ChatPRD, Productboard, Linear, Aha!) entrega essas capacidades.

### 5.1 BDD Gherkin Studio
Editor dedicado de cenários BDD com geração AI multicamada (happy path, alternativos, falhas). Exporta arquivos `.feature` prontos para Cucumber/Playwright. Indicador de cobertura de cenários.

### 5.2 Story Risk Radar
Análise de riscos estruturada por história em 4 dimensões: Técnico, Dependência, Compliance (LGPD/GDPR automático), Rollout. Cada risco com severidade e sugestão de mitigação.

### 5.3 Reasoned Estimation Engine
Estimativa de story points com justificativa técnica detalhada: camadas impactadas (UI, backend, banco, integração), fatores de incerteza, raciocínio narrativo. Sugere decomposição quando > 8 pts.

### 5.4 Architecture Lens (C4 Generator)
Gera diagramas C4 Contexto e Container + diagrama de sequência a partir de histórias selecionadas. Spec técnica em Markdown gerada automaticamente.

### 5.5 Backlog Health Score
Monitor ativo de qualidade: histórias sem AC, violações INVEST, gaps de cobertura de testes, histórias duplicadas semanticamente, estimativas inconsistentes. Coach com ações priorizadas.

### 5.6 DoR Gatekeeper Automático
Validação automática de Definition of Ready configurável. Bloqueia histórias incompletas de entrar no sprint com checklist do que falta.

### 5.7 Persona Context Engine
Personas cadastradas usadas como contexto dinâmico na geração de histórias. Detecta conflitos de persona e sugere divisão. Ajusta nível de detalhe técnico por persona.

### 5.8 Sprint Simulation
Simula execução do sprint com 3 cenários (otimista/realista/pessimista) considerando capacity, dependências e riscos. Ferramenta de negociação de escopo com stakeholders.

---

## 6. Fora do Escopo (v1.0)

- Integração com Jira/Linear/Azure DevOps (v2)
- Colaboração em tempo real (v2)
- Mobile app
- Versionamento de histórias (v2)

---

## 7. Posicionamento Único

> **"O único produto que transforma uma ideia bruta em artefato de engenharia completo — User Story, BDD, testes, estimativa e arquitetura — em uma única sessão de trabalho."**

**Gap principal identificado:** Nenhum concorrente entrega a cadeia completa da descrição bruta ao artefato técnico. O mercado está fragmentado entre ferramentas de discovery (Productboard, Aha!) e ferramentas de execução (Jira, Linear), sem ponte entre elas.

**Público beachhead:** Product Owners e Analistas de Negócio em empresas de tecnologia com 50–500 funcionários.

---

## 8. Métricas de Sucesso

- Tempo médio de refinamento de uma história < 2 minutos
- Taxa de uso do critério BDD gerado sem edição > 60%
- NPS de POs usando a ferramenta ≥ 8
- Backlog Health Score médio dos projetos ativos ≥ 80%
