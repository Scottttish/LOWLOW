import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './RestaurantsManagement.css';
import { Eye, EyeOff, Search, Plus, Trash2, Edit2, Clock, MapPin, Phone, Mail, Building, User, FileText, Globe } from 'lucide-react';
import ReactDOM from 'react-dom';

const RestaurantsManagement = () => {
  const { getAllUsers, adminUpdateUser, adminDeleteUser, createBusinessUser, user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const sectionRef = useRef(null);

  const [newCompanyData, setNewCompanyData] = useState({
    companyName: '',
    bin: '',
    directorFirstName: '',
    directorLastName: '',
    phone: '',
    city: '',
    email: '',
    password: '',
    openingTime: '09:00',
    closingTime: '22:00',
    logo_url: ''
  });

  const [editFormData, setEditFormData] = useState({
    companyName: '',
    director_first_name: '',
    director_last_name: '',
    bin: '',
    city: '',
    phone: '',
    email: '',
    password: '',
    openingTime: '',
    closingTime: '',
    logo_url: ''
  });

  const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск'];

  useEffect(() => {
    loadRestaurants();
    setIsVisible(true);
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      // Фильтруем только бизнес-аккаунты
      const businessUsers = data.filter(u => u.role === 'business');
      setRestaurants(businessUsers);
    } catch (err) {
      setError('Ошибка при загрузке заведений');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setNewCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (editingRestaurant) {
          setEditFormData(prev => ({ ...prev, logo_url: ev.target.result }));
        } else {
          setNewCompanyData(prev => ({ ...prev, logo_url: ev.target.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCompany = async () => {
    try {
      if (!newCompanyData.companyName || !newCompanyData.bin || !newCompanyData.email || !newCompanyData.password) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
      }

      const businessData = {
        email: newCompanyData.email,
        password: newCompanyData.password,
        companyName: newCompanyData.companyName,
        bin: newCompanyData.bin,
        directorFirstName: newCompanyData.directorFirstName,
        directorLastName: newCompanyData.directorLastName,
        phone: newCompanyData.phone,
        city: newCompanyData.city,
        openingTime: newCompanyData.openingTime,
        closingTime: newCompanyData.closingTime,
        logo_url: newCompanyData.logo_url || null
      };

      await createBusinessUser(businessData);
      setShowCreateForm(false);
      loadRestaurants();
      setNewCompanyData({
        companyName: '',
        bin: '',
        directorFirstName: '',
        directorLastName: '',
        phone: '',
        city: '',
        email: '',
        password: '',
        openingTime: '09:00',
        closingTime: '22:00',
        logo_url: ''
      });
    } catch (err) {
      alert('Ошибка при создании заведения: ' + err.message);
    }
  };

  const handleEditRestaurant = (restaurant) => {
    setEditingRestaurant(restaurant);
    setEditFormData({
      companyName: restaurant.company_name || '',
      director_first_name: restaurant.director_first_name || '',
      director_last_name: restaurant.director_last_name || '',
      bin: restaurant.bin || '',
      city: restaurant.city || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      password: '',
      openingTime: restaurant.opening_time || '09:00',
      closingTime: restaurant.closing_time || '22:00',
      logo_url: restaurant.logo_url || restaurant.avatar_url || ''
    });
    setShowPassword(false);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedData = {
        company_name: editFormData.companyName,
        director_first_name: editFormData.director_first_name,
        director_last_name: editFormData.director_last_name,
        bin: editFormData.bin,
        city: editFormData.city,
        phone: editFormData.phone,
        email: editFormData.email,
        opening_time: editFormData.openingTime,
        closing_time: editFormData.closingTime,
        logo_url: editFormData.logo_url,
        avatar_url: editFormData.logo_url, // Sync for compatibility
        password: editFormData.password || undefined // Only include if changed
      };

      await adminUpdateUser(editingRestaurant.id, updatedData);
      setEditingRestaurant(null);
      loadRestaurants();
    } catch (err) {
      alert('Ошибка при обновлении: ' + err.message);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это заведение?')) {
      try {
        await adminDeleteUser(id);
        loadRestaurants();
      } catch (err) {
        alert('Ошибка при удалении: ' + err.message);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingRestaurant(null);
  };

  const getWorkingHours = (restaurant) => {
    if (!restaurant.opening_time && !restaurant.closing_time) return 'Не указано';
    const formatTime = (t) => t ? t.split(':').slice(0, 2).join(':') : '??:??';
    return `${formatTime(restaurant.opening_time)} - ${formatTime(restaurant.closing_time)}`;
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = (r.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.bin || '').includes(searchTerm);
    const matchesCity = filterCity ? r.city === filterCity : true;
    return matchesSearch && matchesCity;
  });

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="restaurants-management-panel" ref={sectionRef}>
      <div className={`restaurants-management-content ${isVisible ? 'restaurants-content-visible' : ''}`}>
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
              <option value="">Все города</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <button className="restaurants-create-company-btn" onClick={() => setShowCreateForm(true)}>
              <Plus size={18} style={{ marginRight: '8px' }} /> + Добавить заведение
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="restaurants-stats-container">
          <div className="restaurants-stat-card">
            <div className="restaurants-stat-number">{restaurants.length}</div>
            <div className="restaurants-stat-label">Всего заведений</div>
          </div>
          <div className="restaurants-stat-card">
            <div className="restaurants-stat-number">{new Set(restaurants.map(r => r.city).filter(Boolean)).size}</div>
            <div className="restaurants-stat-label">Городов присутствия</div>
          </div>
          <div className="restaurants-stat-card">
            <div className="restaurants-stat-number">
              {restaurants.filter(r => r.opening_time && r.closing_time).length}
            </div>
            <div className="restaurants-stat-label">С графиком работы</div>
          </div>
        </div>

        {/* Модальное окно создания */}
        {showCreateForm && ReactDOM.createPortal(
          <div className="restaurants-modal-overlay">
            <div className="restaurants-modal-content">
              <div className="restaurants-modal-header">
                <h3>Создание заведения</h3>
                <button className="restaurants-modal-close" onClick={() => setShowCreateForm(false)}>×</button>
              </div>

              <div className="restaurants-modal-body">
                <div className="restaurants-form-grid">
                  <div className="restaurants-form-left-fields">
                    <div className="restaurants-form-group">
                      <label>Название компании *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={newCompanyData.companyName}
                        onChange={handleNewCompanyInputChange}
                        className="restaurants-form-input"
                        placeholder="Введите название"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>БИН</label>
                      <input
                        type="text"
                        name="bin"
                        value={newCompanyData.bin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setNewCompanyData(prev => ({ ...prev, bin: value }));
                        }}
                        className="restaurants-form-input"
                        placeholder="12-значный номер"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Имя директора *</label>
                      <input
                        type="text"
                        name="directorFirstName"
                        value={newCompanyData.directorFirstName}
                        onChange={handleNewCompanyInputChange}
                        className="restaurants-form-input"
                        placeholder="Имя"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Фамилия директора *</label>
                      <input
                        type="text"
                        name="directorLastName"
                        value={newCompanyData.directorLastName}
                        onChange={handleNewCompanyInputChange}
                        className="restaurants-form-input"
                        placeholder="Фамилия"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Телефон *</label>
                      <input
                        type="text"
                        name="phone"
                        value={newCompanyData.phone}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 15);
                          setNewCompanyData(prev => ({ ...prev, phone: value }));
                        }}
                        className="restaurants-form-input"
                        placeholder="+7 (___) ___ __ __"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Город *</label>
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
                      <label className="label-not-bold">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={newCompanyData.email}
                        onChange={handleNewCompanyInputChange}
                        className="restaurants-form-input"
                        placeholder="example@mail.com"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Пароль *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={newCompanyData.password}
                          onChange={handleNewCompanyInputChange}
                          className="restaurants-form-input"
                        />
                        <button
                          type="button"
                          className="password-toggle-unified"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
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

                  <div className="restaurants-modal-right-column">
                    <div className="restaurants-logo-section-unified">
                      <label className="section-title">Логотип</label>
                      <div className="restaurants-modal-logo-container">
                        <div className="logo-preview-box">
                          {newCompanyData.logo_url ? (
                            <img src={newCompanyData.logo_url} alt="Logo" className="restaurants-modal-logo-preview" />
                          ) : (
                            <div className="restaurants-modal-logo-placeholder">
                              {newCompanyData.companyName ? newCompanyData.companyName.charAt(0).toUpperCase() : 'B'}
                            </div>
                          )}
                        </div>
                        <div className="logo-upload-actions">
                          <input
                            type="file"
                            id="new-logo-upload-file"
                            className="restaurant-logo-upload-input"
                            onChange={handleLogoUpload}
                            accept="image/*"
                          />
                          <label htmlFor="new-logo-upload-file" className="restaurants-upload-btn-unified">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Загрузить
                          </label>
                          {newCompanyData.logo_url && (
                            <button
                              className="remove-logo-btn"
                              onClick={() => setNewCompanyData({ ...newCompanyData, logo_url: '' })}
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="restaurants-modal-actions">
                <button className="restaurants-cancel-btn" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </button>
                <button className="restaurants-save-btn" onClick={handleCreateCompany}>
                  Создать заведение
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Модальное окно редактирования */}
        {editingRestaurant && ReactDOM.createPortal(
          <div className="restaurants-modal-overlay">
            <div className="restaurants-modal-content">
              <div className="restaurants-modal-header">
                <h3>Редактирование заведения</h3>
                <button className="restaurants-modal-close" onClick={handleCancelEdit}>×</button>
              </div>

              <div className="restaurants-modal-body">
                <div className="restaurants-form-grid">
                  <div className="restaurants-form-left-fields">
                    <div className="restaurants-form-group">
                      <label>Название заведения</label>
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
                        name="director_first_name"
                        value={editFormData.director_first_name}
                        onChange={handleInputChange}
                        className="restaurants-form-input"
                        placeholder="Имя"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Фамилия директора</label>
                      <input
                        type="text"
                        name="director_last_name"
                        value={editFormData.director_last_name}
                        onChange={handleInputChange}
                        className="restaurants-form-input"
                        placeholder="Фамилия"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>БИН</label>
                      <input
                        type="text"
                        name="bin"
                        value={editFormData.bin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setEditFormData(prev => ({ ...prev, bin: value }));
                        }}
                        className="restaurants-form-input"
                        placeholder="12-значный номер"
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
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 15);
                          setEditFormData(prev => ({ ...prev, phone: value }));
                        }}
                        className="restaurants-form-input"
                        placeholder="+7 (___) ___ __ __"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label className="label-not-bold">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleInputChange}
                        className="restaurants-form-input"
                      />
                    </div>

                    <div className="restaurants-form-group">
                      <label>Пароль</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={editFormData.password}
                          onChange={handleInputChange}
                          className="restaurants-form-input"
                          placeholder="Новый пароль (оставьте пустым)"
                        />
                        <button
                          type="button"
                          className="password-toggle-unified"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
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

                  <div className="restaurants-modal-right-column">
                    <div className="restaurants-logo-section-unified">
                      <label className="section-title">Логотип</label>
                      <div className="restaurants-modal-logo-container">
                        <div className="logo-preview-box">
                          {editFormData.logo_url ? (
                            <img src={editFormData.logo_url} alt="Logo" className="restaurants-modal-logo-preview" />
                          ) : (
                            <div className="restaurants-modal-logo-placeholder">
                              {(editFormData.companyName || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="logo-upload-actions">
                          <input
                            type="file"
                            id="logo-upload-file"
                            className="restaurant-logo-upload-input"
                            onChange={handleLogoUpload}
                            accept="image/*"
                          />
                          <label htmlFor="logo-upload-file" className="restaurants-upload-btn-unified">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Загрузить
                          </label>
                          {editFormData.logo_url && (
                            <button
                              className="restaurant-action-btn restaurant-delete-btn remove-logo-btn-fixed"
                              onClick={() => {
                                if (window.confirm('Вы уверены, что хотите удалить логотип?')) {
                                  setEditFormData(prev => ({ ...prev, logo_url: null }));
                                }
                              }}
                              title="Удалить логотип"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
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
          </div>,
          document.body
        )}

        {/* Таблица */}
        <div className="restaurants-table-container">
          <table className="restaurants-management-table">
            <thead>
              <tr>
                <th>Логотип</th>
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
                  className={`restaurant-row ${isVisible ? 'row-visible' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="restaurant-logo-cell">
                    <div className="restaurant-logo-wrapper">
                      {restaurant.logo_url || restaurant.avatar_url ? (
                        <img src={restaurant.logo_url || restaurant.avatar_url} alt="Logo" className="restaurant-logo-img" />
                      ) : (
                        <div className="restaurant-logo-placeholder">
                          {restaurant.company_name ? restaurant.company_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="restaurant-info-cell">
                    <div className="restaurant-main-info">
                      <strong>{restaurant.company_name || 'Без названия'}</strong>
                      <span>БИН: {restaurant.bin || 'Не указан'}</span>
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
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="restaurant-action-btn restaurant-delete-btn"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        title="Удалить"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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