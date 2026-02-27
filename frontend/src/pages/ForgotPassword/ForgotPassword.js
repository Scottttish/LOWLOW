import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './ForgotPassword.css';

import food1 from '../../assets/images/food1.jpg';
import food2 from '../../assets/images/food2.jpg';
import food3 from '../../assets/images/food3.jpg';
import food4 from '../../assets/images/food4.jpg';
import food5 from '../../assets/images/food5.jpg';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [countdown, setCountdown] = useState(0);

    const { API_BASE_URL } = useAuth();
    const navigate = useNavigate();

    const images = [food1, food2, food3, food4, food5];

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSendCode = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            setError('Введите email');
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Введите корректный email');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMessage = data.message || 'Ошибка при отправке кода';
                if (response.status === 404) {
                    errorMessage = 'Несуществующий email';
                }
                throw new Error(errorMessage);
            }

            if (!data.success) {
                let errorMessage = data.message || 'Ошибка при отправке кода';
                if (errorMessage.includes('не найден')) {
                    errorMessage = 'Несуществующий email';
                }
                throw new Error(errorMessage);
            }

            setSuccess('Код отправлен на вашу почту');
            setStep(2);
            setCountdown(60);

        } catch (error) {
            console.error('Ошибка отправки кода:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();

        if (!formData.code.trim()) {
            setError('Введите код');
            return;
        }

        if (formData.code.length !== 6) {
            setError('Код должен содержать 6 цифр');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    code: formData.code
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                let errorMessage = data.message || 'Неверный код';
                throw new Error(errorMessage);
            }

            setResetToken(data.token);
            setSuccess('Код подтвержден');
            setStep(3);

        } catch (error) {
            console.error('Ошибка проверки кода:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!formData.newPassword) {
            setError('Введите новый пароль');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (!resetToken) {
            setError('Ошибка сессии. Начните процесс заново');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.trim().toLowerCase(),
                    token: resetToken,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                let errorMessage = data.message || 'Ошибка при смене пароля';
                throw new Error(errorMessage);
            }

            setSuccess('Пароль успешно изменен');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Ошибка сброса пароля:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) {
            setError(`Подождите ${countdown} секунд перед повторной отправкой`);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Ошибка при отправке кода');
            }

            setSuccess('Код отправлен повторно');
            setCountdown(60);

        } catch (error) {
            console.error('Ошибка повторной отправки:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleIndicatorClick = (index) => {
        setCurrentImage(index);
    };

    return (
        <div className="forgot-password-container">
            <div className="form-container">
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
                    {step === 2 && `Мы отправили код на ${formData.email}`}
                    {step === 3 && 'Придумайте новый пароль для вашего аккаунта'}
                </p>

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

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

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
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Отправка...' : 'Получить код'}
                        </button>
                    </form>
                )}

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
                                    placeholder="Введите код"
                                    maxLength="6"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="resend-code">
                            Не получили код?{' '}
                            <button
                                type="button"
                                className="resend-link"
                                onClick={handleResendCode}
                                disabled={loading || countdown > 0}
                            >
                                {countdown > 0 ? `Отправить снова (${countdown})` : 'Отправить снова'}
                            </button>
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Проверка...' : 'Подтвердить код'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="forgot-password-form">
                        <div className="input-group">
                            <div className="input-with-label">
                                <span className="field-label">Новый пароль</span>
                                <div className="password-input-container password-input-wrapper">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Введите новый пароль"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-unified"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        disabled={loading}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="input-with-label">
                                <span className="field-label">Подтвердите пароль</span>
                                <div className="password-input-container password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Повторите новый пароль"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-unified"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Сохраняем...' : 'Сохранить пароль'}
                        </button>
                    </form>
                )}

                <p className="signup-link">
                    Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
                </p>
            </div>

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