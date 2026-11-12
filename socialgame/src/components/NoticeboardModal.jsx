import { useRef } from 'react';
import { INCIDENT_URL } from '../config/env';
import { useIncidentBridge } from '../hooks/useIncidentBridge';
import EmbeddedAppModal from './EmbeddedAppModal';

/** Incident Manager (Angular) dentro do jogo, já autenticado com a sessão do jogador. */
export default function NoticeboardModal({ auth, onClose }) {
  const iframeRef = useRef(null);
  const sendAuth = useIncidentBridge({ iframeRef, auth });
  return (
    <EmbeddedAppModal
      title="Incident Management System"
      url={INCIDENT_URL}
      iframeRef={iframeRef}
      onLoad={sendAuth}
      onClose={onClose}
      hint={`Tela em branco ou sem resposta? Confirme que o Incident Manager está rodando em ${INCIDENT_URL} (docker compose up --build, ou ng serve).`}
    />
  );
}
