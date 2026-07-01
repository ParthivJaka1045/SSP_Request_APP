/** CSS-based crop metadata (STK pattern — no server-side pixel crop). */

export const DEFAULT_ITEM_IMAGE_CROP = {
  aspect: 'square',
  zoom: 1,
  focusX: 50,
  focusY: 50,
};

export const ITEM_IMAGE_ASPECT_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'wide', label: 'Wide' },
];

export function normalizeItemImageCrop(crop) {
  return {
    aspect: crop?.aspect ?? DEFAULT_ITEM_IMAGE_CROP.aspect,
    zoom: Math.min(Math.max(crop?.zoom ?? DEFAULT_ITEM_IMAGE_CROP.zoom, 1), 2.5),
    focusX: Math.min(Math.max(crop?.focusX ?? DEFAULT_ITEM_IMAGE_CROP.focusX, 0), 100),
    focusY: Math.min(Math.max(crop?.focusY ?? DEFAULT_ITEM_IMAGE_CROP.focusY, 0), 100),
  };
}

export function getItemImageCropStyle(crop) {
  const normalized = normalizeItemImageCrop(crop);
  return {
    objectPosition: `${normalized.focusX}% ${normalized.focusY}%`,
    transform: `scale(${normalized.zoom})`,
    transformOrigin: 'center center',
  };
}

export function getItemImageAspectClass(crop) {
  const normalized = normalizeItemImageCrop(crop);
  switch (normalized.aspect) {
    case 'portrait':
      return 'item-crop-aspect--portrait';
    case 'landscape':
      return 'item-crop-aspect--landscape';
    case 'wide':
      return 'item-crop-aspect--wide';
    default:
      return 'item-crop-aspect--square';
  }
}
