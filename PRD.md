# PRD — PO Agent AI

**Versão:** 1.0  
**Status:** Em desenvolvimento  
**Stack:** Angular 20 + Groq (Llama 3.3 70B) + Supabase

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

## 5. Fora do Escopo (v1.0)

- Integração com Jira/Linear/Azure DevOps
- Colaboração em tempo real (multi-usuário)
- Sincronização em nuvem de backlogs (localStorage only)
- Mobile app
- Versionamento de histórias

---

## 6. Métricas de Sucesso

- Tempo médio de refinamento de uma história < 2 minutos
- Taxa de uso do critério BDD gerado sem edição > 60%
- NPS de POs usando a ferramenta ≥ 8
