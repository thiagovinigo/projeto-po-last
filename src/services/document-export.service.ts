import { Injectable } from '@angular/core';
import { RefinedStory, DevelopmentTask, Risk, ProjectInfo, BacklogItem } from '../models/validation.model';

@Injectable({ providedIn: 'root' })
export class DocumentExportService {

  buildPrdDraft(stories: BacklogItem[], projectName: string, info: ProjectInfo | null): string {
    const now = new Date().toLocaleDateString('pt-BR');
    let md = `# PRD — ${projectName}\n\n`;
    md += `**Data:** ${now}  \n\n`;
    md += `---\n\n`;

    if (info) {
      md += `## 1. Contexto do Projeto\n\n`;
      if (info.description) md += `**Descrição:** ${info.description}\n\n`;
      if (info.objective) md += `**Objetivo:** ${info.objective}\n\n`;
      if (info.targetUsers) md += `**Usuários-Alvo:** ${info.targetUsers}\n\n`;
      if (info.stakeholders) md += `**Stakeholders:** ${info.stakeholders}\n\n`;
      if (info.techStack) md += `**Tech Stack:** ${info.techStack}\n\n`;
      if (info.constraints) md += `**Restrições:** ${info.constraints}\n\n`;
      if (info.notes) md += `**Notas Adicionais:** ${info.notes}\n\n`;
    }

    const sectionNum = info ? 2 : 1;
    md += `## ${sectionNum}. Histórias de Usuário\n\n`;

    stories.forEach((story, index) => {
        md += `### ${sectionNum}.${index + 1}. ${story.title}\n\n`;
        md += `**Épico:** ${story.epicSuggestion} | **Feature:** ${story.featureSuggestion}\n\n`;
        
        md += `#### Visão Geral\n${story.businessNarrative}\n\n`;
        md += `#### Persona\n${story.userPersona}\n\n`;
        md += `#### Objetivos e Requisitos\n${story.acceptanceCriteriaSummary}\n\n`;
        md += `#### Critérios de Aceite (BDD)\n\`\`\`gherkin\n${story.acceptanceCriteria}\n\`\`\`\n\n`;

        if (story.interfaceDetails) {
            md += `#### Detalhes de Interface\n${story.interfaceDetails}\n\n`;
        }

        md += `#### Estimativa\n**Estimativa:** ${story.storyEstimate}  \n**Justificativa:** ${story.storyEstimateJustification}\n\n`;

        if (story.questions && story.questions.length > 0) {
            md += `#### Dúvidas em Aberto\n`;
            story.questions.forEach(q => { md += `- ${q}\n`; });
            md += '\n';
        }
        md += `---\n\n`;
    });

    return md.trim();
  }

  buildSpecDraft(stories: BacklogItem[], projectName: string): string {
    const now = new Date().toLocaleDateString('pt-BR');
    let md = `# Spec Técnica — ${projectName}\n\n`;
    md += `**Data:** ${now}  \n\n`;
    md += `---\n\n`;

    stories.forEach((story, index) => {
        md += `## ${index + 1}. ${story.title}\n\n`;
        md += `**Épico:** ${story.epicSuggestion} | **Feature:** ${story.featureSuggestion}\n\n`;

        md += `### ${index + 1}.1. Critérios de Aceite (BDD)\n\n`;
        md += `\`\`\`gherkin\n${story.acceptanceCriteria}\n\`\`\`\n\n`;

        md += `### ${index + 1}.2. Cenários de Teste\n\n`;
        md += `#### E2E (Cypress)\n\`\`\`javascript\n${story.testScenarios.e2e}\n\`\`\`\n\n`;
        md += `#### Integração\n\`\`\`javascript\n${story.testScenarios.integration}\n\`\`\`\n\n`;
        md += `#### Unitários\n\`\`\`javascript\n${story.testScenarios.unit}\n\`\`\`\n\n`;

        if (story.developmentTasks && story.developmentTasks.length > 0) {
          md += `### ${index + 1}.3. Tarefas de Desenvolvimento\n\n`;
          md += `**Total estimado:** ${story.tasksTotalEstimate}\n\n`;
          md += `| Tarefa | Responsável | Estimativa |\n`;
          md += `|--------|-------------|------------|\n`;
          story.developmentTasks.forEach((t: DevelopmentTask) => {
            md += `| ${t.name} | ${t.responsibility} | ${t.estimate} |\n`;
          });
          md += '\n';
          story.developmentTasks.forEach((t: DevelopmentTask) => {
            md += `#### ${t.name}\n`;
            md += `**Descrição:** ${t.description}  \n`;
            md += `**Justificativa:** ${t.justification}  \n`;
            md += `**Justificativa Técnica:** ${t.technicalJustification}\n\n`;
          });
        }

        if (story.technicalConsiderations && story.technicalConsiderations.length > 0) {
          md += `### ${index + 1}.4. Considerações Técnicas\n\n`;
          story.technicalConsiderations.forEach(c => { md += `- ${c}\n`; });
          md += '\n';
        }

        if (story.identifiedDependencies && story.identifiedDependencies.length > 0) {
          md += `### ${index + 1}.5. Dependências Identificadas\n\n`;
          story.identifiedDependencies.forEach(d => { md += `- ${d}\n`; });
          md += '\n';
        }

        if (story.potentialEdgeCases && story.potentialEdgeCases.length > 0) {
          md += `### ${index + 1}.6. Casos Extremos\n\n`;
          story.potentialEdgeCases.forEach(e => { md += `- ${e}\n`; });
          md += '\n';
        }

        if (story.riskAnalysis && story.riskAnalysis.length > 0) {
          md += `### ${index + 1}.7. Análise de Riscos\n\n`;
          story.riskAnalysis.forEach((r: Risk) => {
            md += `#### [${r.type}] ${r.description}\n`;
            md += `**Mitigação:** ${r.mitigationSuggestion}\n\n`;
          });
        }
        md += `---\n\n`;
    });

    return md.trim();
  }

  downloadMarkdown(filename: string, content: string): void {
    if (typeof document === 'undefined') return;
    const safeFilename = filename.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename.endsWith('.md') ? safeFilename : `${safeFilename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
