import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth = inject(AuthService);

  email = signal('');
  password = signal('');
  error = signal<string | null>(null);
  isLoading = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) return;
    this.isLoading.set(true);
    this.error.set(null);
    const { error } = await this.auth.signIn(this.email(), this.password());
    this.error.set(error);
    this.isLoading.set(false);
  }
}
