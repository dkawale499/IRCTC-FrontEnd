import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './app/auth.interceptor';
import { AppShellComponent } from './app/app-shell.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppShellComponent, {
	providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor]))]
}).catch((error: unknown) => console.error(error));
