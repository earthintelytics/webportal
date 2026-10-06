/**
 * Building blocks for pages inside the portal layout (service page kinds),
 * matching the Register / Check / Log pages: white cards, gray borders,
 * sentence case, status colours from tokens, no glows.
 */

export const PageHeader = ({ title, text, actions }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <h2 className="font-display text-3xl font-semibold text-gray-900 tracking-tight">{title}</h2>
      {text && <p className="text-sm text-gray-500 mt-2 max-w-2xl">{text}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>
);

/** Shown when the backend endpoint for a page does not exist yet. */
export const NotConnectedNote = ({ what }) => (
  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900">
    {what} is not connected yet. Nothing is shown until it is: no sample data.
  </div>
);

export const ErrorNote = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 flex items-center justify-between gap-4">
    <span>{message}</span>
    {onRetry && <button onClick={onRetry} className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-sm font-medium">Try again</button>}
  </div>
);

export const EmptyState = ({ title, text, action }) => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <p className="font-semibold text-gray-900">{title}</p>
    {text && <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const PILL = {
  good: 'bg-green-50 text-[var(--brand-primary-dark)] border-green-200',
  warning: 'bg-amber-50 text-[var(--status-warning)] border-amber-200',
  critical: 'bg-red-50 text-[var(--status-critical)] border-red-200',
  info: 'bg-sky-50 text-[var(--status-info)] border-sky-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};
export const StatusPill = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${PILL[tone] || PILL.neutral}`}>{children}</span>
);

export const PrimaryButton = ({ children, className = '', ...props }) => (
  <button {...props} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>{children}</button>
);

export const SecondaryButton = ({ children, className = '', ...props }) => (
  <button {...props} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>{children}</button>
);

export const Field = ({ label, hint, error, children }) => (
  <label className="block">
    <span className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</span>
    {children}
    {error ? <span className="block text-xs text-red-700 mt-1">{error}</span> : hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
  </label>
);

export const Modal = ({ title, children, onClose, footer, wide = false }) => (
  <div className="fixed inset-0 z-[1000] bg-gray-900/30 flex items-center justify-center p-4" onClick={onClose}>
    <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-xl p-7 space-y-5`} onClick={(e) => e.stopPropagation()}>
      <h3 className="font-display text-xl font-semibold text-gray-900">{title}</h3>
      {children}
      {footer && <div className="flex justify-end gap-3 pt-2">{footer}</div>}
    </div>
  </div>
);
