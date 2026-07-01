import React from 'react';

export default function FilterChipGroup({ options, value, onChange, allLabel = 'All' }) {
  return (
    <div className="filter-chip-group" role="tablist">
      <button
        type="button"
        role="tab"
        className={`filter-chip ${!value ? 'filter-chip--active' : ''}`}
        onClick={() => onChange('')}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt.id || opt.value}
          type="button"
          role="tab"
          className={`filter-chip ${value === (opt.id || opt.value) ? 'filter-chip--active' : ''}`}
          onClick={() => onChange(opt.id || opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
