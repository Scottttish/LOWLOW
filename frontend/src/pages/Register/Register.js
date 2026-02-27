// frontend\src\pages\Register\Register.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './Register.css';

import food1 from '../../assets/images/food1.jpg';
import food2 from '../../assets/images/food2.jpg';
import food3 from '../../assets/images/food3.jpg';
import food4 from '../../assets/images/food4.jpg';
import food5 from '../../assets/images/food5.jpg';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  const images = [food1, food2, food3, food4, food5];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleIndicatorClick = (index) => {
    setCurrentImage(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      nickname: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true
    };
    setTouched(allTouched);

    const newErrors = {
      nickname: validateField('nickname', formData.nickname),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      agreeTerms: validateField('agreeTerms', formData.agreeTerms)
    };

    setErrors(newErrors);
    setSubmitError('');

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
      <div className="register-images-container">
        <div className="register-image-slider">
          {images.map((image, index) => (
            <div
              key={index}
              className={`image-slide ${index === currentImage ? 'active' : ''}`}
            >
              <img src={image} alt={`Food ${index + 1}`} />
            </div>
          ))}
        </div>

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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Пароль"
                required
                disabled={loading}
                className={`password-input-with-eye ${touched.password && errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle-unified"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="input-group">
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Подтвердите пароль"
                required
                disabled={loading}
                className={`password-input-with-eye ${touched.confirmPassword && errors.confirmPassword ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle-unified"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading}
                aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
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