// frontend/src/components/Contact.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Contact.css';
import contactBg from '../assets/images/contact-bg.jpg';

const Contact = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user, getToken, isBackendAvailable } = useAuth();
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.3,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleSendRequest = () => {
    if (!isBackendAvailable) {
      alert('Сервер недоступен. Пожалуйста, попробуйте позже.');
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ email: '', message: '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.email.trim()) {
      setError('Введите email');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Введите сообщение');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Введите корректный email');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('📧 Отправка запроса на партнерство:', formData.email);
      
      const token = getToken();
      const requestData = {
        email: formData.email.trim(),
        message: formData.message.trim()
      };
      
      // Добавляем user_id, если пользователь авторизован
      if (user && user.id) {
        requestData.user_id = user.id;
      }
      
      const response = await fetch('http://localhost:5000/api/partnership-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Ответ сервера:', response.status);
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Запрос отправлен:', data.request.id);
        setSuccess('Ваш запрос отправлен! Мы свяжемся с вами в ближайшее время.');
        
        // Очищаем форму через 2 секунды
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        console.error('❌ Ошибка отправки запроса:', data.message);
        setError(data.message || 'Ошибка отправки запроса');
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      setError('Произошла ошибка при отправке запроса. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибки при изменении
    if (error) setError('');
    if (success) setSuccess('');
  };

  return (
    <>
      <section className={`contact ${isVisible ? 'visible' : ''}`} ref={sectionRef} id="contacts">
        <div className="contact-background">
          <img src={contactBg} alt="Contact background" />
        </div>
        <div className="contact-container">
          <div className="contact-content">
            <div className="contact-subtitle">/свяжитесь с нами</div>
            <h2 className="contact-title">Откройте возможности партнерства</h2>
            <button 
              className="contact-button" 
              onClick={handleSendRequest}
              disabled={!isBackendAvailable}
            >
              отправить запрос
            </button>
            
            {!isBackendAvailable && (
              <p className="server-warning">
                ⚠️ Сервер временно недоступен. Функция отправки запросов отключена.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Запрос на партнерство</h3>
              <button 
                className="modal-close" 
                onClick={handleCloseModal}
                disabled={loading}
              >
                ×
              </button>
            </div>
            
            <div className="modal-instruction">
              <h4>Инструкция по заполнению:</h4>
              <p>Для сотрудничества с нами нам потребуется следующая информация:</p>
              <ul>
                <li>Название вашего заведения</li>
                <li>Тип кухни или услуг</li>
                <li>Местоположение</li>
                <li>Контактные данные для связи</li>
                <li>Дополнительная информация о вашем бизнесе</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="partnership-form">
              <div className="form-group">
                <label>Ваша почта *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label>Информация для сотрудничества *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Опишите подробно информацию о вашем заведении и предложении о сотрудничестве..."
                  rows="6"
                  required
                  disabled={loading}
                />
              </div>

              {/* Сообщения об ошибках и успехе */}
              {error && (
                <div className="form-error">
                  ❌ {error}
                </div>
              )}
              
              {success && (
                <div className="form-success">
                  ✅ {success}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner"></span>
                      Отправка...
                    </>
                  ) : 'Отправить запрос'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Contact;