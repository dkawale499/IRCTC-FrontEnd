import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  @Input() variant: 'default' | 'home' | 'dashboard' | 'admin' = 'default';
  currentTime = '';
  openHomeMenu: 'trains' | 'meals' | 'loyalty' | 'wallet' | null = null;
  isAccountMenuOpen = false;
  isLoginOpen = false;
  loginRole: 'user' | 'admin' = 'user';
  loginEmail = '';
  loginPassword = '';
  loginMessage = '';
  isSubmittingLogin = false;
  private clockId?: number;

  constructor(
    readonly authService: AuthService,
    private readonly router: Router,
    private readonly elementRef: ElementRef<HTMLElement>
  ) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get displayName(): string {
    return this.isAdmin ? 'ADMIN' : this.authService.getDisplayName();
  }

  isAdminPathActive(path: string): boolean {
    return this.router.url.split('?')[0] === path;
  }

  ngOnInit(): void {
    this.updateTime();
    this.clockId = window.setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockId) {
      window.clearInterval(this.clockId);
    }
  }

  logout(): void {
    const isAdminAccount = this.isAdmin;
    this.isAccountMenuOpen = false;
    this.authService.logout();
    this.router.navigate([isAdminAccount ? '/admin-login' : '/login']);
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
    this.closeHomeMenu();
  }

  toggleHomeMenu(menu: 'trains' | 'meals' | 'loyalty' | 'wallet'): void {
    this.openHomeMenu = this.openHomeMenu === menu ? null : menu;
    this.isAccountMenuOpen = false;
  }

  closeHomeMenu(): void {
    this.openHomeMenu = null;
  }

  closeAccountMenu(): void {
    this.isAccountMenuOpen = false;
  }

  openLogin(role: 'user' | 'admin' = 'user'): void {
    this.loginRole = role;
    this.loginMessage = '';
    this.isLoginOpen = true;
    this.closeHomeMenu();
  }

  closeLogin(): void {
    this.isLoginOpen = false;
    this.loginMessage = '';
  }

  selectLoginRole(role: 'user' | 'admin'): void {
    this.loginRole = role;
    this.loginMessage = '';
  }

  login(): void {
    this.loginMessage = '';
    this.isSubmittingLogin = true;
    this.authService.login(this.loginEmail.trim(), this.loginPassword).subscribe({
      next: () => {
        this.isSubmittingLogin = false;
        const isAdminAccount = this.authService.isAdmin();
        if ((this.loginRole === 'admin') !== isAdminAccount) {
          this.authService.logout();
          this.loginMessage = this.loginRole === 'admin'
            ? 'This is a user account. Choose User Login.'
            : 'This is an administrator account. Choose Admin Login.';
          return;
        }

        this.closeLogin();
        this.router.navigate([isAdminAccount ? '/admin' : '/']);
      },
      error: (error) => {
        this.isSubmittingLogin = false;
        this.loginMessage = this.errorMessage(error, 'Unable to sign in. Check your email and password.');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  closeTrainsMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeHomeMenu();
      this.closeAccountMenu();
      this.closeLogin();
    }
  }

  @HostListener('document:keydown.escape')
  closeTrainsMenuOnEscape(): void {
    this.closeHomeMenu();
    this.closeAccountMenu();
    this.closeLogin();
  }

  private updateTime(): void {
    this.currentTime = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(new Date());
  }

  private errorMessage(error: { error?: { message?: string } | string }, fallback: string): string {
    if (typeof error.error === 'string' && error.error) return error.error;
    if (error.error && typeof error.error === 'object') return error.error.message ?? fallback;
    return fallback;
  }
}
