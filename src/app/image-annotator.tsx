'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Tool = 'draw' | 'text';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#2563eb', '#7c3aed', '#000000', '#ffffff'];
const BRUSH_SIZES = [2, 4, 8, 12];

interface Props {
  imageUrl: string;
  onSave: (blob: Blob) => Promise<void>;
  onCancel: () => void;
}

export default function ImageAnnotator({ imageUrl, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  // Store drawing history for undo
  const historyRef = useRef<ImageData[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Canvas dimensions
  const [dims, setDims] = useState({ width: 800, height: 600 });

  // Load image onto canvas (download as blob first to avoid CORS issues)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Download image as blob to bypass CORS
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          bgImageRef.current = img;

          const maxW = Math.min(900, window.innerWidth - 32);
          const scale = maxW / img.width;
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          setDims({ width: w, height: h });

          setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            historyRef.current = [ctx.getImageData(0, 0, w, h)];
            setLoaded(true);
          }, 50);
        };
        img.onerror = () => {
          if (!cancelled) setLoaded(true); // Show canvas anyway
        };
        img.src = blobUrl;
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [imageUrl]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // Keep max 30 states
    if (historyRef.current.length > 30) historyRef.current.shift();
  }, []);

  // Undo
  function undo() {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    historyRef.current.pop(); // Remove current
    const prev = historyRef.current[historyRef.current.length - 1];
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(prev, 0, 0);
  }

  // Get position from mouse/touch event
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Drawing
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextPos(pos);
      setTextInput('');
      return;
    }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || tool !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  }

  // Add text at position
  function addText() {
    if (!textPos || !textInput.trim()) {
      setTextPos(null);
      return;
    }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const fontSize = Math.max(16, Math.round(canvas.width / 30));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.strokeStyle = color === '#ffffff' ? '#000000' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText(textInput, textPos.x, textPos.y);
    ctx.fillText(textInput, textPos.x, textPos.y);
    saveToHistory();
    setTextPos(null);
    setTextInput('');
  }

  // Export and save
  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        await onSave(blob);
        setSaving(false);
      },
      'image/jpeg',
      0.85
    );
  }

  if (!loaded) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
        <p className="text-white">Chargement de l&apos;éditeur...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-800 px-3 py-2 border-b border-gray-700">
        {/* Tools */}
        <button
          onClick={() => setTool('draw')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tool === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          ✏️ Dessiner
        </button>
        <button
          onClick={() => setTool('text')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tool === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          Aa Texte
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Colors */}
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-7 w-7 rounded-full border-2 transition-transform ${
              color === c ? 'border-white scale-110' : 'border-gray-600'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Brush size */}
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            className={`flex items-center justify-center h-7 w-7 rounded-lg ${
              brushSize === s ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className="rounded-full bg-white"
              style={{ width: s + 2, height: s + 2 }}
            />
          </button>
        ))}

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button
          onClick={undo}
          className="rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-600"
        >
          ↩ Annuler
        </button>

        <div className="flex-1" />

        <button
          onClick={onCancel}
          className="rounded-lg bg-gray-700 px-4 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-600"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            style={{ width: dims.width, height: dims.height, touchAction: 'none' }}
            className="rounded-lg shadow-2xl cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />

          {/* Text input overlay */}
          {textPos && (
            <div
              className="absolute"
              style={{
                left: (textPos.x / canvasRef.current!.width) * dims.width,
                top: (textPos.y / canvasRef.current!.height) * dims.height,
              }}
            >
              <div className="flex gap-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Tapez votre texte..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addText();
                    if (e.key === 'Escape') setTextPos(null);
                  }}
                  className="rounded-lg bg-white/90 px-2 py-1 text-sm text-gray-900 border border-gray-400 shadow-lg w-48"
                />
                <button
                  onClick={addText}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
