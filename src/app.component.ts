import { ChangeDetectionStrategy, Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GeminiService } from './services/gemini.service';
import { AnyValidationResult, HistoryItem, RefinedStory, DevelopmentTask, ValidationResult, AdvancedValidationResult, Backlog, BacklogItem, ExtractedBacklogItems, StrategicRefinementResult } from './models/validation.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentService } from './services/document.service';

declare var marked: any; // Allow TypeScript to recognize the 'marked' library from the CDN

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class AppComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private documentService = inject(DocumentService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // View State
  currentView = signal<'analyzer' | 'import'>('analyzer');

  userStory = signal<string>('Como um novo usuário, eu quero poder me registrar em uma conta usando meu e-mail e senha, para que eu possa acessar os recursos da plataforma.');
  validationResult = signal<AnyValidationResult | null>(null);
  isLoading = signal<boolean>(false);
  activeValidation = signal<'strategic' | null>(null);
  error = signal<string | null>(null);

  // History State
  history = signal<HistoryItem[]>([]);
  
  // UI State
  copiedStoryIndex = signal<number | null>(null);
  activeTabs = signal<Record<number, 'bdd' | 'cypress' | 'edge' | 'docs'>>({});
  storyAddedToBacklog = signal<Record<number, boolean>>({});
  activeSideTab = signal<'history' | 'backlog'>('history');
  
  // Alternative formats state
  isGeneratingAltTests = signal<Record<number, boolean>>({});
  alternativeTestResults = signal<Record<number, { format: string; code: string } | null>>({});

  // Technical docs state
  isGeneratingDoc = signal<Record<number, { type: 'doc' | 'c4-diagram' } | null>>({});
  technicalDocumentation = signal<Record<number, { type: 'doc' | 'c4-diagram', content: string } | null>>({});
  isGeneratingDetailedAC = signal<Record<number, boolean>>({});

  // Backlog State
  backlogs = signal<Backlog[]>([]);
  selectedBacklogName = signal<string | null>(null);
  showCreateBacklogInput = signal<boolean>(false);
  newProjectName = signal<string>('');
  editingStory = signal<BacklogItem | null>(null);

  // Import State
  importedFiles = signal<File[]>([]);
  isImporting = signal<boolean>(false);
  importError = signal<string | null>(null);
  
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

  objectKeys = Object.keys;

  constructor() {
    this.loadHistoryFromStorage();
    this.loadBacklogsFromStorage();
  }

  ngOnInit(): void {
    const projectName = this.route.snapshot.paramMap.get('name');
    if (projectName) {
      this.selectedBacklogName.set(decodeURIComponent(projectName));
      this.currentView.set('analyzer');
    }
  }

  // View Management
  showAnalyzer(): void {
    this.currentView.set('analyzer');
    this.activeSideTab.set('history');
  }

  showImporter(): void {
    this.currentView.set('import');
    this.importedFiles.set([]);
    this.importError.set(null);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // History Management
  private loadHistoryFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const storedHistory = localStorage.getItem('userStoryHistory');
      if (storedHistory) {
        this.history.set(JSON.parse(storedHistory));
      }
    }
  }

  private addToHistory(userStory: string, result: AnyValidationResult): void {
    const newItem: HistoryItem = {
      id: Date.now(),
      userStory,
      result,
      timestamp: Date.now(),
      model: result.model
    };

    if (result.validationType === 'strategic' && result.refinedStories && result.refinedStories.length > 0) {
        newItem.epicSuggestion = result.refinedStories[0].epicSuggestion;
        newItem.featureSuggestion = result.refinedStories[0].featureSuggestion;
        
        const totalHours = result.refinedStories.reduce((acc, story) => {
            const hours = parseFloat(story.storyEstimate.replace('h', ''));
            return acc + (isNaN(hours) ? 0 : hours);
        }, 0);
        newItem.storyEstimate = `${totalHours}h`;
    }

    this.history.update(currentHistory => [newItem, ...currentHistory].slice(0, 50)); 
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userStoryHistory', JSON.stringify(this.history()));
    }
  }

  loadFromHistory(item: HistoryItem): void {
    this.userStory.set(item.userStory);
    this.validationResult.set(item.result);
    this.error.set(null);
  }

  clearHistory(): void {
    this.history.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userStoryHistory');
    }
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

  createBacklog(): void {
    const name = this.newProjectName().trim();
    if (name && !this.backlogs().some(b => b.projectName === name)) {
      this.backlogs.update(b => [...b, { projectName: name, items: [] }]);
      this.selectedBacklogName.set(name);
      this.saveBacklogsToStorage();
      this.newProjectName.set('');
      this.showCreateBacklogInput.set(false);
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
      id: Date.now(),
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

  viewStoryFromBacklog(story: BacklogItem): void {
    const result: StrategicRefinementResult = {
      validationType: 'strategic',
      model: story.model || 'gemini-2.5-flash',
      divisionAnalysis: `Visualizando a história "${story.title}" a partir do backlog do projeto "${this.selectedBacklogName()}".`,
      refinedStories: [story]
    };
    
    // Clear previous state and set the new one
    this.validationResult.set(null); // set to null first to ensure change detection triggers for the object
    this.validationResult.set(result);
    this.error.set(null);
    this.isLoading.set(false);
    this.activeValidation.set(null);
    this.storyAddedToBacklog.set({}); // Reset 'added' status
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
      this.addToHistory(this.userStory(), result);
    } catch (err) {
      console.error(`Error during strategic validation:`, err);
      this.error.set('Falha ao obter a validação da IA. Por favor, verifique sua chave de API e tente novamente.');
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

  async generateTechnicalArtifact(story: RefinedStory, storyIndex: number, type: 'doc' | 'c4-diagram'): Promise<void> {
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
  
  setActiveSideTab(tab: 'history' | 'backlog'): void {
      this.activeSideTab.set(tab);
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
      const fileProcessingPromises = files.map(file => {
        return new Promise<ExtractedBacklogItems[]>(async (resolve, reject) => {
          try {
            const content = await this.documentService.extractTextFromFile(file);
            const result = await this.geminiService.processDocumentForBacklog(content);
            resolve(result);
          } catch (err) {
            reject(new Error(`Falha ao processar o arquivo ${file.name}: ${err}`));
          }
        });
      });

      const resultsFromAllFiles = await Promise.all(fileProcessingPromises);
      const allExtractedItems = resultsFromAllFiles.flat();
      
      if (allExtractedItems.length === 0 && allExtractedItems.every(group => group.refinedStories.length === 0)) {
          this.importError.set('A IA não conseguiu extrair nenhuma história de usuário acionável dos documentos fornecidos.');
          return;
      }

      this.addExtractedItemsToBacklog(allExtractedItems);

      const allRefinedStories = allExtractedItems.flatMap(group =>
        group.refinedStories.map(story => ({
          ...story,
          epicSuggestion: group.epicSuggestion,
          featureSuggestion: group.featureSuggestion,
        }))
      );

      if (allRefinedStories.length > 0) {
        // Navigate to the backlog tab after successful import
        this.currentView.set('analyzer');
        this.activeSideTab.set('backlog');
      } else {
        this.importError.set('A IA não conseguiu extrair nenhuma história de usuário acionável dos documentos.');
      }

      this.importedFiles.set([]);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Error processing imported files:', err);
      this.importError.set('A IA falhou em processar um ou mais documentos. Verifique o conteúdo ou tente novamente.');
    } finally {
      this.isImporting.set(false);
    }
  }
  
  private addExtractedItemsToBacklog(extractedItems: ExtractedBacklogItems[]): void {
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
                    id: Date.now() + Math.random(), // Avoid collision in fast loops
                    order: currentMaxOrder
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
