import { ChangeDetectionStrategy, Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeminiService } from './services/gemini.service';
import { AnyValidationResult, RefinedStory, DevelopmentTask, ValidationResult, AdvancedValidationResult, Backlog, BacklogItem, ExtractedBacklogItems, StrategicRefinementResult, ProjectInfo, BacklogDependencyAnalysis, BacklogRiskAnalysis } from './models/validation.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentService } from './services/document.service';
import { DocumentExportService } from './services/document-export.service';
import { ProjectInfoPanelComponent } from './app/features/project-info/project-info-panel.component';
import { DocumentViewerComponent, GeneratedDocument } from './app/features/document-viewer/document-viewer.component';

declare var marked: any; // Allow TypeScript to recognize the 'marked' library from the CDN

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ProjectInfoPanelComponent, DocumentViewerComponent]
})
export class AppComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private documentService = inject(DocumentService);
  private documentExportService = inject(DocumentExportService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // View State
  currentView = signal<'backlog' | 'analyzer' | 'import'>('backlog');

  userStory = signal<string>('Como um novo usuário, eu quero poder me registrar em uma conta usando meu e-mail e senha, para que eu possa acessar os recursos da plataforma.');
  validationResult = signal<AnyValidationResult | null>(null);
  isLoading = signal<boolean>(false);
  activeValidation = signal<'strategic' | null>(null);
  error = signal<string | null>(null);

  // UI State
  copiedStoryIndex = signal<number | null>(null);
  activeTabs = signal<Record<number, 'bdd' | 'cypress' | 'edge' | 'docs'>>({});
  storyAddedToBacklog = signal<Record<number, boolean>>({});
  
  // Alternative formats state
  isGeneratingAltTests = signal<Record<number, boolean>>({});
  alternativeTestResults = signal<Record<number, { format: string; code: string } | null>>({});

  // Technical docs state
  isGeneratingDoc = signal<Record<number, { type: 'doc' | 'c4-diagram' | 'c4-container' | 'sequence-diagram' } | null>>({});
  technicalDocumentation = signal<Record<number, { type: 'doc' | 'c4-diagram' | 'c4-container' | 'sequence-diagram', content: string } | null>>({});

  // Inline edit state
  inlineEditId = signal<number | null>(null);
  inlineEditTitle = signal<string>('');
  isGeneratingDetailedAC = signal<Record<number, boolean>>({});

  // Backlog State
  backlogs = signal<Backlog[]>([]);
  selectedBacklogName = signal<string | null>(null);
  editingStory = signal<BacklogItem | null>(null);

  // Import State
  importedFiles = signal<File[]>([]);
  isImporting = signal<boolean>(false);
  importError = signal<string | null>(null);
  importStep = signal<string | null>(null);

  // Per-story refinement
  refiningStoryId = signal<number | null>(null);

  // Story drawer (visualização inline no backlog)
  viewingStory = signal<BacklogItem | null>(null);

  // Project Info Conflict Modal
  projectInfoConflict = signal<{
    extracted: Partial<ProjectInfo>;
    existing: ProjectInfo;
  } | null>(null);

  // Document Generation State
  generatedDoc = signal<GeneratedDocument | null>(null);
  isGeneratingArtifact = signal<'prd' | 'spec' | null>(null);
  generatingArtifactStep = signal<string | null>(null);

  // Backlog Analysis Modal
  isAnalyzingBacklog = signal<'dependencies' | 'risks' | null>(null);
  backlogAnalysisModal = signal<{
    type: 'dependencies' | 'risks';
    result: BacklogDependencyAnalysis | BacklogRiskAnalysis;
  } | null>(null);

  activeBacklog = computed(() => {
    const selectedName = this.selectedBacklogName();
    if (!selectedName) return null;
    return this.backlogs().find(b => b.projectName === selectedName) ?? null;
  });

  groupedBacklog = computed(() => {
    const active = this.activeBacklog();
    if (!active || !active.items || active.items.length === 0) {
      return null;
    }

    const grouped = active.items.reduce((acc, item) => {
      const epic = item.epicSuggestion || 'Sem Épico';
      const feature = item.featureSuggestion || 'Sem Feature';

      if (!acc[epic]) {
        acc[epic] = {};
      }
      if (!acc[epic][feature]) {
        acc[epic][feature] = [];
      }
      acc[epic][feature].push(item);
      return acc;
    }, {} as { [epic: string]: { [feature: string]: BacklogItem[] } });

    return grouped;
  });

  activeProjectInfo = computed<ProjectInfo | null>(() => this.activeBacklog()?.info ?? null);

  firstValidatedStory = computed<RefinedStory | null>(() => {
    const result = this.validationResult();
    if (!result || result.validationType !== 'strategic') return null;
    return result.refinedStories?.[0] ?? null;
  });

  objectKeys = Object.keys;

  constructor() {
    this.loadBacklogsFromStorage();
  }

  ngOnInit(): void {
    const projectName = this.route.snapshot.paramMap.get('name');
    if (projectName) {
      this.selectedBacklogName.set(decodeURIComponent(projectName));
      this.currentView.set('backlog');
    }
  }

  // View Management
  showBacklog(): void {
    this.currentView.set('backlog');
  }

  showAnalyzer(): void {
    this.currentView.set('analyzer');
  }

  showImporter(): void {
    this.currentView.set('import');
    this.importedFiles.set([]);
    this.importError.set(null);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // Backlog Management
  private loadBacklogsFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const storedBacklogs = localStorage.getItem('userStoryBacklogs');
      if (storedBacklogs) {
        const backlogs: Backlog[] = JSON.parse(storedBacklogs);
        this.backlogs.set(backlogs);
        if (backlogs.length > 0 && !this.selectedBacklogName()) {
          this.selectedBacklogName.set(backlogs[0].projectName);
        }
      }
    }
  }

  private saveBacklogsToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userStoryBacklogs', JSON.stringify(this.backlogs()));
    }
  }

  addStoryToBacklog(storyIndex: number): void {
    const active = this.activeBacklog();
    const result = this.validationResult();

    if (!active || !result || result.validationType !== 'strategic') return;
    const story = result.refinedStories[storyIndex];
    if (!story) return;

    const newBacklogItem: BacklogItem = {
      ...story,
      id: Date.now() + Math.random(),
      order: active.items.length
    };
    
    this.backlogs.update(backlogs => {
      return backlogs.map(b => 
        b.projectName === active.projectName 
          ? { ...b, items: [...b.items, newBacklogItem] }
          : b
      );
    });
    this.saveBacklogsToStorage();
    this.storyAddedToBacklog.update(s => ({ ...s, [storyIndex]: true }));
    setTimeout(() => {
      this.storyAddedToBacklog.update(s => ({ ...s, [storyIndex]: false }));
    }, 2000);
  }

  isStoryInBacklog(storyTitle: string): boolean {
    const active = this.activeBacklog();
    if (!active) return false;
    return active.items.some(item => item.title === storyTitle);
  }
  
  getStoryIndexInBacklog(storyId: number): number {
    const items = this.activeBacklog()?.items ?? [];
    return items.findIndex(item => item.id === storyId);
  }

  moveStory(storyId: number, direction: 'up' | 'down'): void {
    const active = this.activeBacklog();
    if (!active) return;

    const items = [...active.items];
    const index = items.findIndex(item => item.id === storyId);

    if (index === -1) return;
    if (direction === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }

    this.backlogs.update(backlogs => 
      backlogs.map(b => b.projectName === active.projectName ? { ...b, items } : b)
    );
    this.saveBacklogsToStorage();
  }
  
  deleteStory(storyId: number): void {
    const active = this.activeBacklog();
    if (!active || !confirm('Tem certeza que deseja excluir esta história do backlog?')) return;
    
    this.backlogs.update(backlogs => 
      backlogs.map(b => 
        b.projectName === active.projectName 
        ? { ...b, items: b.items.filter(item => item.id !== storyId) }
        : b
      )
    );
    this.saveBacklogsToStorage();
  }

  startEditing(story: BacklogItem): void {
    this.editingStory.set(JSON.parse(JSON.stringify(story))); // Deep copy to avoid mutating state directly
  }

  saveEditing(): void {
    const editedStory = this.editingStory();
    const active = this.activeBacklog();
    if (!editedStory || !active) return;

    this.backlogs.update(backlogs => 
      backlogs.map(b => 
        b.projectName === active.projectName
        ? { ...b, items: b.items.map(item => item.id === editedStory.id ? editedStory : item) }
        : b
      )
    );
    this.saveBacklogsToStorage();
    this.cancelEditing();
  }

  cancelEditing(): void {
    this.editingStory.set(null);
  }

  startInlineEdit(story: BacklogItem): void {
    this.inlineEditId.set(story.id);
    this.inlineEditTitle.set(story.title);
  }

  saveInlineEdit(): void {
    const id = this.inlineEditId();
    const title = this.inlineEditTitle().trim();
    const active = this.activeBacklog();
    if (!id || !title || !active) { this.cancelInlineEdit(); return; }
    this.backlogs.update(backlogs =>
      backlogs.map(b =>
        b.projectName === active.projectName
          ? { ...b, items: b.items.map(item => item.id === id ? { ...item, title } : item) }
          : b
      )
    );
    this.saveBacklogsToStorage();
    this.cancelInlineEdit();
  }

  cancelInlineEdit(): void {
    this.inlineEditId.set(null);
    this.inlineEditTitle.set('');
  }

  downloadGherkinFeature(story: RefinedStory): void {
    const slug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const featureContent = `Feature: ${story.title}\n\n  ${story.userPersona}\n\n${story.acceptanceCriteria}`;
    const blob = new Blob([featureContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.feature`;
    a.click();
    URL.revokeObjectURL(url);
  }

  viewStoryFromBacklog(story: BacklogItem): void {
    const result: StrategicRefinementResult = {
      validationType: 'strategic',
      model: story.model || 'gpt-4o',
      divisionAnalysis: '',
      refinedStories: [story]
    };
    this.validationResult.set(null);
    this.validationResult.set(result);
    this.error.set(null);
    this.isLoading.set(false);
    this.activeValidation.set(null);
    this.storyAddedToBacklog.set({});
    this.currentView.set('analyzer');
  }

  async reAnalyzeCurrentStory(story: RefinedStory): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const prompt = story.businessNarrative?.trim()
        ? `${story.userPersona}\n\nContexto: ${story.businessNarrative}`
        : `Como usuário, quero ${story.title}. Épico: ${story.epicSuggestion}. Feature: ${story.featureSuggestion}.`;
      const result = await this.geminiService.refineUserStoryStrategic(prompt);
      if (!result.refinedStories?.length) return;

      const refined = result.refinedStories[0];
      const storyId = (story as BacklogItem).id;

      if (storyId) {
        const updatedStory: BacklogItem = {
          ...(story as BacklogItem),
          ...refined,
          id: storyId,
          order: (story as BacklogItem).order,
          epicSuggestion: story.epicSuggestion,
          featureSuggestion: story.featureSuggestion,
          sourceFile: story.sourceFile,
          isLiteImport: false,
        };
        const active = this.activeBacklog();
        if (active) {
          this.backlogs.update(bs => bs.map(b =>
            b.projectName === active.projectName
              ? { ...b, items: b.items.map(i => i.id === storyId ? updatedStory : i) }
              : b
          ));
          this.saveBacklogsToStorage();
        }
        this.viewStoryFromBacklog(updatedStory);
      } else {
        this.validationResult.set(result);
        this.currentView.set('analyzer');
      }
    } catch (err) {
      this.error.set(`Falha ao re-analisar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refineStoryInBacklog(story: BacklogItem): Promise<void> {
    this.refiningStoryId.set(story.id);
    this.error.set(null);
    try {
      const prompt = story.businessNarrative
        ? `${story.userPersona}\n\nContexto adicional: ${story.businessNarrative}`
        : `Como usuário, quero ${story.title}. Contexto: ${story.epicSuggestion} > ${story.featureSuggestion}`;
      const result = await this.geminiService.refineUserStoryStrategic(prompt);
      if (result.refinedStories?.length) {
        const refined = result.refinedStories[0];
        const updatedStory: BacklogItem = {
          ...story,
          ...refined,
          id: story.id,
          order: story.order,
          epicSuggestion: story.epicSuggestion,
          featureSuggestion: story.featureSuggestion,
          sourceFile: story.sourceFile,
          isLiteImport: false,
        };
        const active = this.activeBacklog();
        if (active) {
          this.backlogs.update(bs => bs.map(b =>
            b.projectName === active.projectName
              ? { ...b, items: b.items.map(i => i.id === story.id ? updatedStory : i) }
              : b
          ));
          this.saveBacklogsToStorage();
        }
        this.viewStoryFromBacklog(updatedStory);
      }
    } catch (err) {
      this.error.set(`Falha ao refinar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      this.refiningStoryId.set(null);
    }
  }
  
  // UI Actions
  copyToClipboard(story: RefinedStory, index: number): void {
    const textToCopy = this.formatStoryForCopy(story);
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copiedStoryIndex.set(index);
      setTimeout(() => {
        this.copiedStoryIndex.set(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  private formatStoryForCopy(story: RefinedStory): string {
    let content = `
# User Story: ${story.title}
---
**Epic Suggestion:** ${story.epicSuggestion}
**Feature Suggestion:** ${story.featureSuggestion}
---
## User Persona
${story.userPersona}
---
## Business Narrative
${story.businessNarrative}
---
## Acceptance Criteria Summary
${story.acceptanceCriteriaSummary}
---
## Acceptance Criteria (BDD)
\`\`\`gherkin
${story.acceptanceCriteria}
\`\`\`
---
## Test Scenarios

### End-to-End (Cypress)
\`\`\`javascript
${story.testScenarios.e2e}
\`\`\`

### Integration Tests
\`\`\`javascript
${story.testScenarios.integration}
\`\`\`

### Unit Tests
\`\`\`javascript
${story.testScenarios.unit}
\`\`\`
---
## Story Estimate
**Estimate:** ${story.storyEstimate}
**Justification:** ${story.storyEstimateJustification}
---
## Development Tasks (Total: ${story.tasksTotalEstimate})
`;
    story.developmentTasks.forEach((task: DevelopmentTask) => {
      content += `
### ${task.name} (${task.estimate}) - [${task.responsibility}]
- **Description:** ${task.description}
`;
    });
    
    if (story.potentialEdgeCases && story.potentialEdgeCases.length > 0) {
        content += `---
## Potential Edge Cases
`;
        story.potentialEdgeCases.forEach((item: string) => { content += `- ${item}\n`; });
    }
    
    if (story.technicalConsiderations && story.technicalConsiderations.length > 0) {
        content += `---
## Technical Considerations
`;
        story.technicalConsiderations.forEach((item: string) => { content += `- ${item}\n`; });
    }
    
    if (story.identifiedDependencies && story.identifiedDependencies.length > 0) {
        content += `---
## Identified Dependencies
`;
        story.identifiedDependencies.forEach((item: string) => { content += `- ${item}\n`; });
    }

    if (story.riskAnalysis && story.riskAnalysis.length > 0) {
        content += `---
## Risk Analysis
`;
        story.riskAnalysis.forEach(risk => {
            content += `
### [${risk.type}] ${risk.description}
- **Mitigation Suggestion:** ${risk.mitigationSuggestion}
`;
        });
    }

    content += `---
## Questions
`;
    story.questions.forEach((item: string) => { content += `- ${item}\n`; });

    return content.trim();
  }


  async validateStory(): Promise<void> {
    if (!this.userStory().trim()) {
      this.error.set('A história de usuário não pode estar vazia.');
      return;
    }

    this.isLoading.set(true);
    this.activeValidation.set('strategic');
    this.error.set(null);
    this.validationResult.set(null);
    this.activeTabs.set({});
    this.isGeneratingAltTests.set({});
    this.alternativeTestResults.set({});
    this.isGeneratingDoc.set({});
    this.technicalDocumentation.set({});
    this.storyAddedToBacklog.set({});

    try {
      const result = await this.geminiService.refineUserStoryStrategic(this.userStory());
      this.validationResult.set(result);
      if (result.validationType === 'strategic' && result.refinedStories) {
          result.refinedStories.forEach((_, idx) => this.addStoryToBacklog(idx));
      }
    } catch (err) {
      console.error(`Error during strategic validation:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      this.error.set(`Falha ao refinar a história: ${msg}`);
    } finally {
      this.isLoading.set(false);
      this.activeValidation.set(null);
    }
  }
  
  async generateAlternativeTests(story: RefinedStory, storyIndex: number, format: 'Jest' | 'Mocha'): Promise<void> {
    this.isGeneratingAltTests.update(s => ({ ...s, [storyIndex]: true }));
    this.alternativeTestResults.update(r => ({ ...r, [storyIndex]: null }));

    try {
      const code = await this.geminiService.generateAlternativeTestFormat(story.testScenarios, format);
      this.alternativeTestResults.update(r => ({
        ...r,
        [storyIndex]: { format, code }
      }));
    } catch (err) {
      console.error(err);
      this.alternativeTestResults.update(r => ({
        ...r,
        [storyIndex]: { format, code: `// Erro ao gerar o código para ${format}.` }
      }));
    } finally {
      this.isGeneratingAltTests.update(s => ({ ...s, [storyIndex]: false }));
    }
  }

  async generateTechnicalArtifact(story: RefinedStory, storyIndex: number, type: 'doc' | 'c4-diagram' | 'c4-container' | 'sequence-diagram'): Promise<void> {
    this.isGeneratingDoc.update(s => ({ ...s, [storyIndex]: { type } }));
    this.technicalDocumentation.update(r => ({ ...r, [storyIndex]: null }));

    try {
      const considerations = story.technicalConsiderations ?? [];
      const dependencies = story.identifiedDependencies ?? [];

      if (considerations.length === 0 && dependencies.length === 0) {
          this.technicalDocumentation.update(r => ({
              ...r,
              [storyIndex]: { type, content: 'Não há considerações técnicas ou dependências para gerar a documentação.' }
          }));
          return;
      }

      const content = await this.geminiService.generateTechnicalArtifact(considerations, dependencies, type);
      this.technicalDocumentation.update(r => ({
        ...r,
        [storyIndex]: { type, content }
      }));
    } catch (err) {
      console.error(err);
      this.technicalDocumentation.update(r => ({
        ...r,
        [storyIndex]: { type, content: `// Erro ao gerar o artefato técnico.` }
      }));
    } finally {
      this.isGeneratingDoc.update(s => ({ ...s, [storyIndex]: null }));
    }
  }

  async generateDetailedAC(story: RefinedStory, storyIndex: number): Promise<void> {
    this.isGeneratingDetailedAC.update(s => ({ ...s, [storyIndex]: true }));
    
    try {
      const newCriteria = await this.geminiService.generateDetailedAcceptanceCriteria(story);
      
      this.validationResult.update(currentResult => {
        if (!currentResult || currentResult.validationType !== 'strategic') {
          return currentResult;
        }

        const newStories = [...currentResult.refinedStories];
        const updatedStory = { ...newStories[storyIndex], acceptanceCriteria: newCriteria };
        newStories[storyIndex] = updatedStory;

        return { ...currentResult, refinedStories: newStories };
      });

    } catch (err) {
      console.error('Failed to generate detailed acceptance criteria', err);
    } finally {
      this.isGeneratingDetailedAC.update(s => ({ ...s, [storyIndex]: false }));
    }
  }

  setActiveTab(storyIndex: number, tab: 'bdd' | 'cypress' | 'edge' | 'docs'): void {
    this.activeTabs.update(tabs => ({
      ...tabs,
      [storyIndex]: tab
    }));
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const oversizedFile = files.find(file => file.size > 5 * 1024 * 1024); // 5MB limit
      if (oversizedFile) {
        this.importError.set(`O arquivo '${oversizedFile.name}' é muito grande. O limite é de 5MB por arquivo.`);
        this.importedFiles.set([]);
        return;
      }
      this.importedFiles.set(files);
      this.importError.set(null);
    }
  }

  async processImportedFiles(): Promise<void> {
    const files = this.importedFiles();
    const backlogName = this.selectedBacklogName();

    if (files.length === 0 || !backlogName) {
      this.importError.set('Por favor, selecione um ou mais arquivos e um projeto de destino.');
      return;
    }

    this.isImporting.set(true);
    this.importError.set(null);
    this.error.set(null);

    try {
      // 1. Extrai texto de todos os arquivos
      this.importStep.set('Lendo documentos...');
      const fileContents = await Promise.all(
        files.map(async file => ({
          name: file.name,
          content: await this.documentService.extractTextFromFile(file)
        }))
      );

      // 2. Combina todos os arquivos em contexto único e extrai histórias
      const combinedContent = fileContents
        .map(f => `=== DOCUMENTO: ${f.name} ===\n\n${f.content}`)
        .join('\n\n---\n\n');

      const allExtractedItems = await this.geminiService.processDocumentForBacklog(
        combinedContent,
        step => this.importStep.set(step)
      );

      if (allExtractedItems.length === 0 || allExtractedItems.every(group => group.refinedStories.length === 0)) {
        this.importError.set('Nenhuma história foi extraída. Verifique se o documento contém requisitos, funcionalidades ou histórias de usuário legíveis.');
        return;
      }

      const sourceLabel = fileContents.length === 1
        ? fileContents[0].name
        : fileContents.map(f => f.name).join(', ');
      this.addExtractedItemsToBacklog(allExtractedItems, sourceLabel);

      // 3. Extrai info do projeto (opcional — não bloqueia se falhar)
      this.importStep.set('Analisando informações do projeto...');
      const extractedInfo = await this.geminiService.extractProjectInfo(combinedContent);
      const hasExtractedInfo = Object.values(extractedInfo).some(v => v && (v as string).trim().length > 0);
      if (hasExtractedInfo) {
        const active = this.activeBacklog();
        const existingInfo = active?.info;
        const infoIsEmpty = !existingInfo || !(existingInfo.description || existingInfo.objective || existingInfo.targetUsers || existingInfo.stakeholders || existingInfo.techStack || existingInfo.constraints || existingInfo.notes);

        if (infoIsEmpty) {
          // Auto-preenche silenciosamente
          const newInfo: ProjectInfo = {
            description: extractedInfo.description ?? '',
            objective: extractedInfo.objective ?? '',
            targetUsers: extractedInfo.targetUsers ?? '',
            stakeholders: extractedInfo.stakeholders ?? '',
            techStack: extractedInfo.techStack ?? '',
            constraints: extractedInfo.constraints ?? '',
            notes: extractedInfo.notes ?? '',
            updatedAt: Date.now()
          };
          this.saveProjectInfo(newInfo);
        } else {
          // Mostra modal de conflito
          this.projectInfoConflict.set({ extracted: extractedInfo, existing: existingInfo! });
        }
      }

      const allRefinedStories = allExtractedItems.flatMap(group =>
        group.refinedStories.map(story => ({
          ...story,
          epicSuggestion: group.epicSuggestion,
          featureSuggestion: group.featureSuggestion,
        }))
      );

      if (allRefinedStories.length > 0) {
        this.currentView.set('backlog');
      } else {
        this.importError.set('A IA não conseguiu extrair nenhuma história de usuário acionável dos documentos.');
      }

      this.importedFiles.set([]);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.';
      console.error('Error processing imported files:', err);
      this.importError.set(msg);
    } finally {
      this.isImporting.set(false);
      this.importStep.set(null);
    }
  }
  
  private addExtractedItemsToBacklog(extractedItems: ExtractedBacklogItems[], sourceFile?: string): void {
    const selectedProjectName = this.selectedBacklogName();
    if (!selectedProjectName) return;

    this.backlogs.update(backlogs => {
        const projectIndex = backlogs.findIndex(b => b.projectName === selectedProjectName);
        if (projectIndex === -1) return backlogs;

        const updatedProject = { ...backlogs[projectIndex] };
        let currentMaxOrder = updatedProject.items.length > 0 ? Math.max(...updatedProject.items.map(i => i.order)) : -1;

        const newItems: BacklogItem[] = [];
        extractedItems.forEach(group => {
            group.refinedStories.forEach(story => {
                currentMaxOrder++;
                const newBacklogItem: BacklogItem = {
                    ...story,
                    epicSuggestion: group.epicSuggestion,
                    featureSuggestion: group.featureSuggestion,
                    id: Date.now() + Math.random(),
                    order: currentMaxOrder,
                    sourceFile: sourceFile,
                    isLiteImport: story.isLiteImport ?? true,
                };
                newItems.push(newBacklogItem);
            });
        });

        updatedProject.items = [...updatedProject.items, ...newItems];
        
        const newBacklogs = [...backlogs];
        newBacklogs[projectIndex] = updatedProject;
        return newBacklogs;
    });

    this.saveBacklogsToStorage();
  }

  // Project Info Management
  saveProjectInfo(info: ProjectInfo): void {
    const active = this.activeBacklog();
    if (!active) return;
    this.backlogs.update(backlogs =>
      backlogs.map(b =>
        b.projectName === active.projectName ? { ...b, info } : b
      )
    );
    this.saveBacklogsToStorage();
  }

  // Backlog Analysis
  async checkDependencies(): Promise<void> {
    const items = this.activeBacklog()?.items;
    if (!items?.length) return;
    this.isAnalyzingBacklog.set('dependencies');
    try {
      const result = await this.geminiService.analyzeBacklogDependencies(items);
      this.backlogAnalysisModal.set({ type: 'dependencies', result });
    } catch {
      this.error.set('Erro ao analisar dependências. Tente novamente.');
    } finally {
      this.isAnalyzingBacklog.set(null);
    }
  }

  async checkRisks(): Promise<void> {
    const items = this.activeBacklog()?.items;
    if (!items?.length) return;
    this.isAnalyzingBacklog.set('risks');
    try {
      const result = await this.geminiService.analyzeBacklogRisks(items);
      this.backlogAnalysisModal.set({ type: 'risks', result });
    } catch {
      this.error.set('Erro ao analisar riscos. Tente novamente.');
    } finally {
      this.isAnalyzingBacklog.set(null);
    }
  }

  closeBacklogModal(): void {
    this.backlogAnalysisModal.set(null);
  }

  applyExtractedProjectInfo(): void {
    const conflict = this.projectInfoConflict();
    if (!conflict) return;
    const merged: ProjectInfo = {
      description: conflict.extracted.description || conflict.existing.description,
      objective: conflict.extracted.objective || conflict.existing.objective,
      targetUsers: conflict.extracted.targetUsers || conflict.existing.targetUsers,
      stakeholders: conflict.extracted.stakeholders || conflict.existing.stakeholders,
      techStack: conflict.extracted.techStack || conflict.existing.techStack,
      constraints: conflict.extracted.constraints || conflict.existing.constraints,
      notes: conflict.extracted.notes || conflict.existing.notes,
      updatedAt: Date.now()
    };
    this.saveProjectInfo(merged);
    this.projectInfoConflict.set(null);
  }

  overwriteWithExtractedProjectInfo(): void {
    const conflict = this.projectInfoConflict();
    if (!conflict) return;
    const newInfo: ProjectInfo = {
      description: conflict.extracted.description ?? '',
      objective: conflict.extracted.objective ?? '',
      targetUsers: conflict.extracted.targetUsers ?? '',
      stakeholders: conflict.extracted.stakeholders ?? '',
      techStack: conflict.extracted.techStack ?? '',
      constraints: conflict.extracted.constraints ?? '',
      notes: conflict.extracted.notes ?? '',
      updatedAt: Date.now()
    };
    this.saveProjectInfo(newInfo);
    this.projectInfoConflict.set(null);
  }

  dismissProjectInfoConflict(): void {
    this.projectInfoConflict.set(null);
  }

  getInfoField(obj: Partial<ProjectInfo> | null | undefined, key: string): string {
    if (!obj) return '';
    return (obj as Record<string, unknown>)[key] as string ?? '';
  }

  asDependencyAnalysis(result: BacklogDependencyAnalysis | BacklogRiskAnalysis): BacklogDependencyAnalysis {
    return result as BacklogDependencyAnalysis;
  }

  asRiskAnalysis(result: BacklogDependencyAnalysis | BacklogRiskAnalysis): BacklogRiskAnalysis {
    return result as BacklogRiskAnalysis;
  }

  // Document Generation
  private async runBacklogAnalyses() {
    const items = this.activeBacklog()?.items ?? [];
    if (!items.length) return { deps: null, risks: null };
    try {
      this.generatingArtifactStep.set('Analisando dependências e riscos...');
      const [deps, risks] = await Promise.all([
        this.geminiService.analyzeBacklogDependencies(items),
        this.geminiService.analyzeBacklogRisks(items)
      ]);
      return { deps, risks };
    } catch {
      return { deps: null, risks: null };
    }
  }

  async generatePrd(): Promise<void> {
    const active = this.activeBacklog();
    if (!active || active.items.length === 0) return;
    const projectName = active.projectName;
    this.isGeneratingArtifact.set('prd');

    try {
      const { deps, risks } = await this.runBacklogAnalyses();

      this.generatingArtifactStep.set('Gerando PRD...');
      let draft = this.documentExportService.buildPrdDraft(active.items, projectName, active.info ?? null);
      if (deps) draft += this.documentExportService.buildDependencySection(deps);
      if (risks) draft += this.documentExportService.buildRiskSection(risks);

      const polished = await this.geminiService.generateProjectDocument('prd', draft);
      this.generatedDoc.set({
        kind: 'prd',
        title: `PRD — ${projectName}`,
        filename: `prd_${projectName.replace(/\s+/g, '_')}.md`,
        markdown: polished
      });
    } catch {
      const draft = this.documentExportService.buildPrdDraft(active.items, projectName, active.info ?? null);
      this.generatedDoc.set({
        kind: 'prd',
        title: `PRD — ${projectName}`,
        filename: `prd_${projectName.replace(/\s+/g, '_')}.md`,
        markdown: draft
      });
    } finally {
      this.isGeneratingArtifact.set(null);
      this.generatingArtifactStep.set(null);
    }
  }

  async generateSpec(): Promise<void> {
    const active = this.activeBacklog();
    if (!active || active.items.length === 0) return;
    const projectName = active.projectName;
    this.isGeneratingArtifact.set('spec');

    try {
      const { deps, risks } = await this.runBacklogAnalyses();

      this.generatingArtifactStep.set('Gerando Spec...');
      let draft = this.documentExportService.buildSpecDraft(active.items, projectName);
      if (deps) draft += this.documentExportService.buildDependencySection(deps);
      if (risks) draft += this.documentExportService.buildRiskSection(risks);

      const polished = await this.geminiService.generateProjectDocument('spec', draft);
      this.generatedDoc.set({
        kind: 'spec',
        title: `Spec — ${projectName}`,
        filename: `spec_${projectName.replace(/\s+/g, '_')}.md`,
        markdown: polished
      });
    } catch {
      const draft = this.documentExportService.buildSpecDraft(active.items, projectName);
      this.generatedDoc.set({
        kind: 'spec',
        title: `Spec — ${projectName}`,
        filename: `spec_${projectName.replace(/\s+/g, '_')}.md`,
        markdown: draft
      });
    } finally {
      this.isGeneratingArtifact.set(null);
      this.generatingArtifactStep.set(null);
    }
  }

  downloadGeneratedDoc(): void {
    const doc = this.generatedDoc();
    if (!doc) return;
    this.documentExportService.downloadMarkdown(doc.filename, doc.markdown);
  }

  closeGeneratedDoc(): void {
    this.generatedDoc.set(null);
  }

  getProgressBarColor(): string {
    const result = this.validationResult();
    if (!result || result.validationType === 'strategic') {
      return 'bg-gray-500';
    }
    const score = result.overallScore ?? 0;
    if (score > 80) return 'bg-green-500';
    if (score > 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getProgressBarWidth(): string {
     const result = this.validationResult();
     if (!result || result.validationType === 'strategic') {
       return '0%';
     }
     const score = result.overallScore ?? 0;
     return `${score}%`;
  }
  
  markdownToHtml(content: string | undefined | null): SafeHtml {
    if (!content) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    if (typeof marked === 'undefined') {
      console.warn('Marked.js library not loaded. Displaying raw text.');
      const escapedText = new Option(content).innerHTML;
      return this.sanitizer.bypassSecurityTrustHtml(escapedText.replace(/\n/g, '<br>'));
    }
    const rawHtml = marked.parse(content, { gfm: true, breaks: true });
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }
}
