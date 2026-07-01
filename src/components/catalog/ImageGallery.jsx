import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageReveal from '../ui/ImageReveal';
import { getItemImageCropStyle } from '../../lib/itemImageCrop';

function normalizeEntry(entry) {
  if (typeof entry === 'string') return { url: entry, crop: null };
  return { url: entry?.url || '', crop: entry?.crop || null };
}

export default function ImageGallery({ images, alt = '' }) {
  const [index, setIndex] = useState(0);
  const list = (images?.length ? images : []).map(normalizeEntry).filter((e) => e.url);

  if (!list.length) return null;

  const prev = () => setIndex((i) => (i === 0 ? list.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === list.length - 1 ? 0 : i + 1));

  return (
    <div className="image-gallery">
      <div className="image-gallery__main">
        <AnimatePresence mode="wait">
          <motion.div
            key={list[index].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ImageReveal
              src={list[index].url}
              alt={alt}
              sizes="hero"
              aspectRatio="16 / 10"
              cropStyle={getItemImageCropStyle(list[index].crop)}
            />
          </motion.div>
        </AnimatePresence>
        {list.length > 1 && (
          <>
            <button type="button" className="image-gallery__nav image-gallery__nav--prev" onClick={prev} aria-label="Previous">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className="image-gallery__nav image-gallery__nav--next" onClick={next} aria-label="Next">
              <ChevronRight size={22} />
            </button>
            <span className="image-gallery__counter">
              {index + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="item-detail__thumbs image-gallery__thumbs">
          {list.map((entry, i) => (
            <button
              key={`${entry.url}-${i}`}
              type="button"
              className={`item-detail__thumb ${i === index ? 'is-active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => setIndex(i)}
            >
              <img src={entry.url} alt="" loading="lazy" style={getItemImageCropStyle(entry.crop)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
