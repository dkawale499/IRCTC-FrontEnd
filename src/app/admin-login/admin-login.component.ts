import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  message = '';
  isSubmitting = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  login(): void {
    this.message = '';
    this.isSubmitting = true;
    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        if (!this.authService.isAdmin()) {
          this.authService.logout();
          this.message = 'This is a user account. Use User login.';
          return;
        }
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message = this.errorMessage(error, 'Administrator sign-in failed.');
      }
    });
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
