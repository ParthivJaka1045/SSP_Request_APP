import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';
import ItemCard from '../../components/catalog/ItemCard';
import ItemCardGrid from '../../components/catalog/ItemCardGrid';
import RequestCartBar from '../../components/catalog/RequestCartBar';
import DirectBuyModal from '../../components/catalog/DirectBuyModal';
import { getModuleFromPath } from '../../constants/modules';
import { useModuleItems, useFilteredItems } from '../../hooks/useModuleItems';

/** Standalone catalog route — redirects hub users; same card → detail → full cart form flow. */
export default function ModuleCatalog() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mod = getModuleFromPath(pathname);
  const [search, setSearch] = useState('');
  const { items, loading } = useModuleItems(mod.itemsCategory, {
    activeOnly: true,
    catalogOnly: mod.id === 'technical',
  });
  const filtered = useFilteredItems(items, search);
  const [buyItem, setBuyItem] = useState(null);

  const goToCartForm = (item) => {
    navigate(`${mod.basePath}/request/new?itemId=${item.id}&cart=1`);
  };

  return (
    <PageShell
      title={`${mod.shortTitle} Catalog`}
      backTo={mod.basePath}
    >
      <div className="catalog-toolbar glass-panel">
        <div className="catalog-search">
          <Search size={18} />
          <input className="form-control" placeholder="Search by name or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="catalog-count">{filtered.length} items</span>
      </div>

      {loading ? (
        <div className="catalog-loading">Loading catalog...</div>
      ) : (
        <ItemCardGrid
          items={filtered}
          emptyMessage={search ? 'No items match your search.' : 'No active items in this module yet.'}
          renderCard={(item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              detailPath={`${mod.basePath}/items/${item.id}`}
              onAddToCart={() => goToCartForm(item)}
              onDirectBuy={() => setBuyItem(item)}
            />
          )}
        />
      )}
      <RequestCartBar />
      <DirectBuyModal open={!!buyItem} onClose={() => setBuyItem(null)} item={buyItem} mod={mod} />
    </PageShell>
  );
}
