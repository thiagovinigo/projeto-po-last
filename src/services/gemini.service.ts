import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { StrategicRefinementResult, TestScenarios, RefinedStory, ExtractedBacklogItems, BacklogItem, BacklogDependencyAnalysis, BacklogRiskAnalysis, ProjectInfo } from '../models/validation.model';
import { environment } from '../environments/environment';

export type DocumentKind = 'prd' | 'spec';

const MODEL = 'gpt-4o-mini';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private openai: OpenAI;

  constructor() {
    const apiKey = environment.apiKey;
    if (!apiKey || apiKey === '__OPENAI_API_KEY__') {
      throw new Error('API key não configurada. Defina apiKey em src/environments/environment.ts');
    }
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  private async chat(params: {
    messages: { role: string; content: string }[];
    response_format?: { type: string };
    temperature?: number;
    model?: string;
  }): Promise<{ choices: { message: { content: string | null } }[] }> {
    const result = await this.openai.chat.completions.create({
      model: params.model ?? MODEL,
      messages: params.messages as OpenAI.Chat.ChatCompletionMessageParam[],
      response_format: params.response_format as OpenAI.ResponseFormatJSONObject | undefined,
      temperature: params.temperature,
    }, { timeout: 90_000 });
    return result as unknown as { choices: { message: { content: string | null } }[] };
  }

  async refineUserStoryStrategic(story: string): Promise<StrategicRefinementResult> {
    const systemInstruction = `
      **Role:** Especialista em Gestão de Produtos Avançada, Análise de Requisitos, Escrita de User Stories, Planejamento Técnico e Organização de Backlog.
      **Department:** Product Management Estratégico, Agilidade Técnica e Engenharia de Software.
      **Task:** Analisar a complexidade de funcionalidades ou descrições. Se a funcionalidade for extensa ou muito complexa, dividi-la em User Stories menores e mais gerenciáveis. Para cada User Story (original ou resultante da divisão), transformá-la em uma história refinada e completa.
      **Task Description:** Você recebe uma descrição funcional. Primeiro, avalia se a descrição representa uma única User Story gerenciável ou se necessita ser dividida. Se a divisão for necessária, você propõe as User Stories filhas. Para cada User Story (original ou filha), você gera uma estrutura completa: título, sugestões de Épico e Feature, visão do usuário, narrativa de negócio, Critérios de Aceite (BDD) detalhados, um resumo conciso desses critérios, cenários de teste em três níveis, estimativa da User Story (em horas), detalhamento das tasks de desenvolvimento (com estimativas), e também listas de **Casos Extremos Potenciais**, **Considerações Técnicas**, **Dependências Identificadas**, **Dúvidas** e uma **Análise de Riscos** detalhada.

      **REGRAS:**
      1.  **Avaliação e Divisão:** Se a história for dividida, preencha o campo 'divisionAnalysis' com a justificativa. Caso contrário, deixe-o como string vazia.
      2.  **Estrutura Obrigatória por User Story:** Cada User Story gerada no array 'refinedStories' deve conter todos os campos definidos.
      3.  **Formatação dos Critérios de Aceite (BDD):** Formate os critérios de aceite estritamente no padrão Gherkin. Use '### Cenário:' para o título de cada cenário. Coloque as palavras-chave BDD (**Dado**, **Quando**, **Então**, **E**) em negrito no início de cada linha. **CRÍTICO: Deve haver exatamente uma linha em branco entre o final de um cenário e o início do próximo para separação visual.**
      4.  **Cenários de Teste (Múltiplos Níveis):** Gere cenários de teste em três níveis distintos:
          a.  **Testes End-to-End (E2E):** Use Cypress para simular fluxos de usuário completos.
          b.  **Testes de Integração:** Descreva testes que verificam a interação entre componentes ou serviços.
          c.  **Testes Unitários:** Forneça exemplos de testes unitários básicos para a lógica de negócio principal.
          Formate todo o código de teste dentro de blocos de código markdown.
      5.  **Resumo dos Critérios:** O campo 'acceptanceCriteriaSummary' DEVE ser formatado como uma lista de marcadores (bullet list) em markdown.
      6.  **Linguagem e Escopo:** Use linguagem objetiva. As estimativas devem ser para um time full-stack de nível pleno.
      7.  **Consistência de Estimativas:** O valor de 'tasksTotalEstimate' DEVE ser a soma exata das estimativas de todas as 'developmentTasks'. O valor de 'storyEstimate' DEVE ser idêntico ao valor de 'tasksTotalEstimate'.
      8.  **Formato:** Responda SEMPRE em português e no formato JSON estritamente conforme o schema abaixo.
      9.  **Qualidade das Dúvidas:** As perguntas no campo 'questions' DEVEM ser claras, acionáveis e direcionadas a pontos específicos.
      10. **Modelo de IA**: O campo 'model' deve ser preenchido com '${MODEL}'.
      11. **Justificativa da Estimativa Detalhada:** O campo 'storyEstimateJustification' deve fornecer análise detalhada justificando a estimativa total.
      12. **Análise de Riscos Abrangente:** O campo 'riskAnalysis' DEVE conter lista de riscos potenciais com 'type' ('Técnico', 'Negócio', 'Usabilidade', 'Compliance' ou 'Rollout'), 'severity' ('baixa', 'média' ou 'alta') e 'mitigationSuggestion'. Use 'Compliance' para riscos de LGPD/GDPR/PCI e 'Rollout' para riscos de deploy/feature-flag/rollback.

      **JSON SCHEMA OBRIGATÓRIO:**
      Retorne um objeto JSON com exatamente esta estrutura:
      {
        "model": "${MODEL}",
        "validationType": "strategic",
        "divisionAnalysis": "string (vazio se não dividido)",
        "refinedStories": [
          {
            "title": "string",
            "epicSuggestion": "string",
            "featureSuggestion": "string",
            "userPersona": "string",
            "businessNarrative": "string",
            "interfaceDetails": "string",
            "acceptanceCriteria": "string (formato Gherkin)",
            "acceptanceCriteriaSummary": "string (bullet list markdown)",
            "testScenarios": {
              "e2e": "string (código Cypress em markdown)",
              "integration": "string (código em markdown)",
              "unit": "string (código em markdown)"
            },
            "storyEstimate": "string (ex: 12h)",
            "storyEstimateJustification": "string",
            "developmentTasks": [
              {
                "name": "string",
                "responsibility": "string",
                "description": "string",
                "justification": "string",
                "estimate": "string",
                "technicalJustification": "string"
              }
            ],
            "tasksTotalEstimate": "string (ex: 12h)",
            "potentialEdgeCases": ["string"],
            "technicalConsiderations": ["string"],
            "identifiedDependencies": ["string"],
            "questions": ["string"],
            "riskAnalysis": [
              {
                "type": "Técnico|Negócio|Usabilidade|Compliance|Rollout",
                "severity": "baixa|média|alta",
                "description": "string",
                "mitigationSuggestion": "string"
              }
            ],
            "model": "${MODEL}"
          }
        ]
      }

      **CRITICAL: JSON OUTPUT MUST BE VALID.** Your final response MUST be a single, perfectly valid JSON object. Ensure all strings are properly terminated and any double-quote inside a string is escaped with backslash. Output ONLY the JSON, no markdown fences, no explanations.
    `;

    return this.generateValidation<StrategicRefinementResult>(story, systemInstruction);
  }

  async processDocumentForBacklog(
    documentContent: string,
    onProgress?: (step: string) => void
  ): Promise<ExtractedBacklogItems[]> {
    // Fase 1: descoberta
    onProgress?.('Fase 1/2: identificando histórias nos documentos...');
    const outlines = await this.discoverStoryOutlines(documentContent);
    if (outlines.length === 0) return [];

    onProgress?.(`Fase 1/2 concluída: ${outlines.length} histórias identificadas. Iniciando refinamento...`);

    // Fase 2: refina cada história individualmente
    const allItems: ExtractedBacklogItems[] = [];
    const grouped: Record<string, Record<string, typeof outlines>> = {};

    for (const outline of outlines) {
      if (!grouped[outline.epic]) grouped[outline.epic] = {};
      if (!grouped[outline.epic][outline.feature]) grouped[outline.epic][outline.feature] = [];
      grouped[outline.epic][outline.feature].push(outline);
    }

    let refined = 0;
    let rateLimitFailures = 0;
    let otherFailures = 0;

    for (const epic of Object.keys(grouped)) {
      for (const feature of Object.keys(grouped[epic])) {
        const stories: RefinedStory[] = [];
        for (const outline of grouped[epic][feature]) {
          refined++;
          onProgress?.(`Fase 2/2: refinando ${refined}/${outlines.length} — "${outline.title}"...`);

          const storyPrompt = `Como ${outline.persona ?? 'usuário'}, quero ${outline.title}. Contexto: ${outline.description}`;
          let success = false;

          for (let attempt = 1; attempt <= 3 && !success; attempt++) {
            // Timer para mostrar que está processando (atualiza a cada 5s)
            let elapsed = 0;
            const ticker = setInterval(() => {
              elapsed += 5;
              onProgress?.(`Fase 2/2: refinando ${refined}/${outlines.length} — "${outline.title}" (${elapsed}s)...`);
            }, 5_000);

            try {
              const result = await this.refineUserStoryStrategic(storyPrompt);
              clearInterval(ticker);
              if (result.refinedStories?.length) {
                stories.push({ ...result.refinedStories[0], epicSuggestion: epic, featureSuggestion: feature });
                success = true;
              }
            } catch (err) {
              clearInterval(ticker);
              const msg = err instanceof Error ? err.message : String(err);
              const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many');
              if (isRateLimit && attempt < 3) {
                const waitSec = attempt === 1 ? 65 : 130;
                onProgress?.(`Rate limit (tentativa ${attempt}/3) — aguardando ${waitSec}s...`);
                await new Promise(r => setTimeout(r, waitSec * 1000));
              } else if (isRateLimit) {
                rateLimitFailures++;
              } else {
                otherFailures++;
                break;
              }
            }
          }

          await new Promise(r => setTimeout(r, 500));
        }
        if (stories.length > 0) {
          allItems.push({ epicSuggestion: epic, featureSuggestion: feature, refinedStories: stories });
        }
      }
    }

    const totalRefined = allItems.reduce((acc, g) => acc + g.refinedStories.length, 0);

    if (totalRefined === 0 && outlines.length > 0) {
      const detail = rateLimitFailures > 0
        ? `Rate limit da API atingido em ${rateLimitFailures}/${outlines.length} histórias. Aguarde alguns minutos e tente novamente.`
        : `${otherFailures} histórias falharam no refinamento. Verifique os logs do console para detalhes.`;
      throw new Error(`Fase 1 identificou ${outlines.length} histórias, mas nenhuma foi refinada com sucesso. ${detail}`);
    }

    return allItems;
  }

  private async discoverStoryOutlines(content: string): Promise<{
    title: string; epic: string; feature: string; description: string; persona?: string;
  }[]> {
    const system = `Você é um Analista de Negócios Sênior especialista em extração de requisitos.
Leia o documento abaixo e liste TODAS as funcionalidades, requisitos ou histórias de usuário que podem ser extraídas.
Mesmo que o documento não use o formato "Como [persona]...", infira as histórias a partir dos requisitos descritos.

Retorne APENAS JSON válido com esta estrutura exata:
{
  "stories": [
    { "title": "string", "epic": "string", "feature": "string", "description": "string", "persona": "string" }
  ]
}
Sem markdown. Sem explicações. Sem texto fora do JSON.`;

    // 25 000 chars ≈ 6 000 tokens — capta documentos extensos sem estourar contexto
    const documentChunk = content.substring(0, 25_000);

    const response = await this.chat({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Analise o documento abaixo e extraia todas as histórias de usuário:\n\n${documentChunk}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const raw = response.choices[0].message.content?.trim() ?? '';
    let parsed: { stories?: { title: string; epic: string; feature: string; description: string; persona?: string }[] };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      throw new Error(`A IA retornou uma resposta inválida na fase de descoberta. Resposta recebida: ${raw.substring(0, 200)}`);
    }
    return parsed.stories ?? [];
  }

  private async refineBatchFromDocument(_documentContent: string, _batchTitles: string): Promise<ExtractedBacklogItems[]> {
    // Método mantido para compatibilidade — não mais utilizado
    const userPrompt = '';
    const systemInstruction = `
      Você é um "Agente PO Autônomo", especialista sênior em Gerenciamento de Produtos. Analise documentos de requisitos e decomponha em backlog acionável.

      **Etapas:**
      1. **Análise Holística:** Leia todo o documento para entender objetivos, stakeholders e escopo.
      2. **Identificação de Épicos:** Identifique temas ou iniciativas de mais alto nível.
      3. **Decomposição em Features:** Para cada Épico, divida em Features lógicas e coerentes.
      4. **Geração de User Stories:** Para cada Feature, gere uma ou mais User Stories detalhadas e refinadas.
      5. **Refinamento Completo:** Cada User Story DEVE ser completamente refinada com: título, Épico, Feature, persona, narrativa de negócio, critérios de aceite (BDD), resumo, cenários de teste (E2E, integração, unitário), estimativa, tarefas de desenvolvimento, casos extremos, considerações técnicas, dependências, dúvidas e análise de riscos.

      **REGRAS CRÍTICAS (idênticas ao Refinamento Estratégico individual):**
      1. O campo 'model' de cada história deve ser '${MODEL}'.
      2. Estimativas consistentes: storyEstimate DEVE ser idêntico a tasksTotalEstimate.
      3. Critérios de aceite em Gherkin com '### Cenário:' e palavras-chave (**Dado**, **Quando**, **Então**, **E**) em negrito.
      4. 'acceptanceCriteriaSummary' DEVE ser bullet list markdown.
      5. Cenários de teste em três níveis: E2E (Cypress), Integração e Unitário em blocos de código markdown.
      6. 'storyEstimateJustification' com análise detalhada justificando a estimativa.
      7. 'riskAnalysis' com 'type' ('Técnico', 'Negócio', 'Usabilidade', 'Compliance' ou 'Rollout'), 'severity' ('baixa', 'média' ou 'alta'), 'description' e 'mitigationSuggestion'.

      **JSON SCHEMA OBRIGATÓRIO:**
      Retorne um objeto JSON com a seguinte estrutura (wrapper obrigatório):
      {
        "items": [
          {
            "epicSuggestion": "string",
            "featureSuggestion": "string",
            "refinedStories": [
              {
                "title": "string",
                "epicSuggestion": "string",
                "featureSuggestion": "string",
                "userPersona": "string",
                "businessNarrative": "string",
                "interfaceDetails": "string",
                "acceptanceCriteria": "string (formato Gherkin)",
                "acceptanceCriteriaSummary": "string (bullet list markdown)",
                "testScenarios": { "e2e": "string (código Cypress em markdown)", "integration": "string (código em markdown)", "unit": "string (código em markdown)" },
                "storyEstimate": "string (ex: 12h)",
                "storyEstimateJustification": "string",
                "developmentTasks": [{"name":"string","responsibility":"string","description":"string","justification":"string","estimate":"string","technicalJustification":"string"}],
                "tasksTotalEstimate": "string (ex: 12h)",
                "potentialEdgeCases": ["string"],
                "technicalConsiderations": ["string"],
                "identifiedDependencies": ["string"],
                "questions": ["string"],
                "riskAnalysis": [{"type":"Técnico|Negócio|Usabilidade|Compliance|Rollout","severity":"baixa|média|alta","description":"string","mitigationSuggestion":"string"}],
                "model": "${MODEL}"
              }
            ]
          }
        ]
      }

      **CRITICAL: JSON OUTPUT MUST BE VALID.** Output ONLY the JSON, no markdown fences, no explanations.
    `;

    const result = await this.generateValidation<{ items: ExtractedBacklogItems[] }>(userPrompt, systemInstruction);
    return result.items ?? [];
  }

  async generateDetailedAcceptanceCriteria(story: RefinedStory): Promise<string> {
    const systemInstruction = `
      Você é um Engenheiro de QA e Analista de Negócios Sênior, especialista em Behavior-Driven Development (BDD).
      Sua tarefa é pegar os Critérios de Aceite (AC) existentes para uma história de usuário e expandi-los, adicionando mais detalhes, cenários e casos extremos para garantir a máxima clareza e testabilidade.

      REGRAS:
      1.  **Não Remova Cenários:** Mantenha todos os cenários existentes, mas sinta-se à vontade para refinar sua linguagem para maior precisão.
      2.  **Adicione Novos Cenários:** Adicione novos cenários para cobrir: caminhos alternativos, cenários de erro, validações de campo, verificações de permissão e casos extremos.
      3.  **Formato Gherkin Estrito:** A saída DEVE ser estritamente em formato Gherkin (Dado, Quando, Então, E, Mas).
          *   Use '### Cenário:' para o título de cada cenário.
          *   Coloque as palavras-chave BDD (**Dado**, **Quando**, **Então**, **E**) em negrito no início de cada linha.
          *   Mantenha uma linha em branco entre os cenários.
      4.  **Saída Direta:** A sua resposta deve ser APENAS o texto Gherkin completo, sem nenhuma explicação ou texto adicional.
    `;

    const prompt = `
      Aqui está a história de usuário e seus Critérios de Aceite atuais. Por favor, expanda e detalhe os critérios de aceite.

      **Título da História:** ${story.title}
      **Persona do Usuário:** ${story.userPersona}
      **Narrativa de Negócio:** ${story.businessNarrative}

      **Critérios de Aceite Atuais:**
      \`\`\`gherkin
      ${story.acceptanceCriteria}
      \`\`\`
    `;

    try {
      const response = await this.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5
      });

      return response.choices[0].message.content?.trim() ?? '';
    } catch (error) {
      console.error('Error calling Groq API for detailed AC generation:', error);
      throw new Error('Falha ao gerar os critérios de aceite detalhados.');
    }
  }

  async generateAlternativeTestFormat(scenarios: TestScenarios, format: 'Jest' | 'Mocha'): Promise<string> {
    const systemInstruction = `
      Você é um especialista em engenharia de software e testes automatizados.
      Sua tarefa é converter os cenários de teste fornecidos para o framework '${format}'.
      A saída deve ser APENAS o bloco de código no novo formato, sem nenhuma explicação ou texto adicional.
      Mantenha a mesma estrutura e lógica dos testes originais, adaptando a sintaxe conforme necessário.
    `;

    const prompt = `
      Converta os seguintes cenários de teste para o formato '${format}'.

      **Testes E2E (Cypress):**
      ${scenarios.e2e}

      **Testes de Integração:**
      ${scenarios.integration}

      **Testes Unitários:**
      ${scenarios.unit}
    `;

    try {
      const response = await this.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      });

      return response.choices[0].message.content?.trim() ?? '';
    } catch (error) {
      console.error(`Error calling Groq API for ${format} generation:`, error);
      throw new Error(`Falha ao gerar o código de teste para ${format}.`);
    }
  }

  async generateTechnicalArtifact(technicalConsiderations: string[], identifiedDependencies: string[], type: 'doc' | 'c4-diagram' | 'c4-container' | 'sequence-diagram'): Promise<string> {
    const considerationsText = technicalConsiderations.length > 0
      ? `### Considerações Técnicas\n${technicalConsiderations.map(c => `- ${c}`).join('\n')}`
      : '';
    const dependenciesText = identifiedDependencies.length > 0
      ? `### Dependências Identificadas\n${identifiedDependencies.map(d => `- ${d}`).join('\n')}`
      : '';

    const context = `Com base nas seguintes informações de uma história de usuário:\n\n${considerationsText}\n${dependenciesText}`;

    const instructionDoc = `
        Você é um Arquiteto de Software e Redator Técnico Sênior. Sua tarefa é criar um rascunho de documentação técnica em markdown.
        O documento deve ser bem estruturado, usando cabeçalhos, listas e blocos de código, se apropriado.
        A saída deve ser APENAS o conteúdo markdown.
    `;

    const instructionC4Context = `
        Você é um Arquiteto de Software Sênior especialista no modelo C4 para arquitetura de software.
        Crie um Diagrama de Contexto C4 (nível 1) usando a sintaxe C4Context do Mermaid.js.
        Mostre o sistema principal e seus usuários/atores externos. Mantenha simples — apenas o sistema e o que o rodeia.
        A saída deve ser APENAS o código Mermaid, sem o bloco de markdown \`\`\`mermaid.
    `;

    const instructionC4Container = `
        Você é um Arquiteto de Software Sênior especialista no modelo C4 para arquitetura de software.
        Crie um Diagrama de Contêineres C4 (nível 2) usando a sintaxe C4Container do Mermaid.js.
        Mostre os contêineres do sistema (frontend, backend, banco de dados, serviços externos, filas) e como eles se comunicam.
        A saída deve ser APENAS o código Mermaid, sem o bloco de markdown \`\`\`mermaid.
    `;

    const instructionSequence = `
        Você é um Arquiteto de Software Sênior especialista em diagramas de sequência UML.
        Crie um Diagrama de Sequência usando a sintaxe sequenceDiagram do Mermaid.js.
        Mostre o fluxo principal descrito pelas considerações técnicas e dependências: atores, sistemas envolvidos, chamadas síncronas e assíncronas.
        A saída deve ser APENAS o código Mermaid, sem o bloco de markdown \`\`\`mermaid.
    `;

    const systemInstruction = type === 'doc' ? instructionDoc
      : type === 'c4-container' ? instructionC4Container
      : type === 'sequence-diagram' ? instructionSequence
      : instructionC4Context;
    const prompt = `${context}\n\nGere o artefato solicitado.`;

    try {
      const response = await this.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      return response.choices[0].message.content?.trim() ?? '';
    } catch (error) {
      console.error('Error calling Groq API for technical artifact generation:', error);
      throw new Error('Falha ao gerar o artefato técnico.');
    }
  }

  async extractProjectInfo(documentContent: string): Promise<Partial<ProjectInfo>> {
    const system = `
Você é um Analista de Negócios Sênior especializado em extrair informações de contexto de projetos a partir de documentos.

Leia o documento e extraia APENAS informações que estejam explicitamente presentes no texto.
Para campos não encontrados, retorne string vazia "".

**Retorne APENAS JSON válido com esta estrutura:**
{
  "description": "descrição geral do projeto ou produto",
  "objective": "objetivos principais do projeto",
  "targetUsers": "usuários-alvo ou personas descritas",
  "stakeholders": "stakeholders, patrocinadores ou partes interessadas mencionadas",
  "techStack": "tecnologias, frameworks ou plataformas mencionadas",
  "constraints": "restrições, limitações, prazos ou regras de negócio mencionadas",
  "notes": "outras informações relevantes não cobertas pelos campos acima"
}

Responda APENAS com o JSON. Sem markdown. Sem explicações.`;

    const prompt = `Extraia as informações do projeto deste documento:\n\n${documentContent.substring(0, 8000)}`;

    try {
      return await this.generateValidation<Partial<ProjectInfo>>(prompt, system);
    } catch {
      return {};
    }
  }

  async analyzeBacklogDependencies(stories: BacklogItem[]): Promise<BacklogDependencyAnalysis> {
    const storySummaries = stories.map(s =>
      `- "${s.title}" [Épico: ${s.epicSuggestion}, Feature: ${s.featureSuggestion}]\n  Dependências: ${s.identifiedDependencies?.join(', ') || 'nenhuma'}\n  Considerações: ${s.technicalConsiderations?.slice(0, 2).join(', ') || ''}`
    ).join('\n');

    const system = `
Você é um Arquiteto de Software e Analista de Projetos Sênior.
Analise o backlog de histórias de usuário abaixo e identifique dependências entre elas.

**Retorne APENAS JSON válido com esta estrutura:**
{
  "summary": "string — resumo executivo em 2-3 frases",
  "criticalPath": ["título da história em ordem de implementação recomendada"],
  "circularDependencies": [["história A", "história B"]],
  "storyDependencies": [
    {
      "storyTitle": "string",
      "dependsOn": ["outras histórias do backlog que devem ser feitas antes"],
      "externalDependencies": ["APIs, times, serviços externos"],
      "notes": "string"
    }
  ],
  "recommendations": ["recomendação acionável 1", "recomendação acionável 2"]
}
Responda APENAS com o JSON. Sem markdown. Sem explicações.`;

    const prompt = `Backlog com ${stories.length} histórias:\n\n${storySummaries}`;
    return this.generateValidation<BacklogDependencyAnalysis>(prompt, system);
  }

  async analyzeBacklogRisks(stories: BacklogItem[]): Promise<BacklogRiskAnalysis> {
    const storySummaries = stories.map(s => {
      const risks = s.riskAnalysis?.map(r => `${r.type}: ${r.description}`).join('; ') || 'nenhum';
      return `- "${s.title}" [${s.epicSuggestion} > ${s.featureSuggestion}]\n  Riscos: ${risks}`;
    }).join('\n');

    const system = `
Você é um Gerente de Riscos e Product Manager Sênior.
Analise os riscos do backlog abaixo e gere um panorama consolidado.

**Retorne APENAS JSON válido com esta estrutura:**
{
  "summary": "string — panorama geral em 2-3 frases",
  "overallRiskLevel": "baixo|médio|alto|crítico",
  "totalRisks": 0,
  "hotspots": [
    {
      "area": "nome do Épico ou Feature",
      "riskCount": 0,
      "topRisk": "descrição do risco mais crítico",
      "severity": "baixa|média|alta"
    }
  ],
  "topRisks": [
    {
      "storyTitle": "string",
      "type": "Técnico|Negócio|Usabilidade|Compliance|Rollout",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "recommendations": ["ação prioritária 1", "ação prioritária 2"]
}
Responda APENAS com o JSON. Sem markdown. Sem explicações.`;

    const prompt = `Backlog com ${stories.length} histórias:\n\n${storySummaries}`;
    return this.generateValidation<BacklogRiskAnalysis>(prompt, system);
  }

  async generateProjectDocument(kind: DocumentKind, draftMarkdown: string): Promise<string> {
    const label = kind === 'prd' ? 'PRD (Product Requirements Document)' : 'Especificação Técnica (spec.md)';
    const systemInstruction = `
      Você é um Product Manager sênior e redator técnico especializado em documentação de produto.
      Você receberá um rascunho de ${label} em markdown e deve aprimorá-lo:
      - Melhore a clareza, coesão e estrutura narrativa
      - Mantenha todos os dados técnicos exatamente como estão (critérios, estimativas, código)
      - Use linguagem profissional em português
      - Mantenha a mesma estrutura de seções e cabeçalhos
      - Retorne APENAS o conteúdo markdown aprimorado, sem explicações adicionais
    `;
    const prompt = `Aprimore o seguinte rascunho de ${label}:\n\n${draftMarkdown}`;

    try {
      const response = await this.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });
      return response.choices[0].message.content?.trim() ?? draftMarkdown;
    } catch (error) {
      console.error(`Error generating ${kind} document via AI:`, error);
      return draftMarkdown;
    }
  }

  private async generateValidation<T>(story: string, systemInstruction: string): Promise<T> {
    let jsonText = '';
    let correctionResponseText = '';

    try {
      const response = await this.chat({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Com base nas suas instruções, analise e processe a seguinte funcionalidade/descrição: "${story}"` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      jsonText = response.choices[0].message.content?.trim() ?? '';
      return JSON.parse(jsonText) as T;
    } catch (error) {
      console.error('Initial JSON parse failed. Attempting self-correction.', error);
      console.error('Faulty JSON string:', jsonText);

      if (!jsonText) {
        console.error('Error calling Groq API or empty response:', error);
        throw new Error('Falha ao receber uma resposta da IA.');
      }

      try {
        const correctionSystemInstruction = `You are an automated JSON repair tool. Fix the invalid JSON and return ONLY the corrected JSON string. Output must start with '{' or '[' and end with '}' or ']'. No markdown fences. No explanations.`;
        const correctionPrompt = `Fix this invalid JSON and return only the valid JSON:\n\n${jsonText}`;

        const correctionResponse = await this.chat({
          model: MODEL,
          messages: [
            { role: 'system', content: correctionSystemInstruction },
            { role: 'user', content: correctionPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0
        });

        correctionResponseText = correctionResponse.choices[0].message.content?.trim() ?? '';
        const parsedResult = JSON.parse(correctionResponseText) as T;
        console.log('Successfully corrected and parsed JSON.');
        return parsedResult;
      } catch (correctionError) {
        console.error('Self-correction attempt failed.', correctionError);
        console.error('Corrected JSON text that failed to parse:', correctionResponseText);
        throw new Error('Falha ao analisar ou receber uma resposta válida do modelo de IA, mesmo após a tentativa de correção.');
      }
    }
  }
}
