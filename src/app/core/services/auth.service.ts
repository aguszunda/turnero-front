import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import type { CrearClienteDto, Credenciales, Rol, TokenResponse, UsuarioLogueado } from '@app/core/models';

const TOKEN_KEY = 'turnero_token';
const USER_KEY = 'turnero_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private readonly _user = signal<UsuarioLogueado | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();

  constructor() {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (token) this._token.set(token);
    if (rawUser) {
      try {
        this._user.set(JSON.parse(rawUser));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  isAuthenticated(): boolean {
    return !!this._token();
  }

  rol(): Rol | null {
    return this._user()?.rol ?? null;
  }

  tieneRol(...roles: Rol[]): boolean {
    const r = this.rol();
    return r !== null && roles.includes(r);
  }

  esAdminORecepcion(): boolean {
    return this.tieneRol('ADMIN', 'RECEPCIONISTA');
  }

  clienteId(): number | null {
    return this._user()?.clienteId ?? null;
  }

  profesionalId(): number | null {
    return this._user()?.profesionalId ?? null;
  }

  login(credenciales: Credenciales): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, credenciales).pipe(
      tap((res) => this.guardarSesion(res)),
    );
  }

  register(dto: CrearClienteDto & { password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/register`, dto).pipe(
      tap((res) => this.guardarSesion(res)),
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    void this.router.navigate(['/login']);
  }

  private guardarSesion(res: TokenResponse): void {
    this._token.set(res.token);
    this._user.set(res.usuario);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
  }
}