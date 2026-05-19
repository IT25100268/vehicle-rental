import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import ConfirmationModal from './ConfirmationModal';
import './NotificationCenter.css';

const NotificationCenter = ({ user, onClose, notify }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await notificationService.getNotifications(user.id, user.role);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications(false);
    };
    window.addEventListener('notificationsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isClearModalOpen || event.target.closest('.modal-overlay')) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClearModalOpen, onClose]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id, user.role);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      await notificationService.clearNotifications(user.id, user.role);
      setNotifications([]); // Immediate UI update
      setIsClearModalOpen(false);
      if (notify) {
        notify("Notifications cleared successfully.", "success");
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
      setError({
        headline: "Failed to Clear Notifications",
        body: "Notifications could not be removed. Please try again.",
        cta: "Try Again"
      });
      if (notify) {
        notify("Failed to clear notifications.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED': return '🎉';
      case 'BOOKING_CANCELLED': return '❌';
      case 'BOOKING_STATUS_UPDATE': return '📋';
      case 'PAYMENT_SUCCESS': return '💰';
      case 'PAYMENT_PENDING': return '⏳';
      case 'VEHICLE_ADDED': return '🚗';
      case 'VEHICLE_AVAILABLE': return '✅';
      case 'VEHICLE_MAINTENANCE': return '🔧';
      case 'DISCOUNT_ALERT': return '🏷️';
      case 'ADMIN_MESSAGE': return '🛡️';
      case 'SUPPORT_MESSAGE': return '💬';
      default: return '🔔';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notification-dropdown glass scale-in" ref={dropdownRef}>
      <div className="notification-header">
        <div className="notification-header-left">
          <h3 className="notification-title">Notifications</h3>
          {notifications.some((n) => !n.isRead) && (
            <span className="unread-count-pill">
              {notifications.filter(n => !n.isRead).length} new
            </span>
          )}
        </div>
        <div className="notification-header-actions">
          {notifications.length > 0 && (
            <button onClick={handleMarkAllRead} className="btn-mark-read" title="Mark all as read">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="notification-list custom-scrollbar">
        {loading ? (
          <div className="notification-loading">
            <div className="loader-spinner"></div>
            <span>Fetching updates...</span>
          </div>
        ) : error ? (
          <div className="notification-error-card">
            <div className="error-card-icon">❌</div>
            <h4 className="error-card-title">{error.headline}</h4>
            <p className="error-card-body">{error.body}</p>
            <button className="btn-error-cta" onClick={() => { setError(null); handleClearAll(); }}>
              {error.cta}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="empty-state-icon">🔔</div>
            <p className="empty-state-text">No notifications available.</p>
            <p className="empty-state-subtext">We'll let you know when something happens.</p>
          </div>
        ) : (
          <div className="notification-items-wrapper">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`notification-card ${!n.isRead ? 'unread' : ''}`}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              >
                <div className={`notification-icon-wrapper ${n.type?.toLowerCase().replace(/_/g, '-')}`}>
                  {getIcon(n.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-top-row">
                    <span className="notification-card-title">{n.title}</span>
                    <span className="notification-time">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="notification-message">{n.message}</p>
                  <div className="notification-actions">
                    {!n.isRead && <span className="unread-dot"></span>}
                    <button 
                      className="btn-delete-notif" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      title="Remove"
                    >
                      <span className="delete-icon">×</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notification-footer">
          <button 
            className="btn-view-all" 
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
          >
            View all notifications
          </button>
          <button 
            className="btn-clear-all" 
            onClick={() => setIsClearModalOpen(true)}
          >
            Clear all
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAll}
        title="Clear All Notifications?"
        message="This will permanently remove all your notifications. Continue?"
        confirmText="Yes, Clear All"
        variant="danger"
      />
    </div>
  );
};

export default NotificationCenter;
