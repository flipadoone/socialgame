import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { ApiResponse } from '../models/api-response';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { UserResponse } from '../models/user-response';
import { Token } from './token';

/**
 * Serviço responsável pelos casos de uso de autenticação.
 */
@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = `${APP_CONFIG.apiUrl}/api/v1/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: Token
  ) {}

  /** Autentica o usuário na API e persiste o token de acesso. */
  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request)
      .pipe(
        tap(response => {
          this.adoptSession(response.data.token, response.data.user);
        })
      );
  }

  /**
   * Passa a usar uma sessão já autenticada (ex.: enviada pelo jogo quando
   * este app está embutido em iframe).
   */
  adoptSession(token: string, user: UserResponse): void {
    this.tokenService.saveToken(token);
    this.tokenService.saveUser(user);
  }

  logout(): void {
    this.tokenService.removeSession();
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }
}
