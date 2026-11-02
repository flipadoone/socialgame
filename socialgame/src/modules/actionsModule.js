import { isAuthenticated } from '../services/authService';

/**
 * Gerenciador Central de Ações dos Objetos da Sala
 */
export const handleObjectInteraction = (objectId, context) => {
  const { setModal, setIsRoot } = context;

  // Dicionário de Ações Mapeadas
  const actions = {
    // 1. Incident Management System (Abre a aplicação Angular no iframe)
    'noticeboard': () => {
      setModal({
        type: 'IFRAME',
        title: 'Incident Management System (Angular)',
        src: 'http://192.168.56.1:4200'
      });
    },

    // 2. Estúdio de Beats / DAW
    'beat_machine': () => {
      setModal({
        type: 'BEAT_STUDIO',
        title: 'Estúdio de Beats'
      });
    },

    // 3. Painel de Recompensas (Requer validação de Token/ROOT)
    'reward_box': () => {
      if (!isAuthenticated()) {
        alert("🔒 Acesso Restrito: Autentique-se no Incident Manager para obter o token ROOT.");
        return;
      }
      setModal({
        type: 'REWARDS',
        title: 'Painel de Recompensas & Modificadores'
      });
    }
  };

  // Executa a ação se o objeto clicado estiver registado
  const key = Object.keys(actions).find(k => objectId.includes(k));
  if (key) {
    actions[key]();
  } else {
    console.log(`[Interaction] Nenhum evento atribuído ao objeto: ${objectId}`);
  }
};