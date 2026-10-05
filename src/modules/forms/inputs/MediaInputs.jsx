import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

const MAX_BYTES = 10 * 1024 * 1024;

/** Photos from the phone camera or gallery; value is an array of File. */
export const PhotoInput = ({ value, onChange, max = 1 }) => {
  const files = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [error, setError] = useState('');
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = '';
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) { setError('Each photo must be under 10 MB.'); return; }
    if (picked.some((f) => !f.type.startsWith('image/'))) { setError('Only photos can be added here.'); return; }
    setError('');
    onChange([...files, ...picked].slice(0, max));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button type="button" aria-label="Remove photo" onClick={() => onChange(files.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center"><X size={12} /></button>
          </div>
        ))}
        {files.length < max && (
          <label className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-xs text-gray-600 cursor-pointer bg-white">
            <Camera size={18} />Add
            <input type="file" accept="image/*" capture="environment" multiple={max > 1} onChange={add} className="hidden" />
          </label>
        )}
      </div>
      {max > 1 && <p className="text-xs text-gray-500">Up to {max} photos.</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};

/** Finger signature; value is a PNG data URL. */
export const SignatureInput = ({ value, onChange }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return [t.clientX - r.left, t.clientY - r.top];
  };
  const start = (e) => { drawing.current = true; const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(...pos(e)); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ref.current.getContext('2d');
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
    ctx.lineTo(...pos(e)); ctx.stroke();
  };
  const end = () => { if (drawing.current) { drawing.current = false; onChange(ref.current.toDataURL('image/png')); } };
  const clear = () => { ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height); onChange(null); };
  return (
    <div className="space-y-2">
      <canvas
        ref={ref} width={320} height={140}
        className="w-full max-w-[320px] h-[140px] rounded-xl border border-gray-300 bg-white touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button type="button" onClick={clear} className="text-xs text-gray-600 underline">{value ? 'Clear and sign again' : 'Clear'}</button>
    </div>
  );
};
