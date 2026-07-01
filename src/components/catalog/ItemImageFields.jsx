import React from 'react';
import { Plus } from 'lucide-react';
import ImageCropEditor from '../ui/ImageCropEditor';
import { DEFAULT_ITEM_IMAGE_CROP } from '../../lib/itemImageCrop';

const MAX_EXTRA = 3;

export default function ItemImageFields({ value, onChange }) {
  const { imageUrl, imageCrop, extraImages = [] } = value;

  const setPrimary = (patch) => onChange({ ...value, ...patch });

  const setExtra = (index, patch) => {
    const next = [...extraImages];
    next[index] = { ...next[index], ...patch };
    onChange({ ...value, extraImages: next });
  };

  const addExtra = () => {
    if (extraImages.length >= MAX_EXTRA) return;
    onChange({
      ...value,
      extraImages: [...extraImages, { url: '', crop: { ...DEFAULT_ITEM_IMAGE_CROP } }],
    });
  };

  const removeExtra = (index) => {
    onChange({ ...value, extraImages: extraImages.filter((_, i) => i !== index) });
  };

  return (
    <div className="item-image-fields">
      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Primary image URL</label>
        <input
          className="form-control"
          placeholder="Paste public image link"
          value={imageUrl}
          onChange={(e) => setPrimary({ imageUrl: e.target.value })}
        />
        <p className="form-hint">Drag to crop, scroll/pinch to zoom — phone gallery style.</p>
      </div>

      {imageUrl?.trim() && (
        <div style={{ gridColumn: '1 / -1' }}>
          <ImageCropEditor
            label="Primary image"
            imageUrl={imageUrl}
            crop={imageCrop}
            onChange={(crop) => setPrimary({ imageCrop: crop })}
            onRemove={() => setPrimary({ imageUrl: '', imageCrop: { ...DEFAULT_ITEM_IMAGE_CROP } })}
          />
        </div>
      )}

      {extraImages.map((row, index) => (
        <div key={`extra-${index}`} className="item-image-fields__extra" style={{ gridColumn: '1 / -1' }}>
          <div className="form-group">
            <label className="form-label">Additional image {index + 1}</label>
            <input
              className="form-control"
              placeholder="Paste image link"
              value={row.url}
              onChange={(e) => setExtra(index, { url: e.target.value })}
            />
          </div>
          {row.url?.trim() && (
            <ImageCropEditor
              label={`Image ${index + 2}`}
              imageUrl={row.url}
              crop={row.crop}
              onChange={(crop) => setExtra(index, { crop })}
              onRemove={() => removeExtra(index)}
            />
          )}
        </div>
      ))}

      {extraImages.length < MAX_EXTRA && (
        <button type="button" className="btn btn-secondary btn-sm" style={{ gridColumn: '1 / -1' }} onClick={addExtra}>
          <Plus size={14} /> Add another image ({extraImages.length}/{MAX_EXTRA})
        </button>
      )}
    </div>
  );
}
