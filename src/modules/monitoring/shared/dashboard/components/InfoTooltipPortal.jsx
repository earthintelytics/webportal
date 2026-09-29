import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Info } from 'lucide-react';

/* ─── Portal-based Info Tooltip ─────────────────────────────────────────── */
export const InfoTooltipPortal = ({ title, desc, done, formula }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0 });
  const iconRef               = useRef(null);

  const show = () => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    // Position above the icon, right-aligned to it
    setPos({
      top:  rect.top  + window.scrollY - 8,   // 8px gap above icon
      left: rect.right + window.scrollX,       // right edge of icon
    });
    setVisible(true);
  };
  const hide = () => setVisible(false);

  const tooltipContent = desc
    ? (
      <>
        <div style={{ fontWeight: 800, color: '#e5e7eb', marginBottom: 4, fontSize: 11 }}>{title}</div>
        <p style={{ color: '#d1d5db', marginBottom: desc && (done || formula) ? 6 : 0 }}>{desc}</p>
        {done && (
          <div style={{ marginBottom: formula ? 6 : 0 }}>
            <span style={{ fontWeight: 900, fontSize: 11, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Methodology:</span>
            <span style={{ color: '#d1d5db' }}>{done}</span>
          </div>
        )}
        {formula && (
          <div>
            <span style={{ fontWeight: 900, fontSize: 11, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Formula:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#86efac', fontSize: 9.5, fontWeight: 700, display: 'block', marginTop: 4, background: 'rgba(20,83,45,0.6)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(22,101,52,0.3)', wordBreak: 'break-all', whiteSpace: 'normal' }}>{formula}</span>
          </div>
        )}
      </>
    )
    : <span style={{ color: '#d1d5db' }}>{`Info about ${title}.`}</span>;

  return (
    <div
      ref={iconRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-block', marginLeft: 6, verticalAlign: 'middle', cursor: 'pointer', position: 'relative' }}
    >
      <Info size={12} style={{ color: '#9ca3af', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
      />
      {visible && ReactDOM.createPortal(
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-100%, -100%)',
            width: 224,
            padding: '10px 12px',
            background: 'rgba(5,46,22,0.97)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 11,
            borderRadius: 12,
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(52,211,153,0.15)',
            zIndex: 2147483647,
            lineHeight: 1.55,
            textAlign: 'left',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            textTransform: 'none',
            letterSpacing: 'normal',
            border: '1px solid rgba(52,211,153,0.2)',
            pointerEvents: 'auto',
          }}
        >
          {tooltipContent}
          {/* Arrow pointing down-right toward the icon */}
          <div style={{
            position: 'absolute',
            bottom: -7,
            right: 8,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '7px solid rgba(5,46,22,0.97)',
          }} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default InfoTooltipPortal;
