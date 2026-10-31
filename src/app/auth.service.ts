import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface LoginResponse {
  token: string;
  role: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(({ token, role }) => {
        localStorage.setItem('irctc_token', token);
        localStorage.setItem('irctc_role', role);
        localStorage.setItem('irctc_user_name', this.readUserName(token, email));
      })
    );
  }

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/register`, request, { responseType: 'text' });
  }

  getAdminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/admin/users`);
  }

  createAdminUser(request: RegisterRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiUrl}/admin/users`, request);
  }

  deleteAdminUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/users/${userId}`);
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<string> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword }, { responseType: 'text' });
  }

  logout(): void {
    localStorage.removeItem('irctc_token');
    localStorage.removeItem('irctc_role');
    localStorage.removeItem('irctc_user_name');
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('irctc_token'));
  }

  getRole(): string {
    return localStorage.getItem('irctc_role') ?? 'USER';
  }

  isAdmin(): boolean {
    return this.getRole().toUpperCase().includes('ADMIN');
  }

  getDisplayName(): string {
    return localStorage.getItem('irctc_user_name') ?? 'Passenger';
  }

  private readUserName(token: string, email: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { name?: string; fullName?: string; sub?: string; email?: string };
      return payload.name ?? payload.fullName ?? payload.sub ?? payload.email ?? email;
    } catch {
      return email;
    }
  }
}
