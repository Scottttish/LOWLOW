// frontend/src/pages/Login/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

// Импортируем изображения
import food1 from '../../assets/images/food1.jpg';
import food2 from '../../assets/images/food2.jpg';
import food3 from '../../assets/images/food3.jpg';
import food4 from '../../assets/images/food4.jpg';
import food5 from '../../assets/images/food5.jpg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  
  const { login, isBackendAvailable, isCheckingBackend } = useAuth();
  const navigate = useNavigate();

  const images = [food1, food2, food3, food4, food5];

  // Автоматическая смена фоток
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (error) setError('');
    if (loginStatus) setLoginStatus('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError('Введите email');
      return;
    }
    
    if (!formData.password) {
      setError('Введите пароль');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    
    setLoading(true);
    setError('');
    setLoginStatus('');
    
    try {
      console.log('🔑 Пытаюсь войти:', formData.email);
      
      const user = await login(formData.email, formData.password);
      
      if (user) {
        console.log('✅ Пользователь вошел успешно:', user.email);
        setLoginStatus(`✅ Добро пожаловать, ${user.name || 'Пользователь'}!`);
        
        setTimeout(() => {
          if (user.role === 'admin') {
            navigate('/admin');
          } else if (user.role === 'business') {
            navigate('/business'); 
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        setError('Ошибка входа');
      }
    } catch (error) {
      console.error('❌ Ошибка входа:', error);
      setError(error.message || 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleIndicatorClick = (index) => {
    setCurrentImage(index);
  };

  return (
    <div className="login-container">
      {/* Контейнер формы */}
      <div className="form-container">
        <h1 className="login-title">Войти</h1>
        
        {isCheckingBackend && (
          <p className="server-status">
            Проверяем соединение с сервером...
          </p>
        )}
        
        {!isCheckingBackend && !isBackendAvailable && (
          <p className="server-status error">
            ❌ Сервер недоступен. Попробуйте позже.
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <div className="input-with-label">
              <span className="field-label">Почта</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите вашу почту"
                required
                disabled={loading || !isBackendAvailable}
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="input-group">
            <div className="input-with-label">
              <span className="field-label">Пароль</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Введите ваш пароль"
                required
                disabled={loading || !isBackendAvailable}
                autoComplete="current-password"
              />
            </div>
          </div>
          
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading || !isBackendAvailable}
              />
              <span className="checkmark"></span>
              Запомни меня
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Забыли пароль?
            </Link>
          </div>
          
          {/* Сообщения об ошибках и статусе */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          {loginStatus && (
            <div className="success-message">
              {loginStatus}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !isBackendAvailable}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Вход...
              </>
            ) : 'Войти'}
          </button>
        </form>
        
        <div className="login-links">
          <p className="signup-link">
            Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
          </p>
        </div>
      </div>

      {/* Контейнер с фотками */}
      <div className="login-images-container">
        <div className="login-image-slider">
          {images.map((image, index) => (
            <div 
              key={index} 
              className={`image-slide ${index === currentImage ? 'active' : ''}`}
            >
              <img src={image} alt={`Food ${index + 1}`} />
            </div>
          ))}
        </div>
        
        {/* Индикаторы */}
        <div className="image-indicators">
          {images.map((_, index) => (
            <div
              key={index}
              className={`image-indicator ${index === currentImage ? 'active' : ''}`}
              onClick={() => handleIndicatorClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;