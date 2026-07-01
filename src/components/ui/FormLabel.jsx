import React from 'react';

/**
 * Bilingual form label: English + Gujarati (stacked).
 * @param {{ en: string, gu: string } | string} label
 */
export default function FormLabel({ label, required, className = '' }) {
  if (typeof label === 'string') {
    return (
      <label className={`form-label ${className}`.trim()}>
        {label}
        {required ? <span className="form-required"> *</span> : null}
      </label>
    );
  }

  return (
    <label className={`form-label form-label-bilingual ${className}`.trim()}>
      <span className="form-label-en">
        {label.en}
        {required ? <span className="form-required"> *</span> : null}
      </span>
      <span className="form-label-gu">{label.gu}</span>
    </label>
  );
}

export function HintText({ text, variant = 'info', bilingual = false }) {
  if (!text) return null;
  const content = typeof text === 'string' ? { en: text, gu: '' } : text;
  return (
    <p className={`form-hint form-hint-${variant}`}>
      {bilingual && content.en && content.gu ? (
        <>
          <span className="form-hint-gu">{content.gu}</span>
          <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.8rem', opacity: 0.85 }}>
            {content.en}
          </span>
        </>
      ) : (
        <span className="form-hint-gu">{content.gu || content.en}</span>
      )}
    </p>
  );
}
