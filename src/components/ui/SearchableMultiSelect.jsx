import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export default function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Search...',
  emptyLabel = 'No matching options.',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, search]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.value)),
    [options, selected],
  );

  const toggleValue = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  if (!options.length) return null;

  return (
    <div className="multi-select-panel">
      <div className="multi-select-panel__head">
        <span className="multi-select-panel__label">{label}</span>
        {selected.length > 0 && (
          <button type="button" className="multi-select-panel__clear" onClick={() => onChange([])}>
            Clear all
          </button>
        )}
      </div>

      <button type="button" className="multi-select-trigger form-control" onClick={() => setOpen(!open)}>
        <span>{selectedOptions.length ? `${selectedOptions.length} selected` : `Select ${label.toLowerCase()}`}</span>
        <ChevronDown size={16} className={open ? 'rotate-180' : ''} />
      </button>

      {selectedOptions.length > 0 ? (
        <div className="multi-select-chips">
          {selectedOptions.map((opt) => (
            <button key={opt.value} type="button" className="multi-select-chip" onClick={() => toggleValue(opt.value)}>
              {opt.label}
              <X size={12} />
            </button>
          ))}
        </div>
      ) : (
        <p className="multi-select-empty">No {label.toLowerCase()} selected.</p>
      )}

      {open && (
        <div className="multi-select-dropdown stk-card">
          <div className="catalog-search" style={{ marginBottom: '0.5rem' }}>
            <Search size={16} />
            <input
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
            />
          </div>
          <div className="multi-select-options">
            {filteredOptions.length === 0 ? (
              <p className="multi-select-empty">{emptyLabel}</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`multi-select-option ${selected.includes(opt.value) ? 'is-selected' : ''}`}
                  onClick={() => toggleValue(opt.value)}
                >
                  <span>{opt.label}</span>
                  {selected.includes(opt.value) && <Check size={14} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
