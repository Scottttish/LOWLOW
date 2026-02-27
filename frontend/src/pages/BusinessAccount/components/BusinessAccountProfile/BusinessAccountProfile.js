// frontend/src/pages/BusinessAccount/components/BusinessAccountProfile/BusinessAccountProfile.js
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BusinessAccountProfile.css';

const BusinessAccountProfile = () => {
  const { user, updateUser, uploadAvatar, getRestaurantProfile, updateRestaurantProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: '',
    bin: '',
    director_first_name: '',
    director_last_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    opening_time: '09:00',
    closing_time: '23:00',
    avatar_url: null
  });
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей'];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user) {
          // Базовая информация из users
          const initialData = {
            email: user.email || '',
            phone: user.phone || '',
            city: user.city || '',
            address: user.address || '',
            avatar_url: user.avatar_url || null,
            company_name: user.company_name || '',
            bin: '',
            director_first_name: '',
            director_last_name: '',
            opening_time: '09:00',
            closing_time: '23:00'
          };

          // Загружаем данные из таблицы restaurants
          if (user.role === 'business') {
            try {
              const restaurantInfo = await getRestaurantProfile();
              if (restaurantInfo) {
                initialData.company_name = restaurantInfo.company_name || initialData.company_name;
                initialData.bin = restaurantInfo.bin || '';
                initialData.director_first_name = restaurantInfo.director_first_name || '';
                initialData.director_last_name = restaurantInfo.director_last_name || '';
                if (restaurantInfo.opening_time) {
                  initialData.opening_time = restaurantInfo.opening_time.slice(0, 5);
                }
                if (restaurantInfo.closing_time) {
                  initialData.closing_time = restaurantInfo.closing_time.slice(0, 5);
                }
                // Также берем город и адрес из restaurants если они там есть
                if (restaurantInfo.city) {
                  initialData.city = restaurantInfo.city;
                }
                if (restaurantInfo.address) {
                  initialData.address = restaurantInfo.address;
                }
              }
            } catch (error) {
              // Restaurant data not available - это нормально
            }
          }

          setCompanyData(initialData);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, getRestaurantProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await uploadAvatar(file);

      setCompanyData(prev => ({
        ...prev,
        avatar_url: result.avatar_url
      }));
      // Логотип обновлен
    } catch (error) {
      console.error('Ошибка загрузки логотипа:', error);
    }
  };

  const handleTimeChange = (type, value) => {
    setCompanyData(prev => ({
      ...prev,
      [type === 'open' ? 'opening_time' : 'closing_time']: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!companyData.company_name || !companyData.email || !companyData.bin || !companyData.director_first_name || !companyData.phone || !companyData.city) {
        return; // Валидация - не сохраняем
      }

      // 1. Сохраняем базовые данные в users
      const userUpdateData = {
        name: companyData.director_first_name + (companyData.director_last_name ? ` ${companyData.director_last_name}` : ''),
        email: companyData.email,
        phone: companyData.phone,
        city: companyData.city,
        address: companyData.address,
        company_name: companyData.company_name,
        avatar_url: companyData.avatar_url
      };

      await updateUser(userUpdateData);

      // 2. Сохраняем бизнес-данные в restaurants
      const restaurantUpdateData = {
        company_name: companyData.company_name,
        bin: companyData.bin,
        director_first_name: companyData.director_first_name,
        director_last_name: companyData.director_last_name,
        opening_time: companyData.opening_time,
        closing_time: companyData.closing_time,
        city: companyData.city,
        address: companyData.address
      };

      await updateRestaurantProfile(restaurantUpdateData);

      setIsEditing(false);

    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  const handleCancel = () => {
    // При отмене просто выходим из режима редактирования
    setIsEditing(false);
  };

  const TimePicker = ({ type, value, onChange }) => (
    <div className="time-picker">
      <select
        value={value || '09:00'}
        onChange={(e) => onChange(type, e.target.value)}
        className="time-select"
        disabled={!isEditing}
      >
        {Array.from({ length: 24 }, (_, i) => {
          const hour = i.toString().padStart(2, '0');
          return [
            `${hour}:00`,
            `${hour}:30`
          ];
        }).flat().map(time => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </div>
  );

  if (!user || user.role !== 'business') {
    return (
      <div className="business-account-section">
        <div className="access-denied">
          <h3>Доступ запрещен</h3>
          <p>Эта страница доступна только для бизнес-аккаунтов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-account-section">
      <div className="section-header">
        <h2 className="section-title">Бизнес-профиль</h2>
        {!isEditing && (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="avatar-upload-section">
        <div
          className={`avatar-upload-container ${isEditing ? 'editable' : ''}`}
          onClick={handleAvatarClick}
        >
          <div className="business-avatar-upload">
            {companyData.avatar_url ? (
              <img src={companyData.avatar_url} alt="Business Logo" />
            ) : (
              <div className="business-avatar-placeholder">
                {companyData.company_name ? companyData.company_name.charAt(0).toUpperCase() : 'B'}
              </div>
            )}
          </div>
          {isEditing && (
            <div className="avatar-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 21.4142C3.21071 21.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 5L19 8M20.5 3.5C20.8978 3.10217 21.4374 2.87868 22 2.87868C22.5626 2.87868 23.1022 3.10217 23.5 3.5C23.8978 3.89782 24.1213 4.43739 24.1213 5C24.1213 5.56261 23.8978 6.10217 23.5 6.5L12 15L10 17L11 13L20.5 3.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Сменить логотип</span>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {isEditing && (
          <p className="avatar-hint">Нажмите на логотип для загрузки изображения компании</p>
        )}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Название компании *</label>
          <input
            type="text"
            name="company_name"
            value={loading ? '' : companyData.company_name}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : 'Введите название компании'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">БИН компании *</label>
          <input
            type="text"
            name="bin"
            value={loading ? 'Загрузка...' : companyData.bin}
            onChange={handleInputChange}
            className="form-input"
            placeholder={'Введите БИН компании (12 цифр)'}
            disabled={!isEditing}
            maxLength="12"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Имя руководителя *</label>
          <input
            type="text"
            name="director_first_name"
            value={loading ? '' : companyData.director_first_name}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : 'Введите имя руководителя'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Фамилия руководителя</label>
          <input
            type="text"
            name="director_last_name"
            value={loading ? '' : companyData.director_last_name}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : 'Введите фамилию руководителя'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email компании *</label>
          <input
            type="email"
            name="email"
            value={loading ? '' : companyData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : 'Введите email компании'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Телефон компании *</label>
          <input
            type="tel"
            name="phone"
            value={loading ? '' : companyData.phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : '+7 (XXX) XXX-XX-XX'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Город *</label>
          <select
            name="city"
            value={companyData.city}
            onChange={handleInputChange}
            className="form-input select-input"
            disabled={!isEditing}
          >
            <option value="">Выберите город</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Адрес</label>
          <input
            type="text"
            name="address"
            value={loading ? '' : companyData.address}
            onChange={handleInputChange}
            className="form-input"
            placeholder={loading ? 'Загрузка...' : 'Введите адрес компании'}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Часы работы *</label>
          <div className="working-hours-container">
            <div className="time-input-group">
              <span className="time-label">с</span>
              <TimePicker
                type="open"
                value={companyData.opening_time}
                onChange={handleTimeChange}
              />
            </div>
            <div className="time-separator">-</div>
            <div className="time-input-group">
              <span className="time-label">до</span>
              <TimePicker
                type="close"
                value={companyData.closing_time}
                onChange={handleTimeChange}
              />
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="save-button-container">
          <button className="save-btn" onClick={handleSave}>
            Сохранить изменения
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessAccountProfile;