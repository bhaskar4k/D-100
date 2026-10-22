import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtInterceptor } from './middleware/JwtInterceptor';
import { MAT_PAGINATOR_DEFAULT_OPTIONS, MatPaginatorDefaultOptions } from '@angular/material/paginator';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        JwtInterceptor
      ])
    ),
    {
      provide: MAT_PAGINATOR_DEFAULT_OPTIONS,
      useValue: {
        formFieldAppearance: 'outline',
        selectConfig: { panelClass: 'app-paginator-select-panel' }
      } as MatPaginatorDefaultOptions
    }
  ]
};
