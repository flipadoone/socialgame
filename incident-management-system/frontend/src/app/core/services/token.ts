import { Injectable } from '@angular/core';
import { UserResponse } from '../models/user-response';

/**
 * Serviço responsável por armazenar e recuperar os dados
 * da sessão autenticada no navegador.
 */
@Injectable({
  providedIn: 'root'
})
export class Token {
  private readonly tokenKey = 'viaappia_access_token';
  private readonly userKey = 'viaappia_authenticated_user';

  /** Salva o JWT recebido após o login. */
  saveToken(token: string): void {
    if (token && token !== 'undefined' && token !== 'null') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  /** Alias mantido por compatibilidade. */
  set(token: string): void {
    this.saveToken(token);
  }

  /** Recupera o token salvo (mesmo que expirado). */
  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token;
  }

  /** Alias mantido por compatibilidade. */
  get(): string | null {
    return this.getToken();
  }

  /** Salva os dados públicos do usuário autenticado. */
  saveUser(user: UserResponse): void {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  /** Recupera o usuário autenticado. */
  getUser(): UserResponse | null {
    const storedUser = localStorage.getItem(this.userKey);

    if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
      return null;
    }

    try {
      return JSON.parse(storedUser) as UserResponse;
    } catch {
      this.removeSession();
      return null;
    }
  }

  /** Data de expiração do JWT (claim `exp`), ou null se não for possível ler. */
  getTokenExpiry(token: string | null = this.getToken()): Date | null {
    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1] ?? '';
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64)) as { exp?: number };
      return typeof json.exp === 'number' ? new Date(json.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  /** Informa se existe um token e se ele ainda não expirou. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expiry = this.getTokenExpiry(token);
    if (expiry && expiry.getTime() <= Date.now()) {
      this.removeSession();
      return false;
    }

    return true;
  }

  /** Informa se o usuário autenticado possui o perfil de administrador. */
  isAdmin(): boolean {
    return this.getUser()?.roles?.includes('ROLE_ADMIN') ?? false;
  }

  /** Remove todos os dados da sessão atual. */
  removeSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
