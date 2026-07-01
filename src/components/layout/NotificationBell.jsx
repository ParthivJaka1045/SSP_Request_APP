import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../../lib/adminNotifications';
import { resolveActiveRole } from '../../lib/permissions';

export default function NotificationBell() {
  const { currentUser, activeRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const resolvedRole = resolveActiveRole(currentUser, activeRole);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.uid;
    const unsubscribe = subscribeToNotifications(userId, resolvedRole, (data) => {
      setNotifications(data.filter((n) => !n.read));
    }, 30);
    return () => unsubscribe();
  }, [currentUser, resolvedRole]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = getUnreadCount(notifications);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) SSP Management`;
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(unreadCount).catch(console.error);
      }
    } else {
      document.title = 'SSP Management';
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(console.error);
      }
    }
  }, [unreadCount]);

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    setIsOpen(false);
    if (notif.linkPath) {
      navigate(notif.linkPath);
    } else if (notif.requestId) {
      navigate(`/orders?open=${notif.requestId}`);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsRead(unreadIds);
    }
  };

  return (
    <div className="notification-bell-container notif-bell-wrap" ref={dropdownRef}>
      <button
        type="button"
        className="notif-bell-trigger notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge" aria-hidden>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-bell-panel stk-card notification-dropdown">
          <div className="notif-bell-panel__head">
            <div>
              <p className="section-kicker" style={{ margin: 0 }}>Alerts</p>
              <h4>Notifications</h4>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-bell-list">
            {notifications.length === 0 ? (
              <p className="notif-bell-empty">No new notifications.</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  className={`notif-bell-item notif-bell-item--unread ${notif.type === 'assignment' ? 'notif-bell-item--assignment' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-bell-item__top">
                    {notif.type === 'assignment' && <UserCheck size={14} className="notif-bell-item__icon" />}
                    <strong>{notif.title}</strong>
                    {notif.linkPath && <ExternalLink size={12} />}
                  </div>
                  <p>{notif.message}</p>
                  <span className="notif-bell-item__meta">
                    {notif.createdAt
                      ? new Date(notif.createdAt.toDate ? notif.createdAt.toDate() : notif.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
