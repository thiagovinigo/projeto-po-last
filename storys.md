# Stories & Roadmap — PO Agent AI

> Documento vivo. Combina backlog atual + features inovadoras identificadas em análise competitiva (jun/2026).
> Posicionamento único: **"O único produto que transforma uma ideia bruta em artefato de engenharia completo em uma única sessão."**

---

## Legenda
- `[ ]` pendente · `[x]` concluído · `[~]` em progresso · `[!]` bloqueado

---

## SPRINT 1 — Fundação Cloud (Alta Prioridade)

### US-001 — Persistência de backlog em nuvem
**Como** Product Owner,  
**Quero** que meu backlog seja salvo automaticamente no Supabase,  
**Para que** eu acesse meus projetos de qualquer dispositivo sem perder dados.

**Critérios de aceite:**
- Dado que o usuário está autenticado, quando ele criar ou editar uma história, então o backlog é salvo na tabela `backlogs` do Supabase em até 2 segundos
- Dado que o usuário abre o app em outro browser, quando o auth session estiver ativo, então o backlog carrega com todos os projetos salvos anteriormente
- Dado que há falha de rede, quando o usuário tenta salvar, então um aviso de "salvamento offline" é exibido e a sincronização ocorre ao reconectar

**Tarefas:** Criar tabela `backlogs` no Supabase · Criar `BacklogService` · Migrar chamadas de `localStorage` para o service · Sincronização bidirecional

---

### US-002 — Tratamento de erros com mensagens específicas
**Como** usuário,  
**Quero** ver mensagens de erro claras e acionáveis,  
**Para que** eu saiba exatamente o que deu errado e como resolver.

**Critérios de aceite:**
- Dado que a quota do Groq é excedida, quando uma chamada de IA falha, então exibe "Limite de uso da IA atingido. Tente novamente em X minutos."
- Dado que a autenticação expira, quando o usuário tenta uma ação protegida, então é redirecionado para login com mensagem explicativa
- Dado que o documento enviado é inválido, quando o processamento falha, então exibe o motivo específico (formato não suportado, arquivo corrompido, etc.)

**Tarefas:** Criar `ToastService` · Criar `classifyGroqError()` · Mapear erros Supabase para PT-BR · Substituir `console.error` por toast

---

### US-003 — Loading states com skeleton screens
**Como** usuário,  
**Quero** ver indicadores visuais de carregamento enquanto a IA processa,  
**Para que** eu entenda que o sistema está trabalhando e não travou.

**Critérios de aceite:**
- Dado que a IA está processando uma história, quando o tempo de espera ultrapassa 1 segundo, então um skeleton loader animado substitui o spinner genérico
- Dado que o backlog está carregando do Supabase, então cards skeleton aparecem no lugar dos projetos
- Dado que o processamento ultrapassa 15 segundos, então um indicador de progresso por etapas é exibido ("Analisando... Gerando critérios... Estimando...")

**Tarefas:** Criar componentes `SkeletonCard`, `SkeletonStory` · Remover spinners genéricos · Adicionar progress steps para chamadas longas

---

### US-004 — Validação de formulários em tempo real
**Como** usuário,  
**Quero** ver feedback imediato nos campos de login e cadastro,  
**Para que** eu corrija erros antes de submeter o formulário.

**Critérios de aceite:**
- Dado que o usuário digita um email inválido, quando o campo perde o foco, então uma mensagem de validação aparece em vermelho imediatamente
- Dado que a senha tem menos de 6 caracteres, então o botão de submeter fica desabilitado com indicação do requisito mínimo
- Dado que as senhas não coincidem no cadastro, então o erro aparece no campo "confirmar senha" em tempo real

---

## SPRINT 2 — Qualidade do Backlog (Média Prioridade)

### US-005 — Edição inline de histórias no backlog
**Como** Product Owner,  
**Quero** editar campos de uma história diretamente no backlog sem re-processar pela IA,  
**Para que** eu faça ajustes rápidos sem perder o trabalho gerado.

**Critérios de aceite:**
- Dado que o usuário clica em um campo de uma história no backlog, então o campo se torna editável inline
- Dado que o usuário confirma a edição, então a história é atualizada imediatamente no backlog (e no Supabase)
- Dado que o usuário cancela, então o valor original é restaurado sem salvar

---

### US-006 — Drag-and-drop para reordenar backlog
**Como** Product Owner,  
**Quero** reordenar histórias dentro do backlog por arrastar e soltar,  
**Para que** eu organize a prioridade visualmente sem precisar re-numerar manualmente.

