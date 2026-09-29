import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Replaces window.confirm(...) with a styled modal that matches the rest of
// the admin portal instead of a native browser dialog. Usage:
//   const confirm = useConfirm();
//   if (!(await confirm('Delete this farm and all its data?'))) return;
const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null); // { message, resolve }

  const confirm = useCallback((message) => (
    new Promise((resolve) => setRequest({ message, resolve }))
  ), []);

  const respond = (ok) => {
    request?.resolve(ok);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div onClick={() => respond(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '400px', background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '16px', padding: '24px', boxShadow: '0 24px 60px rgba(15,23,42,0.25)',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={17} color="#dc2626" />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{request.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={() => respond(false)} style={{ flex: 1, padding: '11px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
              <button onClick={() => respond(true)} style={{ flex: 1, padding: '11px', background: '#dc2626', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm() must be used inside <ConfirmProvider>');
  return ctx;
};
