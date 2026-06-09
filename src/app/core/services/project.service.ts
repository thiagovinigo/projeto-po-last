import { Injectable, inject } from '@angular/core';
import { supabase } from '../config/supabase.client';
import { AuthService } from './auth.service';
import { Backlog } from '../../../models/validation.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private auth = inject(AuthService);

  async loadProjects(): Promise<Backlog[]> {
    const user = this.auth.user();
    if (!user) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('name, items, info')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(row => ({
      projectName: row['name'] as string,
      items: (row['items'] as Backlog['items']) ?? [],
      info: (row['info'] as Backlog['info']) ?? undefined,
    }));
  }

  async saveProject(backlog: Backlog): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .upsert(
        {
          user_id: user.id,
          name: backlog.projectName,
          items: backlog.items,
          info: backlog.info ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,name' }
      );

    if (error) throw error;
  }

  async deleteProject(projectName: string): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', user.id)
      .eq('name', projectName);

    if (error) throw error;
  }

  async deleteAllProjects(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  }
}
