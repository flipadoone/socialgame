import { useState } from 'react';

const DEMO_HINT = import.meta.env.DEV;

/** Tela de acesso: o jogo só abre depois do login. O papel do usuário (root ou não) vem do backend. */
export default function LoginScreen({ auth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setError('');
    if (isRegister && password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) await auth.register(name, email, password);
      else await auth.login(email, password);
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.');
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500';

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border-2 border-indigo-500/40 bg-slate-900 p-6 shadow-2xl">
        <header className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-black shadow-lg">N</div>
          <h1 className="font-mono text-xl font-black tracking-wide text-indigo-300">NEMOLANDIA</h1>
          <p className="mt-1 text-xs text-slate-400">Entre para acessar a sala</p>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-950 p-1 text-xs font-bold" role="tablist">
          <button type="button" role="tab" aria-selected={!isRegister} onClick={() => switchMode('login')} className={`rounded-md py-2 ${!isRegister ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Entrar</button>
          <button type="button" role="tab" aria-selected={isRegister} onClick={() => switchMode('register')} className={`rounded-md py-2 ${isRegister ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Criar conta</button>
        </div>

        {auth.notice && !error && (
          <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200" role="status">{auth.notice}</p>
        )}

        <form onSubmit={submit} className="space-y-3" noValidate>
          {isRegister && (
            <label className="block text-xs font-bold text-slate-300">Nome
              <input className={`${inputClass} mt-1 font-normal`} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={120} required />
            </label>
          )}
          <label className="block text-xs font-bold text-slate-300">E-mail
            <input type="email" className={`${inputClass} mt-1 font-normal`} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="nome@empresa.com" required autoFocus />
          </label>
          <label className="block text-xs font-bold text-slate-300">Senha
            <span className="relative mt-1 block">
              <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pr-16 font-normal`} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} required />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-2 px-2 text-[11px] font-bold text-slate-400 hover:text-white">{showPassword ? 'ocultar' : 'mostrar'}</button>
            </span>
          </label>

          <div aria-live="polite" className="min-h-[1.25rem]">
            {error && <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</p>}
          </div>

          <button disabled={loading || !email || !password || (isRegister && !name)} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">
            {loading ? 'Aguarde...' : isRegister ? 'Criar conta e entrar' : 'Entrar'}
          </button>
        </form>

        {DEMO_HINT && (
          <p className="mt-4 border-t border-slate-800 pt-3 text-[10px] leading-relaxed text-slate-500">
            Ambiente de desenvolvimento · contas de demonstração (veja o README do Incident Manager):
            admin (root) e leitor (jogador). Contas novas são criadas como jogador comum.
          </p>
        )}
      </div>
    </main>
  );
}
