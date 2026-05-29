# TODO — PO Agent AI

## Legenda
- `[ ]` pendente · `[x]` concluído · `[~]` em progresso · `[!]` bloqueado

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
- [x] Exportação de documentos
- [x] Expansão detalhada de critérios de aceite
- [x] Geração de diagramas C4 e docs técnicas
- [x] Conversão de testes para Jest/Mocha
- [x] ECC rules instaladas (.claude/rules/ecc/)
- [x] CLAUDE.md, PRD.md, SPEC.md, TODO.md criados

---

## Alta Prioridade

- [ ] **Persistência em nuvem** — migrar backlogs de `localStorage` para Supabase (tabela `backlogs`)
- [ ] **Sincronização multi-dispositivo** — usuário acessa o mesmo backlog de qualquer browser
- [ ] **Testes unitários** — cobertura mínima 80% nos services (`GeminiService`, `AuthService`, `DocumentService`)
- [ ] **Testes E2E** — fluxo de login → criar projeto → refinar história → exportar
- [ ] **Tratamento de erros** — mensagens de erro específicas para falha de auth, quota Groq, documento inválido
- [ ] **Loading states** — skeleton loading em vez de spinner genérico
- [ ] **Validação de formulários** — login/register com feedback visual em tempo real

---

## Média Prioridade

- [ ] **Edição inline de histórias** — editar campos de uma RefinedStory no backlog sem re-processar
- [ ] **Reordenação de backlog** — drag-and-drop de histórias dentro de features
- [ ] **Busca no backlog** — filtrar histórias por título, épico ou feature
- [ ] **Export para CSV** — planilha com todas as histórias e estimativas
- [ ] **Compartilhamento de projeto** — gerar link público (read-only) de um backlog
- [ ] **Desfazer/refazer** — histórico de alterações no backlog
- [ ] **Suporte a múltiplos idiomas** — inglês além do português
- [ ] **Tema claro** — alternativa ao dark mode atual

---

## Qualidade e DevX

- [ ] **Remover dependência do CDN** — bundlar `marked` e `tailwindcss` localmente (sem CDN em produção)
- [ ] **Configurar ESLint** — `ng lint` com regras Angular recomendadas
- [ ] **Configurar Prettier** — formatação automática em `.ts` e `.html`
- [ ] **CI/CD** — pipeline GitHub Actions: build + lint + testes
- [ ] **Variáveis de ambiente seguras** — substituir environment.ts por secrets no CI (não commitar chaves)
- [ ] **Rate limiting** — debounce nas chamadas à API Groq, feedback de quota
- [ ] **Offline feedback** — aviso claro quando sem conexão

---

## Futuro (v2)

- [ ] **Integração Jira** — exportar histórias diretamente para Jira
- [ ] **Integração Linear** — criar issues no Linear a partir do backlog
- [ ] **Colaboração em tempo real** — múltiplos POs editando o mesmo backlog (Supabase Realtime)
- [ ] **Comentários por história** — anotações colaborativas em cada história
- [ ] **Versionamento de histórias** — histórico de refinamentos de uma mesma história
- [ ] **Modelos customizáveis** — o PO configura o template de saída da IA
- [ ] **API pública** — endpoints REST para integrar com outras ferramentas
- [ ] **Mobile** — Progressive Web App (PWA) com suporte offline

---

## Bugs Conhecidos

- [ ] `angular.json` não deve conter a chave Groq real — usar placeholder `__GROQ_API_KEY__` no git e substituir localmente
- [ ] `.angular/cache` estava sendo commitado — resolvido com `.gitignore` atualizado
- [ ] Arquivos com `:` no nome no branch `feature/document-import` impedem `git checkout` no Windows
