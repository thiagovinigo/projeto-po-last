import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly isLoading = signal(true);

  async initSession(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    this.user.set(data.session?.user ?? null);
    this.isLoading.set(false);

    supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
    });
  }

  async signUp(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await this.router.navigate(['/']);
    }
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
