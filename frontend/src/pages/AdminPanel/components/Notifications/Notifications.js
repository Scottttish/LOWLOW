// src/pages/AdminPanel/components/Notifications/Notifications.js
import React, { useState, useEffect } from 'react';
import './Notifications.css';

const Notifications = ({ onNotificationRead }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const partnershipRequests = JSON.parse(localStorage.getItem('partnershipRequests')) || [];
    setRequests(partnershipRequests);
  }, []);

  const handleDeleteRequest = (id) => {
    const updatedRequests = requests.filter(request => request.id !== id);
    setRequests(updatedRequests);
    localStorage.setItem('partnershipRequests', JSON.stringify(updatedRequests));
    onNotificationRead();
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h4>Запросы на партнерство</h4>
        <span className="notifications-count">{requests.length}</span>
      </div>
      
      <div className="notifications-list">
        {requests.length === 0 ? (
          <div className="no-notifications">
            Нет новых запросов
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className="notification-item">
              <div className="notification-header">
                <span className="notification-email">{request.email}</span>
                <button 
                  className="delete-notification"
                  onClick={() => handleDeleteRequest(request.id)}
                >
                  ×
                </button>
              </div>
              <div className="notification-message">
                {request.message}
              </div>
              <div className="notification-date">
                {new Date(request.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;