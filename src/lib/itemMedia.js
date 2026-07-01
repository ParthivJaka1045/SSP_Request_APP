/** Normalize item image fields from Firestore documents. */

import { DEFAULT_ITEM_IMAGE_CROP, normalizeItemImageCrop } from './itemImageCrop';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop';

export function getItemImageEntries(item) {
  if (Array.isArray(item?.images) && item.images.length > 0) {
    return item.images
      .map((entry) => {
        if (typeof entry === 'string') {
          const url = entry.trim();
          return url ? { url, crop: DEFAULT_ITEM_IMAGE_CROP } : null;
        }
        const url = String(entry?.url || '').trim();
        if (!url) return null;
        return { url, crop: normalizeItemImageCrop(entry.crop) };
      })
      .filter(Boolean);
  }

  const links = [];
  if (item?.imageUrl) links.push({ url: item.imageUrl, crop: normalizeItemImageCrop(item.imageCrop) });
  if (Array.isArray(item?.imageLinks)) {
    item.imageLinks.forEach((u) => {
      const t = String(u || '').trim();
      if (t && !links.some((l) => l.url === t)) {
        links.push({ url: t, crop: DEFAULT_ITEM_IMAGE_CROP });
      }
    });
  }
  if (item?.imageLink) {
    const t = String(item.imageLink).trim();
    if (t && !links.some((l) => l.url === t)) {
      links.push({ url: t, crop: DEFAULT_ITEM_IMAGE_CROP });
    }
  }
  return links.length ? links : [{ url: PLACEHOLDER, crop: DEFAULT_ITEM_IMAGE_CROP }];
}

export function getItemImages(item) {
  return getItemImageEntries(item).map((e) => e.url);
}

export function getPrimaryImageEntry(item) {
  return getItemImageEntries(item)[0];
}

export function getPrimaryImage(item) {
  return getPrimaryImageEntry(item).url;
}

export function parseImageLinksInput(text) {
  return String(text || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const MAX_EXTRA_IMAGES = 3;

export function emptyItemImageForm() {
  return {
    imageUrl: '',
    imageCrop: { ...DEFAULT_ITEM_IMAGE_CROP },
    extraImages: [],
  };
}

export function itemToImageForm(item) {
  const entries = getItemImageEntries(item);
  const [primary, ...rest] = entries;
  return {
    imageUrl: primary?.url || '',
    imageCrop: primary?.crop || { ...DEFAULT_ITEM_IMAGE_CROP },
    extraImages: rest.slice(0, MAX_EXTRA_IMAGES).map((e) => ({
      url: e.url,
      crop: e.crop || { ...DEFAULT_ITEM_IMAGE_CROP },
    })),
  };
}

export function buildItemPayload({
  name,
  description,
  imageUrl,
  imageCrop,
  extraImages = [],
  imageLinksText,
  category,
  extra = {},
}) {
  const legacyLinks = parseImageLinksInput(imageLinksText);
  const primaryUrl = imageUrl?.trim() || legacyLinks[0] || '';
  const primaryCrop = normalizeItemImageCrop(imageCrop);

  const images = [];
  if (primaryUrl) {
    images.push({ url: primaryUrl, crop: primaryCrop });
  }

  for (const row of extraImages) {
    const url = String(row?.url || '').trim();
    if (!url || images.some((i) => i.url === url)) continue;
    images.push({ url, crop: normalizeItemImageCrop(row.crop) });
    if (images.length >= MAX_EXTRA_IMAGES + 1) break;
  }

  for (const link of legacyLinks) {
    if (images.length >= MAX_EXTRA_IMAGES + 1) break;
    if (!images.some((i) => i.url === link)) {
      images.push({ url: link, crop: { ...DEFAULT_ITEM_IMAGE_CROP } });
    }
  }

  const imageLinks = images.map((i) => i.url);

  return {
    name: name.trim(),
    description: (description || '').trim(),
    imageUrl: primaryUrl,
    imageCrop: primaryCrop,
    imageLinks,
    images,
    category,
    ...extra,
  };
}
