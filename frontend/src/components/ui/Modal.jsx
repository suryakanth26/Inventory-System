import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const EXIT_MS = 180;

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '560px' }) => {
  const [visible, setVisible] = useState(isOpen);
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setVisible(true);
      setLeaving(false);
      return;
    }

    if (!visible) return undefined;

    setLeaving(true);
    exitTimer.current = setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, EXIT_MS);

    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [isOpen, visible]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible && !leaving) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, leaving, onClose]);

  if (!visible) return null;

  return (
    <div className={`modal-backdrop ${leaving ? 'is-leaving' : ''}`} onClick={onClose}>
      <div
        className="modal-surface"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="neu-button neu-button-icon"
            style={{ width: '32px', height: '32px', padding: 0 }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
};
