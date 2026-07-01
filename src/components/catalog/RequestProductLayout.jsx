import React from 'react';
import ProductImageGallery from './ProductImageGallery';

export default function RequestProductLayout({ item, moduleTitle, children, topSlot }) {
  return (
    <div className="request-product-layout">
      <aside className="request-product-layout__gallery glass-panel panel-padding">
        <ProductImageGallery item={item} alt={item?.name || 'Item'} />
        <div className="request-product-layout__info">
          {moduleTitle && <p className="section-kicker">{moduleTitle}</p>}
          <h2 className="request-product-layout__title">{item?.name || 'Select an item'}</h2>
          {item?.description && (
            <p className="request-product-layout__desc">{item.description}</p>
          )}
        </div>
      </aside>
      <div className="request-product-layout__form">
        {topSlot}
        {children}
      </div>
    </div>
  );
}
