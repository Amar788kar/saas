import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { AuthResponse, LoginDTO, RegisterDTO, APIResponse } from '../models/auth.model';
import { User, RoleCode } from '../models/user.model';
import { Company } from '../models/company.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = '/api/v1/auth';
  private readonly ACCESS_TOKEN_KEY = 'crm_btp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'crm_btp_refresh_token';
  private readonly USER_KEY = 'crm_btp_user';
  private readonly COMPANY_KEY = 'crm_btp_company';

  // State via Angular Signals
  currentUser = signal<User | null>(this.getStoredUser());
  currentCompany = signal<Company | null>(this.getStoredCompany());
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed<RoleCode | null>(() => this.currentUser()?.role_code || null);
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isManager = computed(() => this.userRole() === 'MANAGER' || this.isAdmin());

  login(credentials: LoginDTO): Observable<AuthResponse> {
    return this.http.post<APIResponse<AuthResponse>>(`${this.API_URL}/login`, credentials).pipe(
      map(res => res.data),
      tap(data => this.handleAuthSuccess(data))
    );
  }

  register(payload: RegisterDTO): Observable<AuthResponse> {
    return this.http.post<APIResponse<AuthResponse>>(`${this.API_URL}/register`, payload).pipe(
      map(res => res.data),
      tap(data => this.handleAuthSuccess(data))
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refresh = this.getRefreshToken();
    if (!refresh) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<APIResponse<AuthResponse>>(`${this.API_URL}/refresh`, { refresh_token: refresh }).pipe(
      map(res => res.data),
      tap(data => this.handleAuthSuccess(data)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.http.post(`${this.API_URL}/logout`, { refresh_token: refresh }).subscribe({
        next: () => {},
        error: () => {},
      });
    }

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.COMPANY_KEY);

    this.currentUser.set(null);
    this.currentCompany.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  updateCurrentUser(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  updateCurrentCompany(company: Company): void {
    this.currentCompany.set(company);
    localStorage.setItem(this.COMPANY_KEY, JSON.stringify(company));
  }

  private handleAuthSuccess(data: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, data.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(this.COMPANY_KEY, JSON.stringify(data.company));

    this.currentUser.set(data.user);
    this.currentCompany.set(data.company);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private getStoredCompany(): Company | null {
    const raw = localStorage.getItem(this.COMPANY_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
