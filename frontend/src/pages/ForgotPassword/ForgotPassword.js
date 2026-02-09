// src/pages/ForgotPassword/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

// Импортируем изображения (те же что в Login)
import food1 from '../../assets/images/food1.jpg';
import food2 from '../../assets/images/food2.jpg';
import food3 from '../../assets/images/food3.jpg';
import food4 from '../../assets/images/food4.jpg';
import food5 from '../../assets/images/food5.jpg';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 - ввод почты, 2 - ввод кода, 3 - новый пароль
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [currentImage, setCurrentImage] = useState(0);

  const images = [food1, food2, food3, food4, food5];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    // Здесь будет логика отправки кода на почту
    console.log('Отправка кода на:', formData.email);
    
    // В демо-режиме сразу переходим к следующему шагу
    setStep(2);
    alert(`Демо-режим: Код отправлен на ${formData.email}\n(В реальном приложении здесь будет отправка email)`);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    // Проверка кода
    if (formData.code === '123456') { // Демо-код
      setStep(3);
    } else {
      alert('Неверный код. Демо-код: 123456');
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }
    
    // Здесь будет логика сброса пароля
    console.log('Новый пароль установлен для:', formData.email);
    alert('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
    
    // Перенаправление на страницу входа
    window.location.href = '/login';
  };

  const handleIndicatorClick = (index) => {
    setCurrentImage(index);
  };

  return (
    <div className="forgot-password-container">
      {/* Контейнер формы */}
      <div className="form-container">
        {/* Кнопка назад */}
        <div className="back-button-container">
          <Link to="/login" className="back-button">
            <span className="back-arrow">←</span>
            Вернуться к входу
          </Link>
        </div>

        <h1 className="forgot-password-title">
          {step === 1 && 'Забыли пароль?'}
          {step === 2 && 'Введите код'}
          {step === 3 && 'Новый пароль'}
        </h1>
        
        <p className="forgot-password-subtitle">
          {step === 1 && 'Введите свою почту ниже, чтобы восстановить пароль'}
          {step === 2 && 'Мы отправили 6-значный код на вашу почту'}
          {step === 3 && 'Придумайте новый пароль для вашего аккаунта'}
        </p>

        {/* Индикатор прогресса */}
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span>3</span>
          </div>
        </div>

        {/* Шаг 1: Ввод почты */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="forgot-password-form">
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
                />
              </div>
            </div>
            
            <button type="submit" className="submit-button">
              Получить код
            </button>
          </form>
        )}

        {/* Шаг 2: Ввод кода */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="forgot-password-form">
            <div className="input-group">
              <div className="input-with-label">
                <span className="field-label">Код подтверждения</span>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Введите 6-значный код"
                  maxLength="6"
                  required
                />
                <div className="code-hint">
                  Демо-код: <strong>123456</strong>
                </div>
              </div>
            </div>

            <div className="resend-code">
              Не получили код? <button type="button" className="resend-link">Отправить снова</button>
            </div>
            
            <button type="submit" className="submit-button">
              Подтвердить код
            </button>
          </form>
        )}

        {/* Шаг 3: Новый пароль */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-password-form">
            <div className="input-group">
              <div className="input-with-label">
                <span className="field-label">Новый пароль</span>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Введите новый пароль"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-with-label">
                <span className="field-label">Подтвердите пароль</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Повторите новый пароль"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="submit-button">
              Сохранить пароль
            </button>
          </form>
        )}

        <p className="signup-link">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>

      {/* Контейнер с фотками (такой же как в Login) */}
      <div className="forgot-password-images-container">
        <div className="image-slider">
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

export default ForgotPassword;