import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageShell({
  title,
  titleGu,
  subtitle,
  backTo,
  actions,
  children,
  maxWidth = '1200px',
  narrow = false,
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`page-shell animate-fade-in ${narrow ? 'page-shell-narrow' : ''}`}
      style={{ maxWidth }}
    >
      <header className="page-header">
        <div className="page-header-start">
          {backTo != null && (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="btn btn-secondary page-back-btn"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="page-header-titles">
            <h1 className="page-title">
              {title}
              {titleGu ? <span className="page-title-gu">{titleGu}</span> : null}
            </h1>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
