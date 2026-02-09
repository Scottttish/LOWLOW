import React from 'react';
import './AccountSidebar.css';

const AccountSidebar = ({ activeSection, setActiveSection, user, onLogout, onDeleteAccount }) => {
  return (
    <div className="account-sidebar">
      <div className="user-profile-card">
        <div className="user-avatar-large">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder-large">
              {user?.name ? user.name.charAt(0).toUpperCase() : 
               user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        <div className="user-info-sidebar">
          <h3 className="user-name">
            {user?.name || user?.email || 'Пользователь'}
          </h3>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>
      
      <nav className="account-nav">
        <button 
          className={`nav-item ${activeSection === 'account' ? 'active' : ''}`}
          onClick={() => setActiveSection('account')}
        >
          Аккаунт
        </button>
        <button 
          className={`nav-item ${activeSection === 'location' ? 'active' : ''}`}
          onClick={() => setActiveSection('location')}
        >
          Мое местоположение
        </button>
        <button 
          className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveSection('orders')}
        >
          Мои заказы
        </button>
        <button 
          className={`nav-item ${activeSection === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveSection('cards')}
        >
          Мои карты
        </button>
        
        <button 
          className="nav-item logout"
          onClick={onLogout}
        >
          Выйти из аккаунта
        </button>
        
        <button 
          className="nav-item delete"
          onClick={onDeleteAccount}
        >
          Удалить аккаунт
        </button>
      </nav>
    </div>
  );
};

export default AccountSidebar;