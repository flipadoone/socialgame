import { TALKTOME_WIDGET_KEY } from '../config/env.js';

/**
 * Widget oficial do TalkToMe (canal "Widget"): o robô da sala abre a janela de conversa com o assistente.
 * O script só é carregado na primeira vez que alguém clica no robô. A chave (data-client-key) é pública
 * por natureza; nunca coloque aqui a API Key secreta (X-API-Key).
 */
const SCRIPT_ID = 'talktome-widget';
const SCRIPT_SRC = 'https://assets.talktome.com.br/widget.js';

let failed = false;
const failListeners = new Set();

export const isTalkToMeConfigured = () => !!TALKTOME_WIDGET_KEY;

function ensureLoaded() {
  if (document.getElementById(SCRIPT_ID)) return;
  // Fila de comandos feita antes de o script terminar de carregar (conforme a documentação do widget).
  window.TalkToMe = window.TalkToMe || function () {
    (window.TalkToMe.q = window.TalkToMe.q || []).push(arguments);
  };
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  script.setAttribute('data-client-key', TALKTOME_WIDGET_KEY);
  script.setAttribute('data-lang', 'pt');
  script.onerror = () => {
    failed = true;
    script.remove();
    failListeners.forEach(listener => listener());
    failListeners.clear();
  };
  document.head.appendChild(script);
}

/**
 * Abre a janela do TalkToMe. Retorna false quando o widget não está configurado.
 * onFail é chamado se o script não puder ser carregado (rede, bloqueador de anúncios...).
 */
export function openTalkToMe(onFail) {
  if (!TALKTOME_WIDGET_KEY) return false;
  if (failed) { failed = false; }          // permite tentar de novo
  if (onFail) failListeners.add(onFail);
  ensureLoaded();
  window.TalkToMe('open');
  return true;
}