**Critérios de aceite:**
- Dado que o usuário arrasta uma história, quando solta em nova posição dentro da mesma Feature, então a ordem é atualizada e persiste
- Dado que o usuário arrasta entre Features diferentes, então a história é movida de Feature mantendo todos os seus dados

---

### US-007 — Busca e filtros no backlog
**Como** Product Owner,  
**Quero** filtrar histórias por título, épico, feature ou status,  
**Para que** eu encontre rapidamente o que preciso em backlogs grandes.

**Critérios de aceite:**
- Dado que o usuário digita no campo de busca, então as histórias são filtradas em tempo real (debounce 300ms)
- Dado que o usuário seleciona um filtro de Épico, então apenas histórias daquele épico são exibidas
- Dado que nenhuma história corresponde à busca, então uma mensagem "Nenhuma história encontrada" é exibida

---

### US-008 — Export para CSV
**Como** Product Owner,  
**Quero** exportar todas as histórias do backlog para CSV,  
**Para que** eu importe no Excel, Google Sheets ou ferramentas de PM que aceitem planilha.

**Critérios de aceite:**
- Dado que o usuário clica em "Exportar CSV", então um arquivo é baixado com colunas: Épico, Feature, Título, Persona, Estimativa, Status
- Dado que o backlog tem formatação markdown nos critérios, então o CSV exporta texto puro sem caracteres especiais

---

## SPRINT 3 — Features Inovadoras (Diferenciação)

> Baseadas em análise competitiva: nenhum concorrente entrega essas capacidades.

---

### US-009 — BDD Gherkin Studio com sync para QA ⭐
**Como** Product Owner ou QA Engineer,  
**Quero** um editor dedicado de cenários BDD que gere Given/When/Then completos,  
**Para que** o arquivo `.feature` esteja pronto para uso direto em Cucumber/Playwright sem retrabalho.

**Por que é único:** Nenhuma ferramenta de PM entrega exportação real de `.feature` integrada com toolchain de BDD.

**Critérios de aceite:**
- Dado que a história tem critérios de aceite gerados, quando o usuário abre o Gherkin Studio, então cenários Given/When/Then são gerados para happy path, caminhos alternativos e cenários de falha
- Dado que o usuário clica em "Exportar .feature", então um arquivo Gherkin válido é baixado pronto para uso em Cucumber ou Playwright
- Dado que novos critérios são adicionados, então o Gherkin Studio indica quais fluxos ainda não têm cenário escrito (coverage indicator)

**Tarefas:** Criar componente `GherkinStudio` · Criar prompt especializado para geração BDD estruturada · Implementar validador de cobertura · Implementar download de `.feature`

---

### US-010 — Story Risk Radar — análise de riscos por história ⭐
**Como** Product Owner,  
**Quero** ver uma análise de riscos estruturada para cada história,  
**Para que** eu identifique bloqueios antes do sprint e negocie escopo com antecedência.

**Por que é único:** O mercado faz análise de risco no nível de projeto. Ninguém desce ao nível da história individual com raciocínio técnico.

**Critérios de aceite:**
- Dado que uma história é gerada, então o Risk Radar exibe riscos em 4 categorias: Técnico, Dependência, Compliance, Rollout
- Dado que um risco é identificado, então ele vem com severidade (baixa/média/alta) e sugestão de mitigação específica
- Dado que a história envolve dados pessoais, então o sistema automaticamente adiciona risco de compliance (LGPD/GDPR) sem necessidade de input do PO

---

### US-011 — Reasoned Estimation Engine — estimativa com argumento técnico ⭐
**Como** Tech Lead ou Product Owner,  
**Quero** receber estimativas de desenvolvimento com justificativa técnica detalhada,  
**Para que** as estimativas sejam defensáveis para stakeholders e o time entenda o raciocínio.

**Por que é único:** Concorrentes usam velocity histórica ou scoring frameworks. Ninguém usa LLM para raciocinar sobre complexidade técnica intrínseca de uma história específica.

**Critérios de aceite:**
- Dado que uma história é gerada, então a estimativa inclui: camadas impactadas (UI, backend, banco, integração, infra), complexidade por camada, fatores de incerteza e o raciocínio narrativo
- Dado que a estimativa ultrapassa 8 story points, então o sistema sugere decompor a história com sugestão de como dividir
- Dado que o Tech Lead discorda, então ele pode registrar contra-argumento que fica salvo no histórico de calibração

---

