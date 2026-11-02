export default function PostItModal({ obj, onClose }) {
  const storageKey = `postit_text_${obj.id}`;
  const [text, setText] = useState(() => {
    return localStorage.getItem(storageKey) || "Escreva suas anotações ou lembretes aqui...";
  });

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    localStorage.setItem(storageKey, val);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="relative max-w-lg w-full bg-[#5c3818] p-4 rounded-xl border-4 border-[#3b220c] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 bg-[#8c2b2b] hover:bg-[#a83434] text-[#fce8b3] font-black rounded-full border-2 border-[#fce8b3] flex items-center justify-center shadow-lg transition-transform active:scale-95 z-20"
        >
          ✕
        </button>

        <div className="bg-[#e6c896] border-4 border-[#8c5a2b] p-5 rounded-lg shadow-inner flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between border-b-2 border-[#a67c4e] pb-2 mb-3">
            <span className="text-xs font-bold text-[#4a2e12] uppercase tracking-wider font-mono">
              📌 Bloco de Notas / Post-it
            </span>
            <span className="text-[10px] text-[#7a5229] italic">Salvo automaticamente</span>
          </div>

          <textarea
            value={text}
            onChange={handleChange}
            placeholder="Digite aqui..."
            className="w-full flex-1 bg-transparent border-none resize-none text-[#2d1b0a] font-serif text-sm leading-relaxed focus:outline-none placeholder-[#8c6b4a]"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}