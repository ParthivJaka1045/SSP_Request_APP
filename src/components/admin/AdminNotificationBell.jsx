import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  fetchAdminNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../lib/adminNotifications';

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminNotifications(25);
      setItems(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const unread = getUnreadCount(items);

  const handleOpen = async (item) => {
    if (!item.read) await markNotificationRead(item.id);
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    setOpen(false);
    if (item.linkPath) navigate(item.linkPath);
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) await markAllNotificationsRead(unreadIds);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="notif-bell-wrap">
      <button
        type="button"
        className="notif-bell-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && <span className="notif-bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <button type="button" className="account-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-bell-panel stk-card">
            <div className="notif-bell-panel__head">
              <div>
                <p className="section-kicker">Admin</p>
                <h4>Notifications</h4>
              </div>
              {unread > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <p className="notif-bell-hint">
              Messages and status updates from orders — tap to open request.
            </p>
            <div className="notif-bell-list">
              {loading && items.length === 0 ? (
                <p className="notif-bell-empty">Loading...</p>
              ) : items.length === 0 ? (
                <p className="notif-bell-empty">No notifications yet.</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`notif-bell-item ${item.read ? '' : 'notif-bell-item--unread'}`}
                    onClick={() => handleOpen(item)}
                  >
                    <div className="notif-bell-item__top">
                      <strong>{item.title}</strong>
                      <span className="notif-bell-item__type">{item.type}</span>
                    </div>
                    <p>{item.message}</p>
                    <span className="notif-bell-item__meta">
                      {item.senderName} · {item.moduleId || 'order'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