### US-012 — Architecture Lens — C4 a partir de histórias ⭐
**Como** Tech Lead,  
**Quero** gerar diagramas C4 de Contexto e Container a partir de um conjunto de histórias,  
**Para que** a arquitetura seja definida antes do desenvolvimento começar, não depois.

**Por que é único:** Ferramentas de diagrama partem de código existente. A geração de C4 a partir de requisitos de negócio não existe em nenhum produto.

**Critérios de aceite:**
- Dado que o usuário seleciona um Épico ou Feature completa, quando clica em "Gerar Arquitetura", então o sistema produz diagrama C4 Context e Container em Mermaid
- Dado que o diagrama é gerado, então um diagrama de sequência para o fluxo principal é incluído
- Dado que o usuário altera as histórias, então pode regenerar os diagramas com um clique

---

### US-013 — Backlog Health Score — monitor de qualidade contínuo ⭐
**Como** Product Owner,  
**Quero** um score de saúde do meu backlog com alertas acionáveis,  
**Para que** eu mantenha o backlog sempre pronto para o sprint sem revisão manual.

**Por que é único:** Ferramentas de backlog são passivas. Nenhuma monitora ativamente a qualidade e completude como sistema de alerta.

**Critérios de aceite:**
- Dado que o backlog tem histórias sem critérios de aceite, então o Health Score reflete isso e lista as histórias afetadas
- Dado que há histórias com estimativa ausente ou muito alta (>13 pts), então o score penaliza e sugere ação
- Dado que duas histórias têm comportamentos conflitantes detectados semanticamente, então um alerta "Conflito potencial" é exibido com link para ambas

---

### US-014 — DoR Gatekeeper — Definition of Ready automatizado ⭐
**Como** Scrum Master ou Product Owner,  
**Quero** um gatekeeper automático que valide se uma história está pronta para o sprint,  
**Para que** histórias incompletas não entrem no planejamento e causem bloqueios durante o sprint.

**Por que é único:** DoR existe como conceito, mas como gate automatizado integrado ao fluxo de trabalho não existe em nenhuma ferramenta.

**Critérios de aceite:**
- Dado que o usuário tenta mover uma história para "Pronta para Sprint", então o DoR Gatekeeper executa validação: User Story correta, AC em Gherkin, estimativa, riscos avaliados
- Dado que algum critério falha, então a história é bloqueada com checklist do que falta
- Dado que a equipe tem critérios de DoR customizados, então o PO configura os requisitos obrigatórios vs. desejáveis

---

### US-015 — Persona Context Engine — histórias orientadas a persona real ⭐
**Como** Product Owner,  
**Quero** cadastrar personas do produto e ter as histórias geradas com contexto real de persona,  
**Para que** o "Para que" das histórias reflita a motivação real do usuário, não frases genéricas.

**Por que é único:** Ferramentas usam personas como metadado estático. Ninguém usa personas como contexto dinâmico no raciocínio de geração.

**Critérios de aceite:**
- Dado que o PO cadastrou personas (nome, objetivos, frustrações, contexto técnico), quando gera uma história, então o sistema seleciona automaticamente a persona mais relevante
- Dado que uma história serve múltiplas personas de formas conflitantes, então o sistema sugere divisão em sub-histórias por persona
- Dado que a persona é técnica (ex: Dev), então o nível de detalhe técnico da história é automaticamente ajustado

---

### US-016 — Sprint Simulation — simulação preditiva de sprint ⭐
**Como** Product Owner,  
**Quero** simular a execução do sprint antes de comprometer o escopo,  
**Para que** eu negocie com stakeholders com dados, não com intuição.

**Por que é único:** Sprint planning tools são estáticas. Simulação preditiva com cenários (otimista/realista/pessimista) não existe como produto.

**Critérios de aceite:**
- Dado que o PO seleciona histórias para o sprint e define a capacidade da equipe, quando clica em "Simular Sprint", então o sistema gera 3 cenários: Otimista, Realista e Pessimista
- Dado que há dependências entre histórias, então a ordem de implementação é considerada na simulação
- Dado que um risco se materializa no cenário Realista, então o sistema indica qual história seria impactada e sugere o que cortar para salvar o objetivo do sprint

---

## SPRINT 4 — Integrações e Colaboração (v2)

### US-017 — Integração com Jira
**Como** Product Owner,  
**Quero** exportar histórias diretamente para Jira,  
**Para que** eu não precise copiar e colar manualmente entre ferramentas.

