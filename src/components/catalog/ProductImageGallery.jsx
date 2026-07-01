import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getItemImageCropStyle } from '../../lib/itemImageCrop';
import { getItemImageEntries } from '../../lib/itemMedia';

function normalizeEntry(entry) {
  if (typeof entry === 'string') return { url: entry, crop: null };
  return { url: entry?.url || '', crop: entry?.crop || null };
}

export default function ProductImageGallery({ item, images: imagesProp, alt = '', autoPlayMs = 4500 }) {
  const entries = (imagesProp || (item ? getItemImageEntries(item) : []))
    .map(normalizeEntry)
    .filter((e) => e.url);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = entries.length ? entries : [];
  const hasMany = list.length > 1;

  const prev = useCallback(() => {
    setIndex((i) => (i === 0 ? list.length - 1 : i - 1));
  }, [list.length]);

  const next = useCallback(() => {
    setIndex((i) => (i === list.length - 1 ? 0 : i + 1));
  }, [list.length]);

  useEffect(() => {
    setIndex(0);
  }, [item?.id, list.length]);

  useEffect(() => {
    if (!hasMany || paused || !autoPlayMs) return undefined;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [hasMany, paused, autoPlayMs, next]);

  if (!list.length) {
    return (
      <div className="product-gallery product-gallery--empty">
        <span>No image</span>
      </div>
    );
  }

  const current = list[index];

  return (
    <div
      className="product-gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {hasMany && (
        <div className="product-gallery__thumbs-side">
          {list.map((entry, i) => (
            <button
              key={`${entry.url}-${i}`}
              type="button"
              className={`product-gallery__thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <img src={entry.url} alt="" loading="lazy" style={getItemImageCropStyle(entry.crop)} />
            </button>
          ))}
        </div>
      )}

      <div className="product-gallery__stage">
        <div className="product-gallery__zoom">
          <img
            src={current.url}
            alt={alt}
            style={getItemImageCropStyle(current.crop)}
          />
        </div>

        {hasMany && (
          <>
            <button type="button" className="product-gallery__nav product-gallery__nav--prev" onClick={prev} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className="product-gallery__nav product-gallery__nav--next" onClick={next} aria-label="Next image">
              <ChevronRight size={22} />
            </button>
            <span className="product-gallery__counter">{index + 1} / {list.length}</span>
            <div className="product-gallery__dots">
              {list.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`product-gallery__dot ${i === index ? 'is-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
