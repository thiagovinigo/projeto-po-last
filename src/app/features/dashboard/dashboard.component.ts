import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
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

  backlogs = signal<Backlog[]>([]);
  showCreateInput = signal(false);
  newProjectName = signal('');
  errorMessage = signal<string | null>(null);

  hasProjects = computed(() => this.backlogs().length > 0);
  userEmail = computed(() => this.auth.user()?.email ?? '');

  ngOnInit(): void {
    this.loadBacklogs();
  }

  private loadBacklogs(): void {
    try {
      const stored = localStorage.getItem('userStoryBacklogs');
      this.backlogs.set(stored ? JSON.parse(stored) : []);
    } catch {
      this.backlogs.set([]);
    }
  }

  private saveBacklogs(backlogs: Backlog[]): void {
    localStorage.setItem('userStoryBacklogs', JSON.stringify(backlogs));
    this.backlogs.set(backlogs);
  }

  openProject(projectName: string): void {
    this.router.navigate(['/project', projectName]);
  }

  createProject(): void {
    const name = this.newProjectName().trim();
    if (!name) return;

    if (this.backlogs().some(b => b.projectName === name)) {
      this.errorMessage.set('Já existe um projeto com esse nome.');
      return;
    }

    const newBacklog: Backlog = { projectName: name, items: [] };
    this.saveBacklogs([...this.backlogs(), newBacklog]);
    this.router.navigate(['/project', name]);
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
