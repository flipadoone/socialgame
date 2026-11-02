import React, { useState, useEffect, useRef } from 'react';
/* =========================================================
   MODAL DO GRAFFITI (SEM MINIMIZAR)
   ========================================================= */
export default function GraffitiModal({ onClose, onSaveGraffiti, currentGraffiti, roomRows, triggerAchievement }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(16);
  const isDrawing = useRef(false);

  const wallWidth = roomRows * (TILE_WIDTH / 2);
  const wallHeightSlope = roomRows * (TILE_HEIGHT / 2) + 120;
  
  const canvasWidth = 600;
  const canvasHeight = Math.round((wallHeightSlope / wallWidth) * canvasWidth);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (currentGraffiti) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      };
      img.src = currentGraffiti;
    } else {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }, [currentGraffiti, canvasWidth, canvasHeight]);

  const startDrawing = (e) => {
    isDrawing.current = true;
    drawSpray(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const drawSpray = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.fillStyle = color;
    const density = Math.floor(brushSize * 3);

    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() - 0.5) * brushSize;
      const offsetY = (Math.random() - 0.5) * brushSize;
      const particleRadius = Math.random() * 1.5 + 0.5;

      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, particleRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    triggerAchievement('first_spray');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveGraffiti(canvas.toDataURL());
    }
    onClose();
  };

  const colorsList = [
    { name: 'Vermelho Hipersaturado', code: '#FF0000' },
    { name: 'Preto', code: '#000000' },
    { name: 'Branco', code: '#FFFFFF' },
    { name: 'Verde Neon', code: '#00FF66' },
    { name: 'Ciano Cyber', code: '#00E5FF' },
    { name: 'Amarelo Graffiti', code: '#FFEB3B' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-5 max-w-2xl w-full shadow-2xl flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h2 className="text-sm font-bold text-red-500 font-mono">🎨 Spray Can Studio (Efeito Duster/Tinta)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold px-2">✕</button>
        </div>

        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 mb-4 flex items-center justify-center w-full">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={drawSpray}
            className="cursor-crosshair bg-slate-900/80 rounded-lg touch-none max-h-[50vh] object-contain"
          />
        </div>

        <div className="w-full flex items-center justify-between gap-4 bg-slate-800/90 p-3 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">Dispersão:</span>
            <input
              type="range"
              min="8"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="accent-red-600 w-24 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 w-6">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {colorsList.map((item) => (
              <button
                key={item.code}
                onClick={() => setColor(item.code)}
                title={item.name}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === item.code ? 'scale-110 border-indigo-400 ring-2 ring-red-500' : 'border-slate-600 opacity-80'
                }`}
                style={{ backgroundColor: item.code }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={clearCanvas} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold">
              Limpar
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg">
              💾 Grafitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}