import React, { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import Modal from './Modal';
import {
  DEFAULT_ITEM_IMAGE_CROP,
  ITEM_IMAGE_ASPECT_OPTIONS,
  getItemImageCropStyle,
  normalizeItemImageCrop,
} from '../../lib/itemImageCrop';

const ASPECT_MAP = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
  wide: 16 / 9,
};

export default function ImageCropEditor({ imageUrl, crop, onChange, onRemove, label = 'Image' }) {
  const normalizedCrop = useMemo(() => normalizeItemImageCrop(crop), [crop]);
  const [open, setOpen] = useState(false);
  const [draftAspect, setDraftAspect] = useState(normalizedCrop.aspect);
  const [draftZoom, setDraftZoom] = useState(normalizedCrop.zoom);
  const [draftPosition, setDraftPosition] = useState({
    x: (normalizedCrop.focusX - 50) * 2,
    y: (normalizedCrop.focusY - 50) * 2,
  });
  const [draftFocus, setDraftFocus] = useState({
    x: normalizedCrop.focusX,
    y: normalizedCrop.focusY,
  });

  const aspectRatio = ASPECT_MAP[draftAspect] ?? 1;

  useEffect(() => {
    if (!open) return;
    setDraftAspect(normalizedCrop.aspect);
    setDraftZoom(normalizedCrop.zoom);
    setDraftPosition({
      x: (normalizedCrop.focusX - 50) * 2,
      y: (normalizedCrop.focusY - 50) * 2,
    });
    setDraftFocus({ x: normalizedCrop.focusX, y: normalizedCrop.focusY });
  }, [normalizedCrop, open]);

  const onCropComplete = () => {
    const focusX = Math.min(100, Math.max(0, 50 + draftPosition.x / 2));
    const focusY = Math.min(100, Math.max(0, 50 + draftPosition.y / 2));
    setDraftFocus({ x: focusX, y: focusY });
  };

  const onSave = () => {
    onChange(
      normalizeItemImageCrop({
        aspect: draftAspect,
        zoom: draftZoom,
        focusX: draftFocus.x,
        focusY: draftFocus.y,
      }),
    );
    setOpen(false);
  };

  if (!imageUrl?.trim()) return null;

  return (
    <>
      <div className="image-crop-preview">
        <div className="image-crop-preview__thumb">
          <img src={imageUrl} alt={label} style={getItemImageCropStyle(normalizedCrop)} />
        </div>
        <div className="image-crop-preview__actions">
          <p className="image-crop-preview__label">{label}</p>
          <div className="image-crop-preview__buttons">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
              Edit crop
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onChange(normalizeItemImageCrop(DEFAULT_ITEM_IMAGE_CROP))}
            >
              Reset
            </button>
            {onRemove && (
              <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Crop image"
        description="Drag to move · Scroll/pinch to zoom · Choose shape · Save when done"
        fullPage
      >
        <div className="image-crop-modal">
          <div className="image-crop-modal__stage">
            <Cropper
              image={imageUrl}
              crop={draftPosition}
              zoom={draftZoom}
              aspect={aspectRatio}
              onCropChange={setDraftPosition}
              onZoomChange={setDraftZoom}
              onCropComplete={onCropComplete}
              minZoom={1}
              maxZoom={3}
              objectFit="contain"
              showGrid
              zoomWithScroll
            />
          </div>

          <div className="image-crop-modal__controls glass-panel panel-padding">
            <div className="image-crop-modal__row">
              <label className="form-label">Shape</label>
              <div className="image-crop-aspect-chips">
                {ITEM_IMAGE_ASPECT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-chip ${draftAspect === option.value ? 'filter-chip--active' : ''}`}
                    onClick={() => setDraftAspect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="image-crop-modal__row">
              <label className="form-label">Zoom</label>
              <div className="image-crop-zoom-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDraftZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDraftZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                  aria-label="Zoom in"
                >
                  +
                </button>
                <span className="image-crop-hint">Pinch (phone) / scroll (desktop) to zoom</span>
              </div>
            </div>

            <div className="image-crop-modal__footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setDraftZoom(1);
                  setDraftPosition({ x: 0, y: 0 });
                  setDraftFocus({ x: 50, y: 50 });
                }}
              >
                Reset
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave}>
                Save crop
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
