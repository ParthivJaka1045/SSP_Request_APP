import React, { useEffect, useState, useMemo } from 'react';

import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';

import { Search, ShoppingCart } from 'lucide-react';

import PageShell from '../../components/layout/PageShell';

import RequestCartBar from '../../components/catalog/RequestCartBar';

import DirectBuyModal from '../../components/catalog/DirectBuyModal';

import ItemCard from '../../components/catalog/ItemCard';

import ItemCardGrid from '../../components/catalog/ItemCardGrid';

import UserAddItemPanel from '../../components/catalog/UserAddItemPanel';

import TechnicalEntryChooser from '../../components/modules/TechnicalEntryChooser';

import { getModuleById, MODULE_IDS } from '../../constants/modules';

import { useAuth } from '../../contexts/AuthContext';

import { fetchModuleRequests } from '../../lib/moduleRequests';

import { canAccessModule, canCreateRequest } from '../../lib/permissions';

import { subscribeModuleSettings, canUserAddItems } from '../../lib/moduleSettings';

import { useRequestCart } from '../../contexts/RequestCartContext';

import { useModuleItems, useFilteredItems } from '../../hooks/useModuleItems';

import { filterRequestsByView } from '../../lib/requestFilters';

import { formatDate } from '../../lib/formatDate';



const VIEW_OPTIONS = [

  { value: 'home', label: 'Start' },

  { value: 'catalog', label: 'Item Catalog' },

  { value: 'today', label: "My Requests (Today)" },

  { value: 'pending', label: 'Pending' },

  { value: 'cart', label: 'In Request Cart' },

];



const FLOW_LABELS = {

  replacement: 'Replacement',

  new: 'New Request',

};



