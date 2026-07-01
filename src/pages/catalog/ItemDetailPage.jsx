import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { db } from '../../firebase';
import PageShell from '../../components/layout/PageShell';
import ProductImageGallery from '../../components/catalog/ProductImageGallery';
import RequestCartBar from '../../components/catalog/RequestCartBar';
import DirectBuyModal from '../../components/catalog/DirectBuyModal';
import { getModuleFromPath } from '../../constants/modules';
import { getItemImages } from '../../lib/itemMedia';

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mod = getModuleFromPath(pathname);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDirectBuy, setShowDirectBuy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'items', itemId));
        if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [itemId]);

  if (loading) {
    return (
      <PageShell title="Loading..." backTo={mod.basePath}>
        <div className="catalog-loading">Loading item...</div>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell title="Item not found" backTo={mod.basePath}>
        <p>This item may have been removed.</p>
      </PageShell>
    );
  }

  const images = getItemImages(item);

  return (
    <PageShell title={item.name} backTo={mod.basePath} narrow>
      <div className="item-detail">
        <div className="item-detail__gallery">
          <ProductImageGallery item={item} alt={item.name} />
        </div>

        <motion.div
          className="item-detail__info glass-panel panel-padding"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="item-detail__title">{item.name}</h2>
          <p className="item-detail__desc">{item.description || 'No description provided.'}</p>

          {images.length > 0 && (
            <div className="item-detail__links">
              {images.map((url, i) => (
                <a key={url + i} href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} /> Image {i + 1}
                </a>
              ))}
            </div>
          )}

          <div className="item-detail__actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={item.isActive === false}
              onClick={() => setShowDirectBuy(true)}
            >
              Direct Buy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={item.isActive === false}
              onClick={() =>
                navigate(`${mod.basePath}/request/new?itemId=${item.id}&cart=1`)
              }
            >
              <ShoppingCart size={18} /> Add to Request Cart (full form)
            </button>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            You must complete the full request form before the item is added to your global Request Cart.
          </p>
        </motion.div>
      </div>
      <RequestCartBar />
      <DirectBuyModal open={showDirectBuy} onClose={() => setShowDirectBuy(false)} item={item} mod={mod} />
    </PageShell>
  );
}
