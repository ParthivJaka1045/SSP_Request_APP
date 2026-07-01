import React from 'react';
import { Lightbulb, Clock, MoreHorizontal } from 'lucide-react';
import { IN_PROGRESS_SUBSTATUS_OPTIONS } from '../../constants/technicalRequest';

const ICONS = {
  'Alternative Suggestion': Lightbulb,
  'Delayed Fulfillment Notice': Clock,
  Other: MoreHorizontal,
};

export default function InProgressSubStatusPicker({ value, onChange, disabled }) {
  return (
    <div className="substatus-picker">
      <p className="substatus-picker__label">In Progress — select reason</p>
      <div className="substatus-picker__options">
        {IN_PROGRESS_SUBSTATUS_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.value] || Lightbulb;
          const selected = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              className={`substatus-picker__option ${selected ? 'substatus-picker__option--selected' : ''}`}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
            >
              <span className="substatus-picker__option-icon">
                <Icon size={18} />
              </span>
              <span className="substatus-picker__option-body">
                <strong>{opt.label}</strong>
                <span>{opt.labelGu}</span>
                <p>{opt.description}</p>
              </span>
              <span className={`substatus-picker__radio ${selected ? 'substatus-picker__radio--on' : ''}`} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
