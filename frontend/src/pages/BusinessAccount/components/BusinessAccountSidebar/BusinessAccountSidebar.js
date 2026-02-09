import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BusinessAccountSidebar.css';

const BusinessAccountSidebar = ({ 
  activeSection, 
  setActiveSection, 
  user, 
  onLogout, 
  onDeleteAccount 
}) => {
  const [companyData, setCompanyData] = useState({
    company_name: user?.company_name || 'Название компании',
    loading: true
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user || user.role !== 'business') {
        setCompanyData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/business/restaurant', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.restaurant) {
            setCompanyData({
              company_name: data.restaurant.company_name || user.company_name || 'Название компании',
              loading: false
            });
          } else {
            setCompanyData({
              company_name: user.company_name || 'Название компании',
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
        setCompanyData({
          company_name: user?.company_name || 'Название компании',
          loading: false
        });
      }
    };

    fetchCompanyData();
  }, [user]);

  if (companyData.loading) {
    return (
      <div className="business-account-sidebar">
        <div className="business-profile-card">
          <div className="business-avatar-placeholder-large loading"></div>
          <div className="business-info-sidebar">
            <div className="business-name loading" style={{ width: '150px', height: '24px' }}></div>
            <div className="business-email loading" style={{ width: '120px', height: '16px', marginTop: '8px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-account-sidebar">
      <div className="business-profile-card">
        <div className="business-avatar-large">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Business Logo" />
          ) : (
            <div className="business-avatar-placeholder-large">
              {companyData.company_name ? companyData.company_name.charAt(0).toUpperCase() : 'B'}
            </div>
          )}
        </div>
        <div className="business-info-sidebar">
          <h3 className="business-name">
            {companyData.company_name}
          </h3>
          <p className="business-email">{user?.email || 'email@company.com'}</p>
          <span className="business-badge">Бизнес-аккаунт</span>
        </div>
      </div>
      
      <nav className="business-account-nav">
        <button 
          className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          Бизнес-профиль
        </button>
        <button 
          className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
          onClick={() => setActiveSection('products')}
        >
          Мои продукты
        </button>
        <button 
          className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveSection('orders')}
        >
          История заказов
        </button>
        <button 
          className={`nav-item ${activeSection === 'location' ? 'active' : ''}`}
          onClick={() => setActiveSection('location')}
        >
          Местоположение
        </button>
        
        <div className="nav-divider"></div>
        
        <button 
          className="nav-item logout"
          onClick={onLogout}
        >
          Выйти из аккаунта
        </button>
        
        <button 
          className="nav-item delete"
          onClick={() => {
            setActiveSection('delete');
            onDeleteAccount();
          }}
        >
          Удалить аккаунт
        </button>
      </nav>
    </div>
  );
};

export default BusinessAccountSidebar;