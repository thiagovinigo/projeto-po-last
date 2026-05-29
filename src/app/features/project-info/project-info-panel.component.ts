import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectInfo, createEmptyProjectInfo } from '../../../models/validation.model';

@Component({
  selector: 'app-project-info-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-info-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectInfoPanelComponent {
  info = input<ProjectInfo | null>(null);
  save = output<ProjectInfo>();
  cancel = output<void>();

  isEditing = signal<boolean>(false);
  editingCopy = signal<ProjectInfo>(createEmptyProjectInfo());

  startEdit(): void {
    const current = this.info();
    this.editingCopy.set(
      current ? { ...current } : createEmptyProjectInfo()
    );
    this.isEditing.set(true);
  }

  confirmSave(): void {
    this.save.emit({ ...this.editingCopy(), updatedAt: Date.now() });
    this.isEditing.set(false);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.cancel.emit();
  }

  updateField(field: keyof ProjectInfo, value: string): void {
    this.editingCopy.update(c => ({ ...c, [field]: value }));
  }

  hasContent(): boolean {
    const i = this.info();
    if (!i) return false;
    return !!(i.description || i.objective || i.targetUsers || i.stakeholders || i.techStack || i.constraints || i.notes);
  }
}
