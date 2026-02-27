// frontend\src\pages\BusinessAccount\BusinessAccount.js
// frontend\src\pages\BusinessAccount\BusinessAccount.js
// frontend\src\pages\BusinessAccount\BusinessAccount.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './BusinessAccount.css';

// Импортируем компоненты
import BusinessAccountSidebar from './components/BusinessAccountSidebar/BusinessAccountSidebar';
import BusinessAccountProfile from './components/BusinessAccountProfile/BusinessAccountProfile';
import BusinessAccountProducts from './components/BusinessAccountProducts/BusinessAccountProducts';
import BusinessAccountOrdersHistory from './components/BusinessAccountOrdersHistory/BusinessAccountOrdersHistory';
import BusinessAccountLocation from './components/BusinessAccountLocation/BusinessAccountLocation';
import BusinessAccountDialogs from './components/BusinessAccountDialogs/BusinessAccountDialogs';

const BusinessAccount = () => {
  const { user, logout, deleteUser, isBusiness } = useAuth();
  const navigate = useNavigate();

  // Состояния
  const [activeSection, setActiveSection] = useState('profile');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Проверяем авторизацию и бизнес-статус
  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true);

      if (!user) {
        navigate('/');
        return;
      }

      const userIsBusiness = isBusiness();

      if (!userIsBusiness) {
        navigate('/account');
        return;
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [user, navigate, isBusiness]);

  // Обработчики для диалогов
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser();
      navigate('/');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
    }
  };

  const handleCancelDialog = () => {
    setShowLogoutDialog(false);
    setShowDeleteDialog(false);
  };

  // Рендер активной секции
  const renderActiveSection = () => {

    switch (activeSection) {
      case 'profile':
        return <BusinessAccountProfile />;

      case 'products':
        return <BusinessAccountProducts />;

      case 'orders':
        return <BusinessAccountOrdersHistory />;

      case 'location':
        return <BusinessAccountLocation />;

      case 'delete':
        return (
          <div className="business-account-section">
            <h2 className="section-title">Удаление бизнес-аккаунта</h2>
            <div className="delete-warning">
              <p className="warning-text">
                Внимание: Удаление бизнес-аккаунта приведет к полной потере всех данных компании,
                включая историю заказов, продукты и персональные настройки. Это действие нельзя отменить.
              </p>
              <button className="delete-account-btn" onClick={handleDeleteAccountClick}>
                Удалить бизнес-аккаунт
              </button>
            </div>
          </div>
        );

      default:
        return <BusinessAccountProfile />;
    }
  };

  // Убираем полностью экран загрузки - рендерим интерфейс
  // Дочерние компоненты сами разберутся с состоянием загрузки

  // Если пользователь не загружен или не бизнес, показываем ничего
  if (!user || !isBusiness()) {
    return null;
  }

  return (
    <div className="business-account-page">
      {/* Основной контент */}
      <div className="business-account-container">
        <BusinessAccountSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          onLogout={handleLogoutClick}
          onDeleteAccount={handleDeleteAccountClick}
        />

        <div className="business-account-content">
          {renderActiveSection()}
        </div>
      </div>

      {/* Диалоговые окна */}
      <BusinessAccountDialogs
        showLogoutDialog={showLogoutDialog}
        showDeleteDialog={showDeleteDialog}
        onLogoutConfirm={handleLogoutConfirm}
        onDeleteConfirm={handleDeleteConfirm}
        onCancelDialog={handleCancelDialog}
      />
    </div>
  );
};

export default BusinessAccount;