**Critérios de aceite:**
- Dado que o usuário conecta sua conta Jira (OAuth), quando clica em "Exportar para Jira", então a história é criada como issue com Epic Link, critérios de aceite no campo description e estimativa nos story points
- Dado que a história já existe no Jira, então o sistema detecta e pergunta se deve atualizar ou criar nova

---

### US-018 — Integração com Linear
**Como** Product Owner ou Dev,  
**Quero** criar issues no Linear a partir do backlog do PO Agent AI,  
**Para que** o time de engenharia trabalhe na ferramenta que prefere sem perder o contexto de PM.

---

### US-019 — Compartilhamento de projeto (link público read-only)
**Como** Product Owner,  
**Quero** gerar um link público para compartilhar meu backlog,  
**Para que** stakeholders, devs externos ou auditores vejam sem precisar de conta.

**Critérios de aceite:**
- Dado que o usuário gera um link de compartilhamento, então o link dá acesso read-only ao backlog completo
- Dado que o usuário revoga o link, então ele para de funcionar imediatamente
- Dado que um visitante acessa o link, então ele pode navegar mas não editar nenhum conteúdo

---

### US-020 — Colaboração em tempo real (Supabase Realtime)
**Como** Product Owner,  
**Quero** que múltiplos membros do time editem o backlog simultaneamente,  
**Para que** refinements em grupo sejam feitos diretamente na ferramenta, sem conflitos.

**Critérios de aceite:**
- Dado que dois usuários abrem o mesmo projeto, então as edições de um aparecem para o outro em tempo real (Supabase Realtime)
- Dado que dois usuários editam o mesmo campo simultaneamente, então um mecanismo de lock previne conflito de edição

---

## Qualidade e DevX

### US-021 — Configurar ESLint + Prettier
- `ng lint` com regras Angular recomendadas
- Prettier formatando `.ts` e `.html` automaticamente

### US-022 — Bundlar dependências CDN localmente
- Remover `marked.js` e `tailwindcss` do CDN
- Bundlar com o Angular build para funcionar offline e sem dependência externa

### US-023 — Pipeline CI/CD
- GitHub Actions: build + lint + testes a cada push
- Deploy automático em ambiente de staging no Vercel

### US-024 — Variáveis de ambiente seguras
- Remover chaves hardcoded do `environment.ts` no git
- Usar `__GROQ_API_KEY__` como placeholder e substituir no CI

### US-025 — Testes unitários — cobertura 80%
- Cobrir `GeminiService`, `AuthService`, `DocumentService`
- Cobrir utilities de parsing de JSON da IA

### US-026 — Testes E2E com Playwright
- Fluxo: login → criar projeto → refinar história → exportar
- Fluxo: upload de PDF → backlog gerado → exportar PRD

---

## Bugs Conhecidos

| # | Descrição | Prioridade |
|---|-----------|-----------|
| BUG-01 | `angular.json` não deve conter a chave Groq real — usar placeholder no git | Alta |
| BUG-02 | `.angular/cache` estava sendo commitado — verificar `.gitignore` | Média |
| BUG-03 | Arquivos com `:` no nome no branch `feature/document-import` impedem `git checkout` no Windows | Média |

---

## Análise Competitiva — Resumo

| Concorrente | O que faz | O que não faz |
|-------------|-----------|---------------|
| Jira AI | Breakdown de épicos, sub-tarefas | Sem BDD, sem estimativa argumentada, sem C4 |
| ClickUp AI | PRD, histórias, critérios | Sem Gherkin, sem C4, qualidade variável |
| ChatPRD | PRD completo, revisão de estilo CPO | Sem Gherkin, sem diagramas, sem estimativas |
| Productboard | Discovery com feedback real | Sem BDD, sem estimativas, caro |
| Linear AI | Triagem inteligente | Sem geração de histórias, sem BDD, sem PRD |
| Aha! Roadmaps | Estratégia + roadmap + protótipos | Sem Gherkin, sem C4, scoring ≠ estimativa |

**Gap principal:** Nenhum produto entrega a cadeia completa — da descrição bruta ao artefato de engenharia — em uma única sessão.

---

## Posicionamento Único

> **"O PO Agent AI é o único produto que transforma uma ideia bruta em artefato de engenharia completo e pronto para desenvolvimento — User Story, BDD, testes, estimativa e arquitetura — em uma única sessão de trabalho."**

Público beachhead: Product Owners e Analistas de Negócio em empresas de tecnologia com 50–500 funcionários.

Vantagem sustentável: templates calibrados por domínio (fintech, healthtech, e-commerce) + histórico de calibração de estimativas por equipe.
