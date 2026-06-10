import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectService } from '../../core/services/project.service';
import { GeminiService } from '../../../services/gemini.service';
import { Backlog, BacklogItem } from '../../../models/validation.model';

declare var marked: any;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-story-detail',
  templateUrl: './story-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class StoryDetailComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatEnd') private chatEnd?: ElementRef<HTMLDivElement>;

  private projectService = inject(ProjectService);
  private geminiService = inject(GeminiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  backlog = signal<Backlog | null>(null);
  currentStory = signal<BacklogItem | null>(null);
  isLoading = signal(true);
  isRefining = signal(false);
  refineError = signal<string | null>(null);

  chatMessages = signal<ChatMessage[]>([]);
  chatInput = signal('');
  isChatting = signal(false);
  chatError = signal<string | null>(null);

  collapsedEpics = signal<Set<string>>(new Set());

  groupedBacklog = computed(() => {
    const b = this.backlog();
    if (!b?.items?.length) return {} as Record<string, Record<string, BacklogItem[]>>;
    return b.items.reduce(
      (acc, item) => {
        const epic = item.epicSuggestion || 'Sem Épico';
        const feat = item.featureSuggestion || 'Sem Feature';
        if (!acc[epic]) acc[epic] = {};
        if (!acc[epic][feat]) acc[epic][feat] = [];
        acc[epic][feat].push(item);
        return acc;
      },
      {} as Record<string, Record<string, BacklogItem[]>>,
    );
  });

  objectKeys = Object.keys;
  private shouldScrollChat = false;

  ngOnInit(): void {
    const projectName = decodeURIComponent(this.route.snapshot.paramMap.get('name') ?? '');
    const storyId = parseFloat(this.route.snapshot.paramMap.get('id') ?? '0');
    void this.load(projectName, storyId);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollChat) {
      this.chatEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScrollChat = false;
    }
  }

  private async load(projectName: string, storyId: number): Promise<void> {
    try {
      const backlogs = await this.projectService.loadProjects();
      const backlog = backlogs.find(b => b.projectName === projectName) ?? null;
      this.backlog.set(backlog);
      if (backlog) {
        this.currentStory.set(backlog.items.find(i => i.id === storyId) ?? null);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToStory(story: BacklogItem): void {
    const name = this.route.snapshot.paramMap.get('name') ?? '';
    this.currentStory.set(story);
    this.chatMessages.set([]);
    this.chatError.set(null);
    this.refineError.set(null);
    this.router.navigate(['/project', name, 'story', story.id], { replaceUrl: true });
  }

  goBack(): void {
    const name = this.route.snapshot.paramMap.get('name') ?? '';
    this.router.navigate(['/project', decodeURIComponent(name)]);
  }

  toggleEpic(epic: string): void {
    this.collapsedEpics.update(s => {
      const next = new Set(s);
      if (next.has(epic)) next.delete(epic);
      else next.add(epic);
      return next;
    });
  }

  isCurrentStory(story: BacklogItem): boolean {
    return story.id === this.currentStory()?.id;
  }

  async refineStory(): Promise<void> {
    const story = this.currentStory();
    if (!story) return;
    this.isRefining.set(true);
    this.refineError.set(null);
    try {
      const prompt = story.businessNarrative
        ? `${story.userPersona}\n\nContexto: ${story.businessNarrative}`
        : `Como usuário, quero ${story.title}. Épico: ${story.epicSuggestion}. Feature: ${story.featureSuggestion}.`;
      const result = await this.geminiService.refineUserStoryStrategic(prompt);
      if (!result.refinedStories?.length) return;
      const updated: BacklogItem = {
        ...story,
        ...result.refinedStories[0],
        id: story.id,
        order: story.order,
        epicSuggestion: story.epicSuggestion,
        featureSuggestion: story.featureSuggestion,
        sourceFile: story.sourceFile,
        isLiteImport: false,
        refinedByAI: true,
      };
      const backlog = this.backlog();
      if (backlog) {
        const updatedBacklog = {
          ...backlog,
          items: backlog.items.map(i => (i.id === story.id ? updated : i)),
        };
        this.backlog.set(updatedBacklog);
        await this.projectService.saveProject(updatedBacklog);
      }
      this.currentStory.set(updated);
    } catch (err) {
      this.refineError.set(err instanceof Error ? err.message : 'Erro ao refinar');
    } finally {
      this.isRefining.set(false);
    }
  }

  async sendChat(): Promise<void> {
    const input = this.chatInput().trim();
    const story = this.currentStory();
    if (!input || !story || this.isChatting()) return;

    this.chatMessages.update(msgs => [...msgs, { role: 'user', content: input }]);
    this.chatInput.set('');
    this.isChatting.set(true);
    this.chatError.set(null);
    this.shouldScrollChat = true;

    try {
      const history = this.chatMessages().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      const reply = await this.geminiService.chatWithPOExpert(history, story);
      this.chatMessages.update(msgs => [...msgs, { role: 'assistant', content: reply }]);
      this.shouldScrollChat = true;
    } catch {
      this.chatError.set('Falha no chat. Tente novamente.');
    } finally {
      this.isChatting.set(false);
    }
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.sendChat();
    }
  }

  markdownToHtml(content: string | undefined | null): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    if (typeof marked === 'undefined') {
      return this.sanitizer.bypassSecurityTrustHtml(
        new Option(content).innerHTML.replace(/\n/g, '<br>'),
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(
      marked.parse(content, { gfm: true, breaks: true }),
    );
  }
}
