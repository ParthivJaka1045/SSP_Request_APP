import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/scrollLock';

export default function Modal({ open, title, description, onClose, children, wide, fullPage, hideFooter }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const preventTouch = (e) => {
      if (e.target.closest('.ssp-modal')) return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    lockBodyScroll();
    document.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('touchmove', preventTouch);
      unlockBodyScroll();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ssp-modal-backdrop" role="presentation" onWheel={(e) => e.stopPropagation()}>
      <button type="button" className="ssp-modal-backdrop__hit" onClick={onClose} aria-label="Close dialog" />
      <div
        className={`ssp-modal stk-card ${wide ? 'ssp-modal--wide' : ''} ${fullPage ? 'ssp-modal--fullpage' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ssp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ssp-modal__head">
          <div className="ssp-modal__titles">
            <h3 id="ssp-modal-title">{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="ssp-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="ssp-modal__body">{children}</div>
        {!hideFooter && (
          <div className="ssp-modal__footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
