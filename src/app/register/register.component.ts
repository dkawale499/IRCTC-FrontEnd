import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  phone = '';
  password = '';
  message = '';
  isSubmitting = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  register(): void {
    this.message = '';
    this.isSubmitting = true;
    this.authService.register({ fullName: this.fullName.trim(), email: this.email.trim(), phone: this.phone.trim(), password: this.password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message = this.errorMessage(error, 'Registration failed. Please review your details.');
      }
    });
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
