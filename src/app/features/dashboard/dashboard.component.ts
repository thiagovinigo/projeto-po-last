import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { Backlog } from '../../../models/validation.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private projectService = inject(ProjectService);

  backlogs = signal<Backlog[]>([]);
  showCreateInput = signal(false);
  newProjectName = signal('');
  errorMessage = signal<string | null>(null);
  isLoadingProjects = signal(true);

  hasProjects = computed(() => this.backlogs().length > 0);
  userEmail = computed(() => this.auth.user()?.email ?? '');

  ngOnInit(): void {
    void this.loadBacklogs();
  }

  private async loadBacklogs(): Promise<void> {
    try {
      const backlogs = await this.projectService.loadProjects();
      this.backlogs.set(backlogs);
    } catch (err) {
      console.error('Failed to load projects:', err);
      this.backlogs.set([]);
    } finally {
      this.isLoadingProjects.set(false);
    }
  }

  openProject(projectName: string): void {
    this.router.navigate(['/project', projectName]);
  }

  async createProject(): Promise<void> {
    const name = this.newProjectName().trim();
    if (!name) return;

    if (this.backlogs().some(b => b.projectName === name)) {
      this.errorMessage.set('Já existe um projeto com esse nome.');
      return;
    }

    const newBacklog: Backlog = { projectName: name, items: [] };
    try {
      await this.projectService.saveProject(newBacklog);
      this.backlogs.update(bs => [...bs, newBacklog]);
      this.router.navigate(['/project', name]);
    } catch {
      this.errorMessage.set('Erro ao criar projeto. Tente novamente.');
    }
  }

  async deleteProject(projectName: string): Promise<void> {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectName}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await this.projectService.deleteProject(projectName);
      this.backlogs.update(bs => bs.filter(b => b.projectName !== projectName));
    } catch {
      this.errorMessage.set('Erro ao excluir projeto. Tente novamente.');
    }
  }

  showCreate(): void {
    this.showCreateInput.set(true);
    this.errorMessage.set(null);
  }

  cancelCreate(): void {
    this.showCreateInput.set(false);
    this.newProjectName.set('');
    this.errorMessage.set(null);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  storyCount(backlog: Backlog): number {
    return backlog.items.length;
  }
}
