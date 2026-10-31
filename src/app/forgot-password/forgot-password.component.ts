import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  token = '';
  newPassword = '';
  message = '';

  constructor(private readonly authService: AuthService) {}

  requestToken(): void {
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.token = response.resetToken ?? '';
        this.message = response.resetToken ? 'Reset token created. Enter your new password below.' : 'No account was found for that email.';
      },
      error: (error) => this.message = error.error?.message ?? 'Could not request a reset token.'
    });
  }

  reset(): void {
    this.authService.resetPassword(this.token.trim(), this.newPassword).subscribe({
      next: () => this.message = 'Password reset successful. You can now sign in.',
      error: (error) => this.message = error.error?.message ?? 'Could not reset password.'
    });
  }
}
