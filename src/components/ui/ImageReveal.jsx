import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

/**
 * Progress-bar-style image reveal: masked crop animates on hover.
 */
export default function ImageReveal({
  src,
  alt = '',
  className = '',
  aspectRatio = '4 / 3',
  sizes = 'card',
  cropStyle,
}) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(false);
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 120, damping: 22 });
  const clipRight = useTransform(smooth, (v) => `${100 - v * 100}%`);
  const clipPath = useMotionTemplate`inset(0 ${clipRight} 0 0)`;

  const onMove = (e) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    progress.set(x);
  };

  const sizeClass = sizes === 'hero' ? 'image-reveal--hero' : 'image-reveal--card';

  return (
    <div
      ref={wrapRef}
      className={`image-reveal ${sizeClass} ${className}`}
      style={{ aspectRatio }}
      onMouseEnter={() => {
        setHover(true);
        progress.set(1);
      }}
      onMouseLeave={() => {
        setHover(false);
        progress.set(0);
      }}
      onMouseMove={onMove}
    >
      <img src={src} alt={alt} className="image-reveal__bg" style={cropStyle} loading="lazy" />
      <motion.div className="image-reveal__overlay" style={{ clipPath }}>
        <img src={src} alt="" aria-hidden className="image-reveal__fg" style={cropStyle} loading="lazy" />
      </motion.div>
      <div className={`image-reveal__bar ${hover ? 'is-active' : ''}`}>
        <motion.span className="image-reveal__bar-fill" style={{ scaleX: smooth }} />
      </div>
      <div className="image-reveal__corner" />
    </div>
  );
}
