import { Injectable } from '@angular/core';
import { RefinedStory, DevelopmentTask, Risk, ProjectInfo } from '../models/validation.model';

@Injectable({ providedIn: 'root' })
export class DocumentExportService {

  buildPrdDraft(story: RefinedStory, projectName: string, info: ProjectInfo | null): string {
    const now = new Date().toLocaleDateString('pt-BR');
    let md = `# PRD — ${story.title}\n\n`;
    md += `**Projeto:** ${projectName}  \n`;
    md += `**Data:** ${now}  \n`;
    md += `**Épico:** ${story.epicSuggestion}  \n`;
    md += `**Feature:** ${story.featureSuggestion}  \n\n`;
    md += `---\n\n`;

    md += `## 1. Visão Geral\n\n`;
    md += `${story.businessNarrative}\n\n`;

    if (info) {
      md += `## 2. Contexto do Projeto\n\n`;
      if (info.description) md += `**Descrição:** ${info.description}\n\n`;
      if (info.objective) md += `**Objetivo:** ${info.objective}\n\n`;
      if (info.targetUsers) md += `**Usuários-Alvo:** ${info.targetUsers}\n\n`;
      if (info.stakeholders) md += `**Stakeholders:** ${info.stakeholders}\n\n`;
      if (info.techStack) md += `**Tech Stack:** ${info.techStack}\n\n`;
      if (info.constraints) md += `**Restrições:** ${info.constraints}\n\n`;
      if (info.notes) md += `**Notas Adicionais:** ${info.notes}\n\n`;
    }

    const sectionNum = info ? 3 : 2;
    md += `## ${sectionNum}. Persona\n\n`;
    md += `${story.userPersona}\n\n`;

    md += `## ${sectionNum + 1}. Objetivos e Requisitos\n\n`;
    md += `${story.acceptanceCriteriaSummary}\n\n`;

    md += `## ${sectionNum + 2}. Critérios de Aceite (BDD)\n\n`;
    md += `\`\`\`gherkin\n${story.acceptanceCriteria}\n\`\`\`\n\n`;

    if (story.interfaceDetails) {
      md += `## ${sectionNum + 3}. Detalhes de Interface\n\n`;
      md += `${story.interfaceDetails}\n\n`;
    }

    md += `## ${sectionNum + 4}. Estimativa\n\n`;
    md += `**Estimativa:** ${story.storyEstimate}  \n`;
    md += `**Justificativa:** ${story.storyEstimateJustification}\n\n`;

    if (story.questions && story.questions.length > 0) {
      md += `## ${sectionNum + 5}. Dúvidas em Aberto\n\n`;
      story.questions.forEach(q => { md += `- ${q}\n`; });
      md += '\n';
    }

    return md.trim();
  }

  buildSpecDraft(story: RefinedStory, projectName: string): string {
    const now = new Date().toLocaleDateString('pt-BR');
    let md = `# Spec Técnica — ${story.title}\n\n`;
    md += `**Projeto:** ${projectName}  \n`;
    md += `**Data:** ${now}  \n`;
    md += `**Épico:** ${story.epicSuggestion}  \n`;
    md += `**Feature:** ${story.featureSuggestion}  \n\n`;
    md += `---\n\n`;

    md += `## 1. Critérios de Aceite (BDD)\n\n`;
    md += `\`\`\`gherkin\n${story.acceptanceCriteria}\n\`\`\`\n\n`;

    md += `## 2. Cenários de Teste\n\n`;
    md += `### E2E (Cypress)\n\n`;
    md += `\`\`\`javascript\n${story.testScenarios.e2e}\n\`\`\`\n\n`;
    md += `### Integração\n\n`;
    md += `\`\`\`javascript\n${story.testScenarios.integration}\n\`\`\`\n\n`;
    md += `### Unitários\n\n`;
    md += `\`\`\`javascript\n${story.testScenarios.unit}\n\`\`\`\n\n`;

    if (story.developmentTasks && story.developmentTasks.length > 0) {
      md += `## 3. Tarefas de Desenvolvimento\n\n`;
      md += `**Total estimado:** ${story.tasksTotalEstimate}\n\n`;
      md += `| Tarefa | Responsável | Estimativa |\n`;
      md += `|--------|-------------|------------|\n`;
      story.developmentTasks.forEach((t: DevelopmentTask) => {
        md += `| ${t.name} | ${t.responsibility} | ${t.estimate} |\n`;
      });
      md += '\n';
      story.developmentTasks.forEach((t: DevelopmentTask) => {
        md += `### ${t.name}\n`;
        md += `**Descrição:** ${t.description}  \n`;
        md += `**Justificativa:** ${t.justification}  \n`;
        md += `**Justificativa Técnica:** ${t.technicalJustification}\n\n`;
      });
    }

    if (story.technicalConsiderations && story.technicalConsiderations.length > 0) {
      md += `## 4. Considerações Técnicas\n\n`;
      story.technicalConsiderations.forEach(c => { md += `- ${c}\n`; });
      md += '\n';
    }

    if (story.identifiedDependencies && story.identifiedDependencies.length > 0) {
      md += `## 5. Dependências Identificadas\n\n`;
      story.identifiedDependencies.forEach(d => { md += `- ${d}\n`; });
      md += '\n';
    }

    if (story.potentialEdgeCases && story.potentialEdgeCases.length > 0) {
      md += `## 6. Casos Extremos\n\n`;
      story.potentialEdgeCases.forEach(e => { md += `- ${e}\n`; });
      md += '\n';
    }

    if (story.riskAnalysis && story.riskAnalysis.length > 0) {
      md += `## 7. Análise de Riscos\n\n`;
      story.riskAnalysis.forEach((r: Risk) => {
        md += `### [${r.type}] ${r.description}\n`;
        md += `**Mitigação:** ${r.mitigationSuggestion}\n\n`;
      });
    }

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
