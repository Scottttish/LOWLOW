// src/components/Navbar.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToFooter = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const footer = document.getElementById('footer');
        if (footer) {
          footer.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      const footer = document.getElementById('footer');
      if (footer) {
        footer.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'business') {
      navigate('/business-account');
    } else {
      navigate('/account');
    }
  };

  const handleLogoClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCatalogClick = (e) => {
    e.preventDefault();
    navigate('/restaurants');
  };

  const handleNewsClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const newsSection = document.getElementById('catalog');
        if (newsSection) {
          newsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      const newsSection = document.getElementById('catalog');
      if (newsSection) {
        newsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    
    // После выхода редиректим на главную
    if (location.pathname === '/admin') {
      navigate('/');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Для админа показываем упрощенный навбар
  if (user?.role === 'admin') {
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
            //LOW<span className="logo-low">LOW</span>
          </div>
          
          <div className="nav-right-section">
            <div className="user-profile">
              <div className="user-info" ref={dropdownRef} onClick={toggleDropdown}>
                <div className="user-avatar">
                  <div className="avatar-placeholder">
                    {user.nickname?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </div>
                <div className="user-greeting">
                  <span className="username">
                    {user.nickname || 'Admin'}
                  </span>
                </div>
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
              </div>
              
              {isDropdownOpen && (
                <div className="admin-dropdown-menu">
                  <div className="dropdown-item" onClick={handleProfileClick}>
                    Панель управления
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    Выйти
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Оригинальный навбар для обычных пользователей
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
          //LOW<span className="logo-low">LOW</span>
        </div>
        
        <div className="nav-right-section">
          <div className="nav-links">
            <a href="#main" className="nav-link" onClick={(e) => {
              e.preventDefault();
              if (location.pathname !== '/') {
                navigate('/');
              } else {
                scrollToSection('main');
              }
            }}>Главная</a>
            <a href="#catalog" className="nav-link" onClick={handleNewsClick}>Новости</a>
            <a href="/restaurants" className="nav-link" onClick={handleCatalogClick}>Каталог</a>
            <a href="#contacts" className="nav-link" onClick={(e) => {
              e.preventDefault();
              scrollToFooter();
            }}>Контакты</a>
          </div>
          
          {user ? (
            <div className="user-profile">
              <div className="user-info" onClick={handleProfileClick}>
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : 
                       user.nickname ? user.nickname.charAt(0).toUpperCase() : 
                       user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <div className="user-greeting">
                  <span className="username">
                    {user.firstName || user.nickname || user.email}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={handleLoginClick}>Войти</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;