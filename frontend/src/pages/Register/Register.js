import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });

  const [touched, setTouched] = useState({
    nickname: false,
    email: false,
    password: false,
    confirmPassword: false,
    agreeTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Валидация форм
  const validateField = (name, value) => {
    switch (name) {
      case 'nickname':
        if (!value.trim()) return 'Никнейм обязателен';
        if (value.length < 2) return 'Никнейм должен содержать минимум 2 символа';
        if (value.length > 20) return 'Никнейм не должен превышать 20 символов';
        return '';

      case 'email':
        if (!value.trim()) return 'Email обязателен';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email';
        return '';

      case 'password':
        if (!value) return 'Пароль обязателен';
        if (value.length < 6) return 'Пароль должен содержать минимум 6 символов';
        return '';

      case 'confirmPassword':
        if (!value) return 'Подтверждение пароля обязательно';
        if (value !== formData.password) return 'Пароли не совпадают';
        return '';

      case 'agreeTerms':
        if (!value) return 'Необходимо согласиться с условиями';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, fieldValue)
      }));
    }
    
    if (submitError) setSubmitError('');
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, fieldValue)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Помечаем все поля как touched для показа всех ошибок
    const allTouched = {
      nickname: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true
    };
    setTouched(allTouched);

    // Валидируем все поля
    const newErrors = {
      nickname: validateField('nickname', formData.nickname),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      agreeTerms: validateField('agreeTerms', formData.agreeTerms)
    };

    setErrors(newErrors);
    setSubmitError('');

    // Проверяем есть ли ошибки
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (user) {
        alert('Регистрация прошла успешно!');
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="form-container">
        <h1 className="register-title">Добро пожаловать</h1>
        <p className="register-subtitle">
          LOW.LOW - платформа, который спасает продукты перед сроком, продавая их дешевле
        </p>
        
        {submitError && (
          <div className="error-message mb-3">
            ❌ {submitError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form" noValidate>
          <div className="input-group">
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Никнейм"
              required
              disabled={loading}
              className={touched.nickname && errors.nickname ? 'error' : ''}
            />
            {touched.nickname && errors.nickname && (
              <div className="error-message">{errors.nickname}</div>
            )}
          </div>
          
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Почта"
              required
              disabled={loading}
              className={touched.email && errors.email ? 'error' : ''}
            />
            {touched.email && errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Пароль"
              required
              disabled={loading}
              className={touched.password && errors.password ? 'error' : ''}
            />
            {touched.password && errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>
          
          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Подтвердите пароль"
              required
              disabled={loading}
              className={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>
          
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              <span className={`checkmark ${touched.agreeTerms && errors.agreeTerms ? 'error' : ''}`}></span>
              Я согласен с условиями пользовательского соглашения
            </label>
            {touched.agreeTerms && errors.agreeTerms && (
              <div className="error-message checkbox-error">{errors.agreeTerms}</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p className="login-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;