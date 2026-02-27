// src/pages/AdminPanel/AdminPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UsersManagement from './components/UsersManagement/UsersManagement';
import RestaurantsManagement from './components/RestaurantsManagement/RestaurantsManagement';
import ProductsManagement from './components/ProductsManagement/ProductsManagement';
import ActionLog from './components/ActionLog/ActionLog';
import Notifications from './components/Notifications/Notifications';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('action-log');
  const [isVisible, setIsVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const sectionRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Загрузка уведомлений
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/partnership`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          setNotificationsCount(data.requests.length);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check ogni minuto
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleNotificationRead = () => {
    // В новой системе Notifications сам обновляет UI, но можем обновить счетчик
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/partnership`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setNotificationsCount(data.requests.length);
      } catch (e) { }
    };
    fetchNotifications();
  };

  return (
    <div className="admin-panel-container" ref={sectionRef}>
      <div className={`admin-content-wrapper ${isVisible ? 'visible' : ''}`}>

        {/* Шапка админ-панели */}
        <div className="admin-header">
          <div className="admin-header-content">
            <h1 className="admin-title">LOW<span className="title-transparent">LOW</span> Admin</h1>
            <p className="admin-subtitle">Панель управления системой</p>
          </div>

          {/* Управления - уведомления и пользователь */}
          <div className="admin-header-controls">
            {/* Иконка уведомлений */}
            <div
              className="notifications-icon"
              ref={notificationsRef}
              onClick={toggleNotifications}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {notificationsCount > 0 && (
                <span className="notifications-badge">{notificationsCount}</span>
              )}

              {isNotificationsOpen && (
                <Notifications onNotificationRead={handleNotificationRead} />
              )}
            </div>

            {/* Информация о пользователе с dropdown */}
            <div className="admin-user-info" ref={dropdownRef} onClick={toggleDropdown}>
              <span>Администратор: <strong>{user.nickname || user.email}</strong></span>

              {isDropdownOpen && (
                <div className="admin-dropdown-menu">
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Выйти
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Навигационные вкладки */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'action-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('action-log')}
          >
            📋 Журнал действий
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Пользователи
          </button>
          <button
            className={`tab-button ${activeTab === 'restaurants' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
          >
            🏪 Заведения
          </button>
          <button
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Продукты
          </button>
        </div>

        {/* Контент вкладок - Ремим все вкладки стабильно, скрывая неактивные */}
        <div className="admin-main-content">
          <div style={{ display: activeTab === 'action-log' ? 'block' : 'none' }}>
            <ActionLog />
          </div>
          <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
            <UsersManagement />
          </div>
          <div style={{ display: activeTab === 'restaurants' ? 'block' : 'none' }}>
            <RestaurantsManagement />
          </div>
          <div style={{ display: activeTab === 'products' ? 'block' : 'none' }}>
            <ProductsManagement />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;