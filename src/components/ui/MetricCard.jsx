import React from 'react';
import { TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';

const ACCENTS = {
  primary: { icon: TrendingUp, cls: 'metric-card--primary' },
  accent: { icon: Clock, cls: 'metric-card--accent' },
  success: { icon: CheckCircle2, cls: 'metric-card--success' },
  danger: { icon: XCircle, cls: 'metric-card--danger' },
};

export default function MetricCard({ label, value, accent = 'primary', onClick }) {
  const cfg = ACCENTS[accent] || ACCENTS.primary;
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      className={`metric-card stk-card ${cfg.cls} ${onClick ? 'stk-card-hover' : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="metric-card__inner">
        <div>
          <p className="metric-card__label">{label}</p>
          <p className="metric-card__value">{value}</p>
        </div>
        <div className="metric-card__icon">
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}

