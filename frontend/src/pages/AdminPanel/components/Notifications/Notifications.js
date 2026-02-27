// src/pages/AdminPanel/components/Notifications/Notifications.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './Notifications.css';

const Notifications = ({ onNotificationRead }) => {
  const { getPartnershipRequests, updatePartnershipStatus, deletePartnershipRequest } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getPartnershipRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch partnership requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteRequest = async (id) => {
    try {
      await deletePartnershipRequest(id);
      setRequests(requests.filter(request => request.id !== id));
      if (onNotificationRead) onNotificationRead();
    } catch (error) {
      console.error('Failed to delete partnership request:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updatePartnershipStatus(id, status);
      // After updating status (like approval/rejection), we can either remove it or update UI
      // For notifications, we usually remove it or mark as processed
      setRequests(requests.filter(request => request.id !== id));
      if (onNotificationRead) onNotificationRead();
    } catch (error) {
      console.error('Failed to update partnership status:', error);
    }
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h4>Запросы на партнерство</h4>
        {!loading && <span className="notifications-count">{requests.length}</span>}
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="notifications-loading">Загрузка...</div>
        ) : requests.length === 0 ? (
          <div className="no-notifications">
            Нет новых запросов
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className="notification-item">
              <div className="notification-header">
                <span className="notification-email">{request.email}</span>
                <div className="notification-actions">
                  <button
                    className="approve-notification"
                    onClick={() => handleUpdateStatus(request.id, 'reviewed')}
                    title="Одобрить"
                  >
                    ✓
                  </button>
                  <button
                    className="delete-notification"
                    onClick={() => handleDeleteRequest(request.id)}
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="notification-message">
                <strong>{request.company_name}</strong>
                <p>{request.message}</p>
              </div>
              <div className="notification-date">
                {new Date(request.created_at || request.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;