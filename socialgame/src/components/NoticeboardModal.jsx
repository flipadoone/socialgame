import { useEffect } from 'react';

const ANGULAR_URL = import.meta.env.VITE_ANGULAR_URL || 'http://localhost:4200';

export default function NoticeboardModal({ onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (event) => {
    // Fecha somente quando o clique acontece no fundo, fora do painel.
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <section
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-manager-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
          <strong id="incident-manager-title" className="font-mono text-xs text-indigo-300">
            Incident Management System
          </strong>
          <button onClick={onClose} aria-label="Minimizar Incident Manager" className="rounded px-2 text-slate-300 hover:bg-slate-700 hover:text-white">
            ✕
          </button>
        </header>
        <iframe
          src={ANGULAR_URL}
          title="Gestão de Incidentes"
          className="w-full flex-1 border-0 bg-white"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"
        />
      </section>
    </div>
  );
}
