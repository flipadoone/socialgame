import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import './index.css';

/** Porteiro: o jogo só abre com sessão válida; o papel do usuário (root ou não) vem do JWT. */
function Root() {
  const auth = useAuth();

  if (auth.status === 'checking') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 font-mono text-sm text-slate-400" role="status">
        Verificando sua sessão…
      </div>
    );
  }
  if (auth.status !== 'authenticated') return <LoginScreen auth={auth} />;
  // key: ao trocar de usuário, todo o estado do jogo é recriado do zero.
  return <App key={auth.user?.id ?? auth.token} auth={auth} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>,
);
