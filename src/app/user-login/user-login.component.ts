import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.css'
})
export class UserLoginComponent {
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
        if (this.authService.isAdmin()) {
          this.authService.logout();
          this.message = 'This is an administrator account. Use Admin login.';
          return;
        }
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message = this.errorMessage(error, 'Unable to sign in. Check your details.');
      }
    });
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
