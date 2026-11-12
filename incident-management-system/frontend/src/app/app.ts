import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GameBridge } from './core/services/game-bridge';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Inicia a ponte com o jogo (só age quando o app está dentro de um iframe).
  private readonly gameBridge = inject(GameBridge);

  constructor() {
    this.gameBridge.start();
  }
}
