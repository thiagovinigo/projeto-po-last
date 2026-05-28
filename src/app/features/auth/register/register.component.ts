import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal<string | null>(null);
  success = signal(false);
  isLoading = signal(false);

  async onSubmit(): Promise<void> {
    if (this.password() !== this.confirmPassword()) {
      this.error.set('As senhas não coincidem.');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    const { error } = await this.auth.signUp(this.email(), this.password());
    if (error) {
      this.error.set(error);
    } else {
      this.success.set(true);
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
    this.isLoading.set(false);
  }
}
