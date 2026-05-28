
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './src/shell.component';
import { routes } from './src/app/app.routes';

bootstrapApplication(ShellComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
