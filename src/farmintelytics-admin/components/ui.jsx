/**
 * Admin console building blocks, taken from the Scheduler and AI settings
 * pages so every admin page looks and behaves the same: white cards on gray,
 * Sora headings, sentence case, status colours from tokens, no inline styles,
 * no glows.
 */
import { X } from 'lucide-react';

export const Page = ({ eyebrow, title, text, actions, children, wide = false }) => (
  <div className="h-full overflow-y-auto bg-gray-50">
    <div className={`${wide ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-6 py-10 space-y-8`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-sm font-medium text-green-700">{eyebrow}</p>}
          <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">{title}</h1>
          {text && <p className="text-sm text-gray-500 mt-2 max-w-2xl">{text}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  </div>
);

export const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>;

export const CardHeader = ({ title, text, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
    <div>
      <h2 className="font-display text-lg font-semibold text-gray-900">{title}</h2>
      {text && <p className="text-sm text-gray-500 mt-0.5">{text}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const styles = {
    primary: 'text-white bg-green-700 hover:bg-green-800',
    secondary: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
    danger: 'text-red-700 bg-white border border-red-200 hover:bg-red-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button type="button" {...props} className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>{children}</button>
  );
};

export const IconButton = ({ label, danger = false, children, ...props }) => (
  <button type="button" aria-label={label} title={label} {...props} className={`p-2 rounded-lg text-gray-500 ${danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:bg-gray-100'} disabled:opacity-40`}>{children}</button>
);

export const Field = ({ label, hint, error, children, className = '' }) => (
  <label className={`block space-y-1.5 ${className}`}>
    <span className="block text-sm font-semibold text-gray-800">{label}</span>
    {children}
    {error ? <span className="block text-xs text-red-700">{error}</span> : hint ? <span className="block text-xs text-gray-500">{hint}</span> : null}
  </label>
);

export const Toggle = ({ on, onChange, label, disabled = false }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? 'bg-green-600' : 'bg-gray-300'}`}>
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-1'}`} />
  </button>
);

const PILL = {
  good: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};
export const Pill = ({ tone = 'neutral', children }) => <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${PILL[tone] || PILL.neutral}`}>{children}</span>;

export const Chip = ({ on, children, ...rest }) => (
  <button type="button" {...rest} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>{children}</button>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <nav className="flex gap-8 border-b border-gray-200 overflow-x-auto">
    {tabs.map((t) => (
      <button key={t.id} type="button" onClick={() => onChange(t.id)}
        className={`-mb-px pb-3 border-b-2 text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 ${value === t.id ? 'border-green-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
        {t.icon}{t.label}{t.count != null && <span className={`px-2 py-0.5 rounded-full text-xs ${value === t.id ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>}
      </button>
    ))}
  </nav>
);

/** Table with the admin look. columns: [{ key, label, className }]; rows rendered by the caller. */
export const Table = ({ columns, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
        <tr>{columns.map((c) => <th key={c.key || c.label} className={`px-5 py-3 ${c.className || ''}`}>{c.label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    </table>
  </div>
);
export const Td = ({ className = '', children, ...props }) => <td {...props} className={`px-5 py-4 align-middle ${className}`}>{children}</td>;

export const Empty = ({ children }) => <div className="text-center py-14 bg-white border border-dashed border-gray-300 rounded-2xl text-sm text-gray-600 px-6">{children}</div>;
export const Loading = ({ children = 'Loading…' }) => <div className="text-center py-16 text-sm text-gray-500">{children}</div>;
export const Note = ({ tone = 'info', children }) => (
  <div className={`rounded-xl border px-4 py-3 text-sm ${tone === 'info' ? 'bg-sky-50 border-sky-200 text-sky-900' : tone === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-green-50 border-green-200 text-green-900'}`}>{children}</div>
);

export const Modal = ({ title, text, onClose, footer, children, size = 'md' }) => (
  <div className="fixed inset-0 z-[1000] bg-gray-900/30 flex items-center justify-center p-4" onClick={onClose}>
    <div className={`w-full ${size === 'lg' ? 'max-w-3xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-xl`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 px-7 pt-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-gray-900">{title}</h3>
          {text && <p className="text-sm text-gray-500 mt-1">{text}</p>}
        </div>
        <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
      </div>
      <div className="px-7 py-5 space-y-5">{children}</div>
      {footer && <div className="flex justify-end gap-3 px-7 pb-6">{footer}</div>}
    </div>
  </div>
);

export const Stat = ({ label, value, sub }) => (
  <Card className="p-5">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-mono text-2xl text-gray-900 mt-2">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </Card>
);
