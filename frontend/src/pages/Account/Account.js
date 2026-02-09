import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useNavigate } from 'react-router-dom';
import './Account.css';

import AccountSidebar from './components/AccountSidebar/AccountSidebar';
import AccountProfile from './components/AccountProfile/AccountProfile';
import AccountCards from './components/AccountCards/AccountCards';
import AccountLocation from './components/AccountLocation/AccountLocation';
import AccountOrders from './components/AccountOrders/AccountOrders';
import AccountDialogs from './components/AccountDialogs/AccountDialogs';

const Account = () => {
  const { user, logout: authLogout } = useAuth();
  const { 
    fetchAccountData,
    deactivateAccount,
    deleteAccount,
    accountData,
    cards,
    orders,
    location
  } = useAccount();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('account');
  const [showNotification, setShowNotification] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAccountData();
      
      if (accountData) {
        const hasBasicInfo = accountData.name && 
                            accountData.email && 
                            accountData.city;
        if (!hasBasicInfo) {
          setShowNotification(true);
        }
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-container">
          <div className="account-content">
            <div className="account-section">
              <div className="empty-profile">
                <h3>Пожалуйста, войдите в систему</h3>
                <p>Для просмотра профиля необходимо авторизоваться</p>
                <button 
                  className="login-redirect-btn"
                  onClick={() => navigate('/login')}
                >
                  Войти в аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await deactivateAccount();
      setShowLogoutDialog(false);
      navigate('/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      alert('Ошибка при выходе: ' + error.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await deleteAccount();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Ошибка при удалении аккаунта:', error);
      alert('Ошибка при удалении аккаунта: ' + error.message);
    }
  };

  const handleCancelDialog = () => {
    setShowLogoutDialog(false);
    setShowDeleteDialog(false);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountProfile />;
      case 'cards':
        return <AccountCards />;
      case 'location':
        return <AccountLocation />;
      case 'orders':
        return <AccountOrders />;
      default:
        return <AccountProfile />;
    }
  };

  return (
    <div className="account-page">
      {showNotification && (
        <div className="notification">
          <div className="notification-content">
            <p>Пожалуйста, заполните информацию в вашем профиле для полного доступа ко всем функциям</p>
            <button 
              className="notification-close"
              onClick={() => setShowNotification(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="account-container">
        <AccountSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={accountData || user}
          onLogout={handleLogoutClick}
          onDeleteAccount={handleDeleteAccountClick}
        />
        
        <div className="account-content">
          {renderActiveSection()}
        </div>
      </div>

      <AccountDialogs
        showLogoutDialog={showLogoutDialog}
        showDeleteDialog={showDeleteDialog}
        onLogoutConfirm={handleLogoutConfirm}
        onDeleteConfirm={handleDeleteConfirm}
        onCancelDialog={handleCancelDialog}
      />
    </div>
  );
};

export default Account;