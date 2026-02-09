// src/pages/AdminPanel/components/RestaurantsManagement/RestaurantsManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './RestaurantsManagement.css';

const RestaurantsManagement = () => {
  const { users, updateUser, deleteUser, createBusinessUser } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    companyName: '',
    bin: '',
    directorFirstName: '',
    directorLastName: '',
    email: '',
    phone: '',
    city: '',
    openingTime: '09:00',
    closingTime: '23:00',
    password: ''
  });
  const sectionRef = useRef(null);

  const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
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

  useEffect(() => {
    const businessUsers = users.filter(user => user.role === 'business');
    setRestaurants(businessUsers);
  }, [users]);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.directorFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'all' || restaurant.city === filterCity;
    return matchesSearch && matchesCity;
  });

  const availableCities = [...new Set(restaurants.map(r => r.city).filter(Boolean))];

  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setEditFormData({
      companyName: restaurant.companyName || '',
      directorFirstName: restaurant.directorFirstName || '',
      directorLastName: restaurant.directorLastName || '',
      bin: restaurant.bin || '',
      city: restaurant.city || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      openingTime: restaurant.openingTime || '09:00',
      closingTime: restaurant.closingTime || '23:00'
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.companyName || !editFormData.email) {
      alert('Название заведения и email обязательны для заполнения');
      return;
    }

    try {
      // Проверяем уникальность email (кроме текущего пользователя)
      const emailExists = restaurants.some(restaurant => 
        restaurant.email === editFormData.email && restaurant.id !== editingRestaurant.id
      );
      
      if (emailExists) {
        alert('Пользователь с таким email уже существует');
        return;
      }

      await updateUser(editingRestaurant.id, editFormData);
      
      // Обновляем локальное состояние
      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === editingRestaurant.id 
          ? { ...restaurant, ...editFormData }
          : restaurant
      ));
      
      setEditingRestaurant(null);
      setEditFormData({});
      alert('Изменения сохранены успешно!');
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error);
      alert(error.message || 'Ошибка при сохранении изменений');
    }
  };

  const handleCancelEdit = () => {
    setEditingRestaurant(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateCompany = async () => {
    if (!newCompanyData.companyName || !newCompanyData.email || !newCompanyData.password) {
      alert('Название компании, email и пароль обязательны для заполнения');
      return;
    }

    try {
      // Проверяем уникальность email
      const emailExists = users.some(user => user.email === newCompanyData.email);
      if (emailExists) {
        alert('Пользователь с таким email уже существует');
        return;
      }

      // Используем функцию createBusinessUser из AuthContext
      await createBusinessUser(newCompanyData);
      
      // Обновляем локальное состояние
      const businessUsers = users.filter(user => user.role === 'business');
      setRestaurants(businessUsers);
      
      setShowCreateForm(false);
      setNewCompanyData({
        companyName: '',
        bin: '',
        directorFirstName: '',
        directorLastName: '',
        email: '',
        phone: '',
        city: '',
        openingTime: '09:00',
        closingTime: '23:00',
        password: ''
      });
      
      alert('Компания успешно создана! Данные для входа: ' + newCompanyData.email + ' / ' + newCompanyData.password);
    } catch (error) {
      console.error('Ошибка при создании компании:', error);
      alert('Ошибка при создании компании: ' + error.message);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Вы уверены, что хотите удалить это заведение?')) {
      try {
        await deleteUser(restaurantId);
        setRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
        alert('Заведение успешно удалено!');
      } catch (error) {
        console.error('Ошибка при удалении заведения:', error);
        alert('Ошибка при удалении заведения');
      }
    }
  };

  const getWorkingHours = (restaurant) => {
    if (restaurant.openingTime && restaurant.closingTime) {
      return `${restaurant.openingTime} - ${restaurant.closingTime}`;
    }
    return 'Не указано';
  };

  return (
    <div className="restaurants-management-panel" ref={sectionRef}>
      <div className={`restaurants-management-content ${isVisible ? 'restaurants-content-visible' : ''}`}>
        
        {/* Заголовок и управление */}
        <div className="restaurants-management-header">
          <h2 className="restaurants-management-title">Управление заведениями</h2>
          <div className="restaurants-management-controls">
            <div className="restaurants-search-box">
              <input
                type="text"
                placeholder="Поиск заведений..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="restaurants-search-input"
              />
            </div>
            <select 
              value={filterCity} 
              onChange={(e) => setFilterCity(e.target.value)}
              className="restaurants-filter-select"
            >
              <option value="all">Все города</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button 
              className="restaurants-create-company-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Создать компанию
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="restaurants-stats-container">
          <div className="restaurants-stat-card">
            <div className="restaurants-stat-number">{filteredRestaurants.length}</div>
            <div className="restaurants-stat-label">Всего заведений</div>
          </div>
          <div className="restaurants-stat-card">
            <div className="restaurants-stat-number">{availableCities.length}</div>
            <div className="restaurants-stat-label">Городов</div>
          </div>
        </div>

        {/* Модальное окно создания компании */}
        {showCreateForm && (
          <div className="restaurants-modal-overlay">
            <div className="restaurants-modal-content">
              <div className="restaurants-modal-header">
                <h3>Создание новой компании</h3>
                <button className="restaurants-modal-close" onClick={() => setShowCreateForm(false)}>×</button>
              </div>
              
              <div className="restaurants-modal-body">
                <div className="restaurants-form-grid">
                  <div className="restaurants-form-group">
                    <label>Название компании *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={newCompanyData.companyName}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите название компании"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>БИН компании</label>
                    <input
                      type="text"
                      name="bin"
                      value={newCompanyData.bin}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите БИН компании"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Имя директора</label>
                    <input
                      type="text"
                      name="directorFirstName"
                      value={newCompanyData.directorFirstName}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите имя директора"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Фамилия директора</label>
                    <input
                      type="text"
                      name="directorLastName"
                      value={newCompanyData.directorLastName}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите фамилию директора"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Email для входа *</label>
                    <input
                      type="email"
                      name="email"
                      value={newCompanyData.email}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите email для входа"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Пароль для входа *</label>
                    <input
                      type="password"
                      name="password"
                      value={newCompanyData.password}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Создайте пароль для входа"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Телефон</label>
                    <input
                      type="text"
                      name="phone"
                      value={newCompanyData.phone}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                      placeholder="Введите телефон компании"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Город</label>
                    <select
                      name="city"
                      value={newCompanyData.city}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input restaurants-select-input"
                    >
                      <option value="">Выберите город</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Время открытия</label>
                    <input
                      type="time"
                      name="openingTime"
                      value={newCompanyData.openingTime}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Время закрытия</label>
                    <input
                      type="time"
                      name="closingTime"
                      value={newCompanyData.closingTime}
                      onChange={handleNewCompanyInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="restaurants-modal-actions">
                <button className="restaurants-cancel-btn" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </button>
                <button className="restaurants-save-btn" onClick={handleCreateCompany}>
                  Создать компанию
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно редактирования */}
        {editingRestaurant && (
          <div className="restaurants-modal-overlay">
            <div className="restaurants-modal-content">
              <div className="restaurants-modal-header">
                <h3>Редактирование заведения</h3>
                <button className="restaurants-modal-close" onClick={handleCancelEdit}>×</button>
              </div>
              
              <div className="restaurants-modal-body">
                <div className="restaurants-form-grid">
                  <div className="restaurants-form-group">
                    <label>Название заведения *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={editFormData.companyName}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Имя директора</label>
                    <input
                      type="text"
                      name="directorFirstName"
                      value={editFormData.directorFirstName}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Фамилия директора</label>
                    <input
                      type="text"
                      name="directorLastName"
                      value={editFormData.directorLastName}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>БИН</label>
                    <input
                      type="text"
                      name="bin"
                      value={editFormData.bin}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Город</label>
                    <select
                      name="city"
                      value={editFormData.city}
                      onChange={handleInputChange}
                      className="restaurants-form-input restaurants-select-input"
                    >
                      <option value="">Выберите город</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Телефон</label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Время открытия</label>
                    <input
                      type="time"
                      name="openingTime"
                      value={editFormData.openingTime}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                  
                  <div className="restaurants-form-group">
                    <label>Время закрытия</label>
                    <input
                      type="time"
                      name="closingTime"
                      value={editFormData.closingTime}
                      onChange={handleInputChange}
                      className="restaurants-form-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="restaurants-modal-actions">
                <button className="restaurants-cancel-btn" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="restaurants-save-btn" onClick={handleSaveEdit}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Таблица */}
        <div className="restaurants-table-container">
          <table className="restaurants-management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Информация о заведении</th>
                <th>Контактные данные</th>
                <th>Город</th>
                <th>Время работы</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map((restaurant, index) => (
                <tr 
                  key={restaurant.id} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <td className="restaurant-id-cell">#{restaurant.id}</td>
                  <td className="restaurant-info-cell">
                    <div className="restaurant-main-info">
                      <strong>{restaurant.companyName || 'Без названия'}</strong>
                      <span>BIN: {restaurant.bin || 'Не указан'}</span>
                    </div>
                    <div className="restaurant-director-info">
                      {restaurant.directorFirstName} {restaurant.directorLastName}
                    </div>
                  </td>
                  <td className="restaurant-contact-cell">
                    <div>{restaurant.email}</div>
                    {restaurant.phone && <div>{restaurant.phone}</div>}
                  </td>
                  <td className="restaurant-city-cell">
                    <span className="restaurant-city-badge">
                      {restaurant.city || 'Не указан'}
                    </span>
                  </td>
                  <td className="restaurant-hours-cell">
                    <span className="restaurant-hours-badge">
                      {getWorkingHours(restaurant)}
                    </span>
                  </td>
                  <td className="restaurant-actions-cell">
                    <div className="restaurant-actions-wrapper">
                      <button
                        className="restaurant-action-btn restaurant-edit-btn"
                        onClick={() => handleEditRestaurant(restaurant)}
                        title="Редактировать"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="restaurant-action-btn restaurant-delete-btn"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        title="Удалить"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRestaurants.length === 0 && (
            <div className="restaurants-no-data">
              <p>Заведения не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantsManagement;