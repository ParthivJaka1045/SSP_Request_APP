import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function TopLoader() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 700);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!active) return null;

  return (
    <div className="stk-top-loader-bar" aria-hidden>
      <span />
    </div>
  );
}
