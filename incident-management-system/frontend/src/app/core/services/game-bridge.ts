import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { APP_CONFIG } from '../config/app-config';
import { UserResponse } from '../models/user-response';
import { Auth } from './auth';
import { Token } from './token';

interface GameAuthMessage {
  type: 'HABBO_AUTH';
  token: string;
  user: UserResponse;
}

/**
 * Ponte entre o Incident Manager e o jogo quando este app roda dentro de um iframe.
 *
 * Protocolo:
 *   Angular -> jogo : { type: 'INCIDENT_READY' }   (ao iniciar)
 *   jogo -> Angular : { type: 'HABBO_AUTH', token, user }   (sessão do jogador)
 *   jogo -> Angular : { type: 'HABBO_LOGOUT' }
 *   Angular -> jogo : { type: 'INCIDENT_LOGOUT' }  (usuário clicou em "Sair" aqui dentro)
 *
 * Segurança: só aceita mensagens vindas de window.parent e de uma origem em
 * APP_CONFIG.gameOrigins; só envia para origens dessa lista (nunca '*').
 */
@Injectable({
  providedIn: 'root'
})
export class GameBridge {
  readonly embedded = window.parent !== window;
  private started = false;

  constructor(
    private readonly auth: Auth,
    private readonly tokenService: Token,
    private readonly router: Router
  ) {}

  start(): void {
    if (!this.embedded || this.started) {
      return;
    }
    this.started = true;

    window.addEventListener('message', event => this.onMessage(event));

    // Avisa o jogo que estamos prontos para receber a sessão. Só a origem
    // correta recebe a mensagem; as demais a descartam silenciosamente.
    this.postToGame({ type: 'INCIDENT_READY' });
  }

  /** Informa o jogo que o usuário saiu pelo botão "Sair" deste app. */
  notifyLogout(): void {
    this.postToGame({ type: 'INCIDENT_LOGOUT' });
  }

  private postToGame(message: object): void {
    for (const origin of APP_CONFIG.gameOrigins) {
      window.parent.postMessage(message, origin);
    }
  }

  private onMessage(event: MessageEvent): void {
    if (event.source !== window.parent) {
      return;
    }
    if (!(APP_CONFIG.gameOrigins as readonly string[]).includes(event.origin)) {
      return;
    }

    const data = event.data as Partial<GameAuthMessage> & { type?: string };

    if (data?.type === 'HABBO_AUTH') {
      this.handleAuth(data);
      return;
    }

    if (data?.type === 'HABBO_LOGOUT') {
      this.auth.logout();
      void this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private handleAuth(data: Partial<GameAuthMessage>): void {
    if (typeof data.token !== 'string' || !data.token || !data.user) {
      return;
    }

    const expiry = this.tokenService.getTokenExpiry(data.token);
    if (expiry && expiry.getTime() <= Date.now()) {
      return;
    }

    this.auth.adoptSession(data.token, data.user);

    // Se estávamos na tela de login (ou em qualquer rota), vai para o painel.
    if (!this.router.url.startsWith('/dashboard')) {
      void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    }
  }
}
