
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './src/shell.component';
import { routes } from './src/app/app.routes';
import { AuthService } from './src/app/core/services/auth.service';

bootstrapApplication(ShellComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initSession(),
      deps: [AuthService],
      multi: true,
    },
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
