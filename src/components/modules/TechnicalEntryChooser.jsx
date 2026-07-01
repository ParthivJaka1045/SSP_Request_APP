import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, FilePlus } from 'lucide-react';

export default function TechnicalEntryChooser({ accent }) {
  const navigate = useNavigate();

  const options = [
    {
      id: 'replacement',
      title: 'Replacement',
      description: 'Replace a damaged or faulty item you already have.',
      icon: RefreshCw,
      path: '/technical/replacement',
    },
    {
      id: 'new',
      title: 'New Request',
      description: 'Request a new item — browse catalog or add a new one.',
      icon: FilePlus,
      path: '/technical?flow=new&view=catalog',
    },
  ];

  return (
    <div className="technical-entry-grid">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            className="technical-entry-card stk-card stk-card-hover"
            style={{ '--entry-accent': accent }}
            onClick={() => navigate(opt.path)}
          >
            <div className="technical-entry-card__icon" style={{ color: accent }}>
              <Icon size={32} />
            </div>
            <h2>{opt.title}</h2>
            <p>{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}
