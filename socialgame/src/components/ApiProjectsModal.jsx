import { useEffect, useRef, useState } from 'react';

const RESUME_DATA = {
  whoami: [
    'Filipe Lopes (Nemo) — Planaltina, DF',
    'Estudante Técnico em Segurança da Informação @ Faculdade de Tecnologia Senac DF',
    'Foco: Governança de Segurança da Informação, Compliance (LGPD, GDPR, Marco Civil) e Desenvolvimento Full-Stack.',
  ],
  skills: [
    '[SEGURANÇA & GOVERNANÇA]',
    '  • Análise de Riscos, Gestão de Incidentes, Hardening Linux',
    '  • Marcos Regulatórios: LGPD, GDPR, Marco Civil da Internet',
    '',
    '[SISTEMAS & REDES]',
    '  • Linux CLI (systemctl, chmod, ps, top/htop, free, df/du, vim)',
    '  • Redes: Modelagem de Topologias, VLANs e Trunks (Cisco Packet Tracer)',
    '  • Infraestrutura: Docker, Docker Compose, Deploy Cloud (Render/Vercel)',
    '',
    '[DESENVOLVIMENTO & DADOS]',
    '  • Linguagens: Python (POO), Java (Spring Boot), JavaScript/TypeScript, SQL',
    '  • Frontend/Mobile: React, React Native, Tailwind CSS',
    '  • Bancos de Dados: PostgreSQL (Supabase), SQL Server',
  ],
  projects: [
    '1. Nemolandia & Incident Manager',
    '   Plataforma social isométrica multiplayer em tempo real (React, Node.js WebSockets, Spring Boot, PostgreSQL) com controle de acesso RBAC e gestão de incidentes.',
    '',
    '2. Bora (Mobilidade DF)',
    '   Protótipo de aplicativo mobile em React Native focado em deslocamentos comunitários seguros no Distrito Federal.',
  ],
  education: [
    '• Curso Técnico em Segurança da Informação — Faculdade de Tecnologia Senac DF (Em andamento)',
  ],
  contact: [
    '• GitHub:   https://github.com/flipadoone',
    '• Portfólio: https://socialgame-flax.vercel.app',
    '• Local:    Planaltina, Distrito Federal — Brasil',
  ],
};

const COMMAND_KEYS = ['whoami', 'skills', 'projects', 'education', 'contact', 'apis'];

export default function ApiProjectsModal({ title, projects = [], onClose }) {
  const [history, setHistory] = useState([
    { type: 'system', text: 'Nemolandia OS v2.6 (tty1) — Sessão de Currículo TI iniciada.' },
    { type: 'system', text: 'Digite "help" ou clique nos comandos abaixo para navegar.' },
    { type: 'cmd', text: 'whoami' },
    ...RESUME_DATA.whoami.map((text) => ({ type: 'out', text })),
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState(['whoami']);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function runCommand(rawCmd) {
    const clean = rawCmd.trim().toLowerCase();
    if (!clean) return;

    setCmdHistory((prev) => [clean, ...prev]);
    setHistoryIdx(-1);

    if (clean === 'clear') {
      setHistory([]);
      return;
    }

    if (clean === 'exit' || clean === 'quit') {
      onClose();
      return;
    }

    const nextEntries = [{ type: 'cmd', text: rawCmd.trim() }];

    if (clean === 'help') {
      nextEntries.push({
        type: 'out',
        text: 'Comandos disponíveis: whoami, skills, projects, education, contact, apis, clear, exit',
      });
    } else if (clean === 'apis') {
      if (!projects.length) {
        nextEntries.push({ type: 'out', text: 'Nenhum endpoint ativo vinculado a esta estação.' });
      } else {
        projects.forEach((api) => {
          nextEntries.push({ type: 'out', text: `• ${api.title}: ${api.endpoint} — ${api.desc}` });
        });
      }
    } else if (RESUME_DATA[clean]) {
      RESUME_DATA[clean].forEach((line) => nextEntries.push({ type: 'out', text: line }));
    } else {
      nextEntries.push({
        type: 'err',
        text: `bash: ${clean}: comando não encontrado. Digite "help" para ver as opções.`,
      });
    }

    setHistory((prev) => [...prev, ...nextEntries]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    runCommand(input);
    setInput('');
  }

  function handleKeyDown(e) {
    e.stopPropagation(); // Impede movimentação do avatar na sala enquanto digita
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx + 1 < cmdHistory.length) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        className="flex h-[80vh] max-h-[620px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-slate-950 font-mono shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Terminal Currículo TI'}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Barra superior estilo janela Linux */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <b className="ml-2 text-xs text-emerald-400">filipe@nemolandia: ~/curriculo-ti</b>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar terminal"
            className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </header>

        {/* Barra de comandos rápidos clicáveis */}
        <nav className="flex flex-wrap gap-1.5 border-b border-slate-800/80 bg-slate-900/60 px-4 py-2">
          {COMMAND_KEYS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => runCommand(cmd)}
              className="rounded border border-emerald-500/30 bg-slate-950 px-2.5 py-1 text-[11px] text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-950/50"
            >
              $ {cmd}
            </button>
          ))}
          <button
            type="button"
            onClick={() => runCommand('clear')}
            className="ml-auto rounded border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
          >
            clear
          </button>
        </nav>

        {/* Área de saída do terminal */}
        <div className="flex-1 space-y-1 overflow-y-auto p-4 text-xs leading-relaxed">
          {history.map((item, idx) => {
            if (item.type === 'cmd') {
              return (
                <div key={idx} className="pt-2 text-slate-100">
                  <span className="text-emerald-400">filipe@nemolandia</span>
                  <span className="text-slate-400">:</span>
                  <span className="text-purple-400">~</span>
                  <span className="text-slate-400">$ </span>
                  <span>{item.text}</span>
                </div>
              );
            }
            if (item.type === 'err') {
              return (
                <p key={idx} className="text-red-400">
                  {item.text}
                </p>
              );
            }
            if (item.type === 'system') {
              return (
                <p key={idx} className="text-purple-300/90">
                  {item.text}
                </p>
              );
            }
            return (
              <p key={idx} className="whitespace-pre-wrap text-slate-300">
                {item.text || '\u00A0'}
              </p>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Linha de comando ativa */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center border-t border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs"
        >
          <span className="text-emerald-400">filipe@nemolandia</span>
          <span className="text-slate-400">:</span>
          <span className="text-purple-400">~</span>
          <span className="mr-2 text-slate-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando (ex: skills, projects, help)..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </section>
    </div>
  );
}