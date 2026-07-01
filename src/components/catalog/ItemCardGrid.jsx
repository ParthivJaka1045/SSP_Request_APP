import React from 'react';
import { motion } from 'framer-motion';
import ItemCard from './ItemCard';

export default function ItemCardGrid({ items, renderCard, emptyMessage = 'No items found.' }) {
  if (!items.length) {
    return (
      <div className="catalog-empty glass-panel">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="item-card-grid"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {items.map((item, index) =>
        renderCard ? (
          renderCard(item, index)
        ) : (
          <ItemCard key={item.id} item={item} index={index} />
        ),
      )}
    </motion.div>
  );
}
