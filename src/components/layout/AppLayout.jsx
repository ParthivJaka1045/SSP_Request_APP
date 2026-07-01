import React, { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User, ChevronDown, ShoppingCart, ClipboardList, LockKeyhole, Calendar } from 'lucide-react';
import NavDropdown from './NavDropdown';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { useRequestCart } from '../../contexts/RequestCartContext';
import { formatDate } from '../../lib/formatDate';
import { getNavSectionsForUser, getHomePathForRole } from '../../lib/navConfig';
import { getRoleLabel } from '../../lib/permissions';
import RoleSwitcher from './RoleSwitcher';
import RoleBadge from './RoleBadge';
import PageTransition from './PageTransition';
import TopLoader from './TopLoader';

export default function AppLayout() {
  const { currentUser, activeRole, logout, workspace } = useAuth();
  const { totalCount } = useRequestCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const navSections = useMemo(
    () => getNavSectionsForUser(currentUser, activeRole),
    [currentUser, activeRole],
  );
  const navItems = useMemo(() => navSections.flatMap((s) => s.items), [navSections]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const isActive = (href, exact) => {
    if (exact) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showCartPill = workspace?.isMember;
  return (
    <div className="page-shell-layout">
      <TopLoader />
      <header className="stk-header sticky top-0 z-30">
        <div className="app-header-inner">
          <button type="button" className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <Link to={getHomePathForRole(activeRole)} className="app-logo">
            <span className="app-logo-mark">SSP</span>
            <span className="app-logo-text">Management</span>
          </Link>

          <div className="app-header-spacer" />

          {showCartPill && (
            <Link to="/cart" className="cart-pill">
              <ShoppingCart size={16} />
              <span className="cart-pill__label">Cart</span>
              {totalCount > 0 ? ` (${totalCount})` : ''}
            </Link>
          )}

          <div className="header-date hide-mobile">
            <Calendar size={14} />
            {formatDate(new Date())}
          </div>

          <NotificationBell />

          <div className="header-role-badge hide-mobile">
            <RoleBadge compact />
          </div>

          <div className="account-menu-wrap">
            <button type="button" className="account-trigger" onClick={() => setAccountOpen(!accountOpen)}>
              <User size={16} />
              <span className="hide-mobile">{currentUser?.name || currentUser?.email?.split('@')[0]}</span>
              <ChevronDown size={14} className={accountOpen ? 'rotate-180' : ''} />
            </button>
            {accountOpen && (
              <>
                <button type="button" className="account-backdrop" onClick={() => setAccountOpen(false)} />
                <div className="account-dropdown stk-card">
                  <p className="account-dropdown-name">{currentUser?.name || 'User'}</p>
                  <p className="account-dropdown-meta">
                    {currentUser?.email}
                    {activeRole ? ` · ${getRoleLabel(activeRole)}` : ''}
                  </p>
                  {workspace?.canSwitchRole && (
                    <div className="account-role-switch">
                      <p className="role-switcher__label">Switch role</p>
                      <RoleSwitcher compact />
                    </div>
                  )}
                  <hr className="account-divider" />
                  <button
                    type="button"
                    className="account-quick-link"
                    onClick={() => {
                      setAccountOpen(false);
                      setForgotOpen(true);
                    }}
                  >
                    <LockKeyhole size={16} /> Forgot password
                  </button>
                  {workspace?.isMember && (
                    <Link to="/orders" className="account-quick-link" onClick={() => setAccountOpen(false)}>
                      <ClipboardList size={16} /> My Orders
                    </Link>
                  )}
                  {workspace?.isMember && (
                    <Link to="/cart" className="account-quick-link" onClick={() => setAccountOpen(false)}>
                      <ShoppingCart size={16} /> Request Cart
                    </Link>
                  )}
                  <button type="button" className="account-logout" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="stk-header-sub hide-mobile-nav">
          <div className="app-header-inner app-nav-row">
            {navItems.map((item) => {
              if (item.children?.length) {
                return <NavDropdown key={item.label} item={item} />;
              }
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`app-nav-link ${active ? 'nav-link-active' : ''}`}
                >
                  <Icon size={16} />
                  {item.label}
                  {item.href === '/cart' && totalCount > 0 && (
                    <span className="nav-cart-badge">{totalCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="app-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {mobileOpen && (
        <div className="mobile-drawer">
          <button type="button" className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer-panel stk-card">
            <div className="mobile-drawer-head stk-header">
              <span className="app-logo-mark">SSP</span>
              <button type="button" onClick={() => setMobileOpen(false)}><X size={20} /></button>
            </div>
            {workspace?.canSwitchRole && (
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <RoleSwitcher />
              </div>
            )}
            <nav className="mobile-nav">
              {navSections.map((section) => (
                <div key={section.title} className="mobile-nav-section">
                  <p className="mobile-nav-section__title">{section.title}</p>
                  {section.items.map((item) => {
                    if (item.children?.length) {
                      return (
                        <div key={item.label} className="mobile-nav-group">
                          <p className="mobile-nav-group__label">{item.label}</p>
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const active = isActive(child.href, child.exact);
                            return (
                              <Link
                                key={child.href}
                                to={child.href}
                                className={`mobile-nav-link mobile-nav-link--child ${active ? 'mobile-nav-link--active' : ''}`}
                              >
                                <ChildIcon size={18} />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    }
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`mobile-nav-link ${active ? 'mobile-nav-link--active' : ''}`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <button type="button" className="account-logout" onClick={handleLogout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
