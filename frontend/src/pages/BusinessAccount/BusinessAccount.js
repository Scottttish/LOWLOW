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
    console.log('🔍 [BusinessAccount] Проверка доступа');
    console.log('📊 user из useAuth:', user);
    console.log('📊 isBusiness():', isBusiness());
    
    const checkAccess = async () => {
      setIsChecking(true);
      
      if (!user) {
        console.log('❌ [BusinessAccount] Пользователь не загружен, перенаправляем');
        // Если пользователь не загружен, перенаправляем на главную
        navigate('/');
        return;
      }
      
      // Проверяем, является ли пользователь бизнесом
      const userIsBusiness = isBusiness();
      console.log('📊 Пользователь бизнес?', userIsBusiness, 'Роль:', user.role);
      
      if (!userIsBusiness) {
        console.log('❌ [BusinessAccount] Пользователь не бизнес, перенаправляем в обычный аккаунт');
        // Перенаправляем в обычный аккаунт
        navigate('/account');
        return;
      }
      
      console.log('✅ [BusinessAccount] Доступ разрешен, пользователь бизнес-аккаунт');
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
      alert('Ошибка удаления аккаунта');
    }
  };

  const handleCancelDialog = () => {
    setShowLogoutDialog(false);
    setShowDeleteDialog(false);
  };

  // Рендер активной секции
  const renderActiveSection = () => {
    console.log('🔄 [BusinessAccount] Рендер секции:', activeSection);
    console.log('📊 Текущий пользователь для рендера:', user);
    
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

  // Показываем загрузку пока проверяем
  if (isChecking) {
    console.log('⏳ [BusinessAccount] Показываем экран загрузки');
    return (
      <div className="business-account-page loading">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Проверка доступа...</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            ID пользователя: {user?.id || 'не определен'}
            <br />
            Email: {user?.email || 'не определен'}
            <br />
            Роль: {user?.role || 'не определена'}
          </p>
        </div>
      </div>
    );
  }

  // Если пользователь не загружен или не бизнес, показываем ничего
  if (!user || !isBusiness()) {
    console.log('❌ [BusinessAccount] Пользователь не найден или не бизнес');
    console.log('📊 Состояние:', { user_exists: !!user, is_business: isBusiness() });
    return null;
  }

  console.log('✅ [BusinessAccount] Рендерим основной интерфейс');
  console.log('📊 Данные пользователя:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company_name: user.company_name
  });

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