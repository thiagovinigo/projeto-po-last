import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { ValidationResult, AdvancedValidationResult, StrategicRefinementResult, TestScenarios, RefinedStory, ExtractedBacklogItems } from '../models/validation.model';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private readonly refinedStorySchema: any;


  constructor() {
    // IMPORTANT: The API key is sourced from environment variables.
    // Do not hardcode or expose it in the frontend code.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey });

    const developmentTaskSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Nome da tarefa.' },
            responsibility: { type: Type.STRING, description: 'Responsabilidade Principal (Frontend, Backend, BD, QA, DevOps, etc.).' },
            description: { type: Type.STRING, description: 'O que precisa ser feito na task.' },
            justification: { type: Type.STRING, description: 'Por que esta task é necessária.' },
            estimate: { type: Type.STRING, description: 'Estimativa da Task (ex: 2h, 4h).' },
            technicalJustification: { type: Type.STRING, description: 'Detalhes técnicos que influenciam a estimativa.' },
        },
        required: ['name', 'responsibility', 'description', 'justification', 'estimate', 'technicalJustification']
    };

    const riskAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: 'Tipo do risco (Técnico, Negócio, Usabilidade).' },
            description: { type: Type.STRING, description: 'Descrição do risco identificado.' },
            mitigationSuggestion: { type: Type.STRING, description: 'Sugestão de como mitigar o risco.' },
        },
        required: ['type', 'description', 'mitigationSuggestion']
    };

    this.refinedStorySchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'Título da User Story.' },
            epicSuggestion: { type: Type.STRING, description: 'Sugestão de nome para o Épico.' },
            featureSuggestion: { type: Type.STRING, description: 'Sugestão de nome para a Feature.' },
            userPersona: { type: Type.STRING, description: 'Visão do usuário (Como <persona>, quero <ação>, para <benefício>).' },
            businessNarrative: { type: Type.STRING, description: 'Narrativa de negócio (Problema → Solução → Impacto Esperado).' },
            interfaceDetails: { type: Type.STRING, description: 'Detalhamento da interface (campos, mensagens, validações).' },
            acceptanceCriteria: { type: Type.STRING, description: 'Critérios de aceite em formato BDD, com títulos de cenário e palavras-chave em negrito.' },
            acceptanceCriteriaSummary: { type: Type.STRING, description: 'Resumo conciso dos critérios de aceite em formato de bullet list markdown.' },
            testScenarios: { 
              type: Type.OBJECT, 
              description: 'Objeto contendo cenários de teste E2E, de integração e unitários.',
              properties: {
                  e2e: { type: Type.STRING, description: 'Cenários de teste End-to-End (Cypress) em blocos de código markdown.' },
                  integration: { type: Type.STRING, description: 'Cenários de teste de Integração em blocos de código markdown.' },
                  unit: { type: Type.STRING, description: 'Cenários de teste Unitários básicos em blocos de código markdown.' },
              },
              required: ['e2e', 'integration', 'unit']
            },
            storyEstimate: { type: Type.STRING, description: 'Estimativa total da User Story (em horas). Deve ser idêntico a tasksTotalEstimate.' },
            storyEstimateJustification: { type: Type.STRING, description: 'Justificativa para a estimativa da User Story.' },
            developmentTasks: { type: Type.ARRAY, items: developmentTaskSchema, description: 'Lista de tarefas de desenvolvimento.' },
            tasksTotalEstimate: { type: Type.STRING, description: 'Soma do total de horas estimadas para as tasks.' },
            potentialEdgeCases: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de casos extremos potenciais.' },
            technicalConsiderations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de considerações técnicas.' },
            identifiedDependencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de dependências identificadas.' },
            questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de dúvidas técnicas, de negócio ou validação.' },
            riskAnalysis: { type: Type.ARRAY, items: riskAnalysisSchema, description: 'Lista de riscos identificados e sugestões de mitigação.' },
            model: { type: Type.STRING, description: "O modelo de IA usado, sempre 'gemini-2.5-flash'." },
        },
        required: ['title', 'epicSuggestion', 'featureSuggestion', 'userPersona', 'businessNarrative', 'interfaceDetails', 'acceptanceCriteria', 'acceptanceCriteriaSummary', 'testScenarios', 'storyEstimate', 'storyEstimateJustification', 'developmentTasks', 'tasksTotalEstimate', 'potentialEdgeCases', 'technicalConsiderations', 'identifiedDependencies', 'questions', 'riskAnalysis', 'model']
    };
  }

  async refineUserStoryStrategic(story: string): Promise<StrategicRefinementResult> {
    const systemInstruction = `
      **Role:** Especialista em Gestão de Produtos Avançada, Análise de Requisitos, Escrita de User Stories, Planejamento Técnico e Organização de Backlog.
      **Department:** Product Management Estratégico, Agilidade Técnica e Engenharia de Software.
      **Task:** Analisar a complexidade de funcionalidades ou descrições. Se a funcionalidade for extensa ou muito complexa, dividi-la em User Stories menores e mais gerenciáveis. Para cada User Story (original ou resultante da divisão), transformá-la em uma história refinada e completa.
      **Task Description:** Você recebe uma descrição funcional. Primeiro, avalia se a descrição representa uma única User Story gerenciável ou se necessita ser dividida. Se a divisão for necessária, você propõe as User Stories filhas. Para cada User Story (original ou filha), você gera uma estrutura completa: título, sugestões de Épico e Feature, visão do usuário, narrativa de negócio, Critérios de Aceite (BDD) detalhados, um resumo conciso desses critérios, cenários de teste em três níveis, estimativa da User Story (em horas), detalhamento das tasks de desenvolvimento (com estimativas), e também listas de **Casos Extremos Potenciais**, **Considerações Técnicas**, **Dependências Identificadas**, **Dúvidas** e uma **Análise de Riscos** detalhada.

      **REGRAS:**
      1.  **Avaliação e Divisão:** Se a história for dividida, preencha o campo 'divisionAnalysis' com a justificativa. Caso contrário, deixe-o nulo.
      2.  **Estrutura Obrigatória por User Story:** Cada User Story gerada no array 'refinedStories' deve conter todos os campos definidos no schema.
      3.  **Formatação dos Critérios de Aceite (BDD):** Formate os critérios de aceite estritamente no padrão Gherkin. Use '### Cenário:' para o título de cada cenário. Coloque as palavras-chave BDD (**Dado**, **Quando**, **Então**, **E**) em negrito no início de cada linha. **CRÍTICO: Deve haver exatamente uma linha em branco entre o final de um cenário e o início do próximo para separação visual.**
      4.  **Cenários de Teste (Múltiplos Níveis):** Gere cenários de teste em três níveis distintos para garantir uma cobertura completa:
          a.  **Testes End-to-End (E2E):** Use Cypress para simular fluxos de usuário completos.
          b.  **Testes de Integração:** Descreva testes que verificam a interação entre componentes ou serviços (pode ser em pseudo-código ou descrevendo a lógica).
          c.  **Testes Unitários:** Forneça exemplos de testes unitários básicos para a lógica de negócio principal.
          Formate todo o código de teste dentro de blocos de código markdown.
      5.  **Resumo dos Critérios:** O campo 'acceptanceCriteriaSummary' DEVE ser formatado como uma lista de marcadores (bullet list) em markdown, resumindo os pontos chave dos critérios de aceite.
      6.  **Linguagem e Escopo:** Use linguagem objetiva. As estimativas devem ser para um time full-stack de nível pleno.
      7.  **Consistência de Estimativas:** O valor de 'tasksTotalEstimate' DEVE ser a soma exata das estimativas de todas as 'developmentTasks'. O valor de 'storyEstimate' DEVE ser idêntico ao valor de 'tasksTotalEstimate'. Por exemplo, se as tarefas somam 12h, tanto 'tasksTotalEstimate' quanto 'storyEstimate' devem ser '12h'.
      8.  **Formato:** Responda SEMPRE em português e no formato JSON estritamente de acordo com o schema fornecido.
      9.  **Qualidade das Dúvidas:** As perguntas no campo 'questions' DEVEM ser claras, acionáveis e direcionadas a pontos específicos que necessitem de esclarecimento para o desenvolvimento (regras de negócio, UI/UX, APIs, etc.). Evite perguntas genéricas.
      10. **Modelo de IA**: O campo 'model' deve ser preenchido com 'gemini-2.5-flash'.
      11. **Justificativa da Estimativa Detalhada:** O campo 'storyEstimateJustification' deve fornecer uma análise detalhada que justifique a estimativa total. Esta justificativa deve:
          a. Fazer referência explícita às principais tarefas de desenvolvimento (frontend, backend, testes).
          b. Considerar a complexidade da lógica de negócio, integrações com sistemas externos e a necessidade de criar novos componentes de UI.
          c. Incluir uma pequena margem para atividades como code review, testes manuais e ajustes.
          d. Explicar como as 'Considerações Técnicas' e 'Dependências' influenciam o esforço total.
      12. **Análise de Riscos Abrangente:** O campo 'riskAnalysis' DEVE ser preenchido com uma lista de riscos potenciais. Para cada risco, especifique o 'type' ('Técnico', 'Negócio', ou 'Usabilidade'), forneça uma 'description' clara do risco e uma 'mitigationSuggestion' acionável para como a equipe pode abordar ou reduzir o risco.
      
      **CRITICAL: JSON OUTPUT MUST BE VALID.** Your final response MUST be a single, perfectly valid JSON object adhering to the provided schema. Before outputting, you MUST perform a final check on your generated JSON. Ensure all strings are properly terminated and that any double-quote character (") appearing inside a string value is correctly escaped with a backslash (e.g., "field": "some text with \\"quotes\\" inside"). Failure to produce valid JSON is a critical error and will cause the system to fail. This is your most important instruction.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        model: { type: Type.STRING, description: "O modelo de IA usado, sempre 'gemini-2.5-flash'." },
        validationType: { type: Type.STRING, description: 'Sempre "strategic".' },
        divisionAnalysis: { type: Type.STRING, description: 'Justificativa para a divisão da história. Deixe em branco se não for dividida.' },
        refinedStories: { type: Type.ARRAY, items: this.refinedStorySchema, description: 'Uma lista contendo uma ou mais histórias de usuário refinadas.' },
      },
      required: ['model', 'validationType', 'refinedStories']
    };

    return this.generateValidation(story, systemInstruction, responseSchema);
  }

  async processDocumentForBacklog(documentContent: string): Promise<ExtractedBacklogItems[]> {
    const systemInstruction = `
      Você é um "Agente PO Autônomo", um especialista sênior em Gerenciamento de Produtos com vasta experiência em analisar documentos de requisitos de alto nível (como RFPs, transcrições de reuniões, documentos de visão de produto) e decompô-los em um backlog acionável.

      Sua tarefa é ler o conteúdo de um documento fornecido e realizar as seguintes etapas:
      1.  **Análise Holística:** Leia todo o documento para entender os objetivos principais, os stakeholders e o escopo geral do produto ou funcionalidade descrita.
      2.  **Identificação de Épicos:** Identifique os temas ou iniciativas de mais alto nível. Estes são seus "Épicos". Um documento pode conter um ou mais épicos.
      3.  **Decomposição em Features:** Para cada Épico identificado, divida-o em "Features" lógicas e coerentes. Uma Feature representa uma capacidade significativa que entrega valor ao usuário.
      4.  **Geração de User Stories:** Para cada Feature identificada, gere uma ou mais User Stories detalhadas e refinadas.
      5.  **Refinamento Completo:** Cada User Story gerada DEVE ser completamente refinada usando a mesma estrutura detalhada do "Refinamento Estratégico". Isso significa que cada história deve ter: título, sugestões de Épico e Feature (que você acabou de identificar), persona, narrativa de negócio, critérios de aceite (BDD), resumo dos critérios, cenários de teste (E2E, integração, unitário), estimativa, tarefas de desenvolvimento detalhadas, casos extremos, considerações técnicas, dependências, dúvidas e análise de riscos.

      **REGRAS CRÍTICAS DE SAÍDA:**
      -   Sua saída DEVE ser um array JSON.
      -   Cada elemento do array representa uma Feature que você identificou.
      -   Cada objeto nesse array DEVE conter os campos: \`epicSuggestion\` (string), \`featureSuggestion\` (string), e \`refinedStories\` (um array de objetos de User Story).
      -   Os objetos dentro do array \`refinedStories\` DEVEM seguir estritamente o schema \`refinedStorySchema\` fornecido. Isso é essencial para a integração com o sistema.
      -   Agrupe todas as User Stories sob a Feature correta.
      -   Aplique todas as regras de qualidade do "Refinamento Estratégico" a cada história gerada (estimativas consistentes, formatação BDD, etc.).
      -   O campo 'model' de cada história deve ser 'gemini-2.5-flash'.
      -   **CRITICAL: JSON OUTPUT MUST BE VALID.** Your final response MUST be a single, perfectly valid JSON object adhering to the provided schema. Before outputting, you MUST perform a final check on your generated JSON. Ensure all strings are properly terminated and that any double-quote character (") appearing inside a string value is correctly escaped with a backslash (e.g., "field": "some text with \\"quotes\\" inside"). Failure to produce valid JSON is a critical error and will cause the system to fail. This is your most important instruction.
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          epicSuggestion: { type: Type.STRING },
          featureSuggestion: { type: Type.STRING },
          refinedStories: { type: Type.ARRAY, items: this.refinedStorySchema }
        },
        required: ['epicSuggestion', 'featureSuggestion', 'refinedStories']
      }
    };
    
    return this.generateValidation(documentContent, systemInstruction, responseSchema);
  }

  async generateDetailedAcceptanceCriteria(story: RefinedStory): Promise<string> {
    const systemInstruction = `
      Você é um Engenheiro de QA e Analista de Negócios Sênior, especialista em Behavior-Driven Development (BDD).
      Sua tarefa é pegar os Critérios de Aceite (AC) existentes para uma história de usuário e expandi-los, adicionando mais detalhes, cenários e casos extremos para garantir a máxima clareza e testabilidade.

      REGRAS:
      1.  **Não Remova Cenários:** Mantenha todos os cenários existentes, mas sinta-se à vontade para refinar sua linguagem para maior precisão.
      2.  **Adicione Novos Cenários:** Adicione novos cenários para cobrir:
          *   Caminhos alternativos (fluxos não-felizes).
          *   Cenários de erro (ex: entrada inválida, falhas de API).
          *   Validações de campo específicas.
          *   Verificações de permissão, se aplicável.
          *   Casos extremos que podem não ser óbvios.
      3.  **Formato Gherkin Estrito:** A saída DEVE ser estritamente em formato Gherkin (Dado, Quando, Então, E, Mas).
          *   Use '### Cenário:' para o título de cada cenário.
          *   Coloque as palavras-chave BDD (**Dado**, **Quando**, **Então**, **E**) em negrito no início de cada linha.
          *   Mantenha uma linha em branco entre os cenários.
      4.  **Saída Direta:** A sua resposta deve ser APENAS o texto Gherkin completo, sem nenhuma explicação, introdução ou texto adicional. Apenas os critérios de aceite formatados.
    `;

    const prompt = `
      Aqui está a história de usuário e seus Critérios de Aceite atuais. Por favor, expanda e detalhe os critérios de aceite de acordo com suas instruções.

      **Título da História:** ${story.title}
      **Persona do Usuário:** ${story.userPersona}
      **Narrativa de Negócio:** ${story.businessNarrative}

      **Critérios de Aceite Atuais:**
      \`\`\`gherkin
      ${story.acceptanceCriteria}
      \`\`\`
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.5
        },
      });
      
      return response.text.trim();
    } catch (error) {
      console.error('Error calling Gemini API for detailed AC generation:', error);
      throw new Error('Falha ao gerar os critérios de aceite detalhados.');
    }
  }

  async generateAlternativeTestFormat(scenarios: TestScenarios, format: 'Jest' | 'Mocha'): Promise<string> {
    const systemInstruction = `
      Você é um especialista em engenharia de software e testes automatizados.
      Sua tarefa é converter os cenários de teste fornecidos para um framework de teste diferente, especificado pelo usuário.
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
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2
        },
      });
      
      return response.text.trim();
    } catch (error) {
      console.error(`Error calling Gemini API for ${format} generation:`, error);
      throw new Error(`Falha ao gerar o código de teste para ${format}.`);
    }
  }

  async generateTechnicalArtifact(technicalConsiderations: string[], identifiedDependencies: string[], type: 'doc' | 'c4-diagram'): Promise<string> {
    const considerationsText = technicalConsiderations.length > 0 ? `### Considerações Técnicas\n${technicalConsiderations.map(c => `- ${c}`).join('\n')}` : '';
    const dependenciesText = identifiedDependencies.length > 0 ? `### Dependências Identificadas\n${identifiedDependencies.map(d => `- ${d}`).join('\n')}` : '';

    const context = `Com base nas seguintes informações de uma história de usuário:\n\n${considerationsText}\n${dependenciesText}`;

    const instructionDoc = `
        Você é um Arquiteto de Software e Redator Técnico Sênior. Sua tarefa é criar um rascunho de documentação técnica em markdown.
        O documento deve ser bem estruturado, usando cabeçalhos, listas e blocos de código, se apropriado.
        O objetivo é fornecer um ponto de partida claro para a equipe de desenvolvimento.
        A saída deve ser APENAS o conteúdo markdown.
    `;
    
    const instructionDiagram = `
        Você é um Arquiteto de Software Sênior especialista em visualização de sistemas e no modelo C4 para arquitetura de software.
        Sua tarefa é criar um diagrama de arquitetura, preferencialmente um Diagrama de Contêineres (nível 2 do C4), usando a sintaxe C4Context do Mermaid.js.
        O diagrama deve representar o sistema em questão, seus principais contêineres (aplicações, bancos de dados, etc.), e como eles interagem com base nas considerações e dependências da história de usuário.
        Se as informações forem muito genéricas para um diagrama de contêineres, crie um Diagrama de Contexto (nível 1 do C4).
        A saída deve ser APENAS o código Mermaid, sem o bloco de markdown \`\`\`mermaid.
    `;

    const systemInstruction = type === 'doc' ? instructionDoc : instructionDiagram;
    
    const prompt = `${context}\n\nGere o artefato solicitado.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        },
      });
      
      return response.text.trim();
    } catch (error) {
      console.error(`Error calling Gemini API for technical artifact generation:`, error);
      throw new Error(`Falha ao gerar o artefato técnico.`);
    }
  }

  private async generateValidation<T>(story: string, systemInstruction: string, responseSchema: any): Promise<T> {
    let jsonText = '';
    let correctionResponseText = '';
    try {
      // First attempt
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Com base nas suas instruções, analise e processe a seguinte funcionalidade/descrição: "${story}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.4
        },
      });
      
      jsonText = response.text.trim();
      const parsedResult: T = JSON.parse(jsonText);
      return parsedResult;
    } catch (error) {
      console.error('Initial JSON parse failed. Attempting self-correction.', error);
      console.error('Faulty JSON string:', jsonText);

      if (!jsonText) {
          console.error('Error calling Gemini API or empty response:', error);
          throw new Error('Falha ao receber uma resposta da IA.');
      }

      // Second attempt: Ask the model to fix its own mistake
      try {
        const correctionSystemInstruction = `You are an automated JSON repair tool. You will be given a string that is supposed to be a valid JSON object but contains syntax errors, most likely unescaped double quotes. Your ONLY job is to fix the syntax and return the corrected JSON.

**CRITICAL RULES:**
1. Your entire output MUST be ONLY the raw, valid JSON string.
2. DO NOT wrap the JSON in markdown code blocks (like \`\`\`json ... \`\`\`).
3. DO NOT add any introductory text, explanations, or apologies.
4. The output must start with '{' or '[' and end with '}' or ']'.`;
        const correctionPrompt = `The following string is invalid JSON. Please fix it and return only the valid JSON text.\n\nInvalid JSON:\n${jsonText}`;
        
        const correctionResponse = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: correctionPrompt,
            config: {
                systemInstruction: correctionSystemInstruction,
                temperature: 0.0, // Be very deterministic
            }
        });

        correctionResponseText = correctionResponse.text.trim();
        
        // More robustly find and extract the content of a JSON markdown block
        const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = correctionResponseText.match(markdownRegex);

        if (match && match[1]) {
            // If we found a markdown block, we assume its content is the JSON we want.
            console.log('Stripping markdown fences from corrected JSON.');
            correctionResponseText = match[1].trim();
        }

        const parsedResult: T = JSON.parse(correctionResponseText);
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
