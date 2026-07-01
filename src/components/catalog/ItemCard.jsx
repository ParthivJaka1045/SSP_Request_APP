import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import ImageReveal from '../ui/ImageReveal';
import { getPrimaryImage, getPrimaryImageEntry } from '../../lib/itemMedia';
import { getItemImageCropStyle } from '../../lib/itemImageCrop';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ItemCard({
  item,
  detailPath,
  onAddToCart,
  onDirectBuy,
  addButtonLabel = 'Add to Request Cart',
  showAdminActions,
  adminSlot,
  index = 0,
}) {
  const navigate = useNavigate();
  const inactive = item.isActive === false;
  const imageEntry = getPrimaryImageEntry(item);
  const image = imageEntry.url;
  const cropStyle = getItemImageCropStyle(imageEntry.crop);

  const handleCardClick = () => {
    if (onAddToCart && !detailPath) {
      onAddToCart(item);
      return;
    }
    if (detailPath) navigate(detailPath);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(item);
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -6 }}
      className={`item-card item-card--clickable ${inactive ? 'item-card--inactive' : ''}`}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      role="button"
      tabIndex={0}
    >
      <div className="item-card__media">
        <ImageReveal src={image} alt={item.name} cropStyle={cropStyle} />
        {item.pendingAdminReview && (
          <span className="item-card__badge item-card__badge--warn">Pending review</span>
        )}
        {inactive && <span className="item-card__badge item-card__badge--muted">Inactive</span>}
      </div>
      <div className="item-card__body">
        <h3 className="item-card__title">{item.name}</h3>
        {item.description ? (
          <p className="item-card__desc">{item.description}</p>
        ) : (
          <p className="item-card__desc item-card__desc--muted">No description yet</p>
        )}
        <div className="item-card__actions" onClick={(e) => e.stopPropagation()}>
          {onDirectBuy && !inactive && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDirectBuy(item); }}>
              Direct Buy
            </button>
          )}
          {onAddToCart && !inactive && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleAddToCart}>
              <ShoppingCart size={16} /> {addButtonLabel}
            </button>
          )}
          {showAdminActions && adminSlot}
        </div>
      </div>
    </motion.article>
  );
}
