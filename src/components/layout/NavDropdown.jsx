import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function NavDropdown({ item, isActive }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const children = item.children || [];
  const childActive = children.some(
    (c) => location.pathname === c.href || location.pathname.startsWith(`${c.href}/`),
  );

  return (
    <div
      className="nav-dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`app-nav-link nav-dropdown__trigger ${childActive ? 'nav-link-active' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <item.icon size={16} />
        {item.label}
        <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="nav-dropdown__menu stk-card">
          {children.map((child) => {
            const ChildIcon = child.icon;
            const active = location.pathname === child.href || location.pathname.startsWith(`${child.href}/`);
            return (
              <Link
                key={child.href}
                to={child.href}
                className={`nav-dropdown__link ${active ? 'nav-dropdown__link--active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <ChildIcon size={16} />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