export default function ModuleHub({ moduleId }) {

  const mod = getModuleById(moduleId);

  const { currentUser, activeRole, workspace } = useAuth();

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const flow = searchParams.get('flow');

  const isTechnical = mod.id === MODULE_IDS.technical;



  const defaultView = isTechnical

    ? 'home'

    : workspace?.isMember || workspace?.isAdmin

      ? 'catalog'

      : 'today';



  const viewParam = searchParams.get('view');

  const view = flow === 'new'
    ? 'catalog'
    : flow === 'replacement'
      ? 'home'
      : viewParam || defaultView;



  const { cartItems, countByModule } = useRequestCart();

  const [requests, setRequests] = useState([]);

  const [loadingRequests, setLoadingRequests] = useState(true);

  const [itemSearch, setItemSearch] = useState('');
  const [moduleSettings, setModuleSettings] = useState(null);
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);
  const [buyItem, setBuyItem] = useState(null);

  const { items, loading: loadingItems } = useModuleItems(mod.itemsCategory, {
    activeOnly: true,
    refreshKey: itemsRefreshKey,
    catalogOnly: isTechnical,
  });

  const filteredItems = useFilteredItems(items, itemSearch);



  const canBrowse = canCreateRequest(currentUser, mod.id, activeRole) || workspace?.workspace?.isAdmin;

  const cartCount = countByModule[mod.id] || 0;

  const moduleCartItems = cartItems.filter((c) => c.moduleId === mod.id);

  const hasAccess = canAccessModule(currentUser, mod.id, activeRole);

  const showUserAddItem = moduleSettings && canUserAddItems(moduleSettings, mod.id) && canBrowse;



  useEffect(() => {

    return subscribeModuleSettings(setModuleSettings);

  }, []);



  useEffect(() => {

    if (!currentUser || !hasAccess) return;

    fetchModuleRequests(mod.id, currentUser, activeRole)

      .then(setRequests)

      .finally(() => setLoadingRequests(false));

  }, [currentUser, mod.id, activeRole, hasAccess]);



  const displayedRequests = useMemo(() => {

    if (view === 'cart' || view === 'home') return [];

    return filterRequestsByView(requests, view);

  }, [requests, view]);



  const setView = (v) => {

    const next = new URLSearchParams(searchParams);

    next.delete('flow');

    if (v === 'home' && isTechnical) {

      next.delete('view');

    } else if (v === 'catalog') {

      next.delete('view');

    } else {

      next.set('view', v);

    }

    setSearchParams(next);

  };



  const goToRequestForm = (item) => {

    const params = new URLSearchParams({ itemId: item.id });

    if (flow === 'new') {
      params.set('requestType', 'New Requirement');
      params.set('flow', 'new');
    } else {
      params.set('cart', '1');
    }

    navigate(`${mod.basePath}/request/new?${params}`);

  };



  const toolbarOptions = useMemo(() => {

    if (!isTechnical) return VIEW_OPTIONS.filter((o) => o.value !== 'home');

    return VIEW_OPTIONS;

  }, [isTechnical]);



  const pageTitle = flow && FLOW_LABELS[flow]

    ? `${mod.shortTitle} — ${FLOW_LABELS[flow]}`

    : mod.title;



  const backTo = flow ? mod.basePath : '/';



  if (flow === 'replacement') {
    return <Navigate to="/technical/replacement" replace />;
  }

  if (!hasAccess) {

    return <Navigate to="/" replace />;

  }



  return (

    <PageShell title={pageTitle} backTo={backTo}>

      {view === 'home' && isTechnical && (

        <TechnicalEntryChooser accent={mod.accent} />

      )}



      {view === 'catalog' && (
        <div className="module-view-toolbar glass-panel">
          <div className="catalog-search" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              className="form-control"
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {view !== 'home' && view !== 'catalog' && (
        <div className="module-view-toolbar glass-panel">
          <label className="form-label" style={{ margin: 0 }}>Show</label>
          <select
            className="form-control module-view-select"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            {toolbarOptions.filter((o) => o.value !== 'catalog').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
                {o.value === 'cart' && cartCount > 0 ? ` (${cartCount})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}



      {view === 'catalog' && (
        <>

          {showUserAddItem && (

            <div style={{ marginBottom: '1rem' }}>

              <UserAddItemPanel
                moduleId={mod.id}
                itemsCategory={mod.itemsCategory}
                currentUser={currentUser}

                onAdded={() => setItemsRefreshKey((k) => k + 1)}

              />

            </div>

          )}



          {loadingItems ? (

            <div className="catalog-loading">Loading catalog...</div>

          ) : (

            <ItemCardGrid

              items={filteredItems}

              emptyMessage={

                showUserAddItem

                  ? 'No items yet. Use Add item to catalog above.'

                  : 'No active items in this module.'

              }

              renderCard={(item, index) => (

                <ItemCard

                  key={item.id}

                  item={item}

                  index={index}

                  detailPath={flow ? undefined : `${mod.basePath}/items/${item.id}`}
                  onAddToCart={() => goToRequestForm(item)}
                  onDirectBuy={() => setBuyItem(item)}
                  addButtonLabel={flow === 'new' ? 'Select' : undefined}

                />

              )}

            />

          )}

        </>

      )}



      {view === 'cart' && (

        <div className="glass-panel panel-padding">

          {moduleCartItems.length === 0 ? (

            <p style={{ color: 'var(--text-muted)' }}>

              No items from {mod.shortTitle} in your cart.

            </p>

          ) : (

            <ul className="cart-preview-list">

              {moduleCartItems.map((entry) => (

                <li key={entry.key} className="cart-preview-list__item">

                  <strong>{entry.itemName}</strong>

                  <span>{entry.requestDraft?.requestType || 'New Requirement'}</span>

                  <span className="text-muted">{entry.requestDraft?.neededByDate ? formatDate(entry.requestDraft.neededByDate) : '—'}</span>

                </li>

              ))}

            </ul>

          )}

          <Link to="/cart" className="btn btn-primary" style={{ marginTop: '1rem' }}>

            <ShoppingCart size={18} /> Open Request Cart

          </Link>

        </div>

      )}



      {view !== 'catalog' && view !== 'cart' && view !== 'home' && (

        <div className="glass-panel" style={{ overflow: 'hidden' }}>

          {loadingRequests ? (

            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>

          ) : displayedRequests.length === 0 ? (

            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>

              {view === 'today' ? 'No requests submitted today.' : 'No pending requests.'}

            </div>

          ) : (

            <div className="table-responsive">

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>

                <thead>

                  <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)' }}>

                    <th style={{ padding: '0.75rem 1rem' }}>Item</th>

                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>

                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>

                  </tr>

                </thead>

                <tbody>

                  {displayedRequests.map((r) => (

                    <tr

                      key={r.id}

                      style={{ borderTop: '1px solid var(--border-color)', cursor: 'pointer' }}

                      onClick={() => navigate(`/request/${r.id}?module=${mod.id}`)}

                    >

                      <td style={{ padding: '0.75rem 1rem' }}>{r.finalItemName || r.itemType}</td>

                      <td style={{ padding: '0.75rem 1rem' }}>{r.status}</td>

                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>

                        {formatDate(r.createdAt)}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}



      <RequestCartBar />
      <DirectBuyModal open={!!buyItem} onClose={() => setBuyItem(null)} item={buyItem} mod={mod} />
    </PageShell>

  );

}

