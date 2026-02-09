// src/pages/AdminPanel/components/UsersManagement/UsersManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './UsersManagement.css';

const UsersManagement = () => {
  const { users, updateUser, deleteUser, updateUserAvatar } = useAuth();
  const [localUsers, setLocalUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const sectionRef = useRef(null);

  // Список городов для выпадающего списка
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
    // Фильтруем только покупателей (role === 'user')
    const customerUsers = users.filter(user => user.role === 'user');
    setLocalUsers(customerUsers);
  }, [users]);

  const filteredUsers = localUsers.filter(user => {
    const matchesSearch = user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      nickname: user.nickname || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.nickname || !editFormData.email) {
      alert('Имя и email обязательны для заполнения');
      return;
    }

    try {
      await updateUser(editingUser.id, editFormData);
      setLocalUsers(prev => prev.map(user => 
        user.id === editingUser.id ? { ...user, ...editFormData } : user
      ));
      setEditingUser(null);
      setEditFormData({});
      alert('Изменения сохранены успешно!');
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (userId, file) => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target.result;
        updateUserAvatar(userId, avatarUrl);
        setLocalUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, avatar: avatarUrl } : user
        ));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка при загрузке аватара:', error);
      alert('Ошибка при загрузке аватара');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await deleteUser(userId);
        setLocalUsers(prev => prev.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
      }
    }
  };

  return (
    <div className="users-management-panel" ref={sectionRef}>
      <div className={`users-management-content ${isVisible ? 'users-content-visible' : ''}`}>
        
        {/* Заголовок и управление */}
        <div className="users-management-header">
          <h2 className="users-management-title">Управление покупателями</h2>
          <div className="users-management-controls">
            <div className="users-search-box">
              <input
                type="text"
                placeholder="Поиск покупателей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="users-search-input"
              />
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="users-stats-container">
          <div className="users-stat-card">
            <div className="users-stat-number">{filteredUsers.length}</div>
            <div className="users-stat-label">Всего покупателей</div>
          </div>
          <div className="users-stat-card">
            <div className="users-stat-number">
              {filteredUsers.filter(u => u.isActive !== false).length}
            </div>
            <div className="users-stat-label">Активных</div>
          </div>
          <div className="users-stat-card">
            <div className="users-stat-number">
              {filteredUsers.filter(u => u.isActive === false).length}
            </div>
            <div className="users-stat-label">Неактивных</div>
          </div>
        </div>

        {/* Модальное окно редактирования */}
        {editingUser && (
          <div className="users-modal-overlay">
            <div className="users-modal-content">
              <div className="users-modal-header">
                <h3>Редактирование покупателя</h3>
                <button className="users-modal-close" onClick={handleCancelEdit}>×</button>
              </div>
              
              <div className="users-modal-body">
                <div className="users-form-grid">
                  <div className="users-form-group">
                    <label>Имя *</label>
                    <input
                      type="text"
                      name="nickname"
                      value={editFormData.nickname}
                      onChange={handleInputChange}
                      className="users-form-input"
                    />
                  </div>
                  
                  <div className="users-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="users-form-input"
                    />
                  </div>
                  
                  <div className="users-form-group">
                    <label>Телефон</label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      className="users-form-input"
                    />
                  </div>
                  
                  <div className="users-form-group">
                    <label>Город</label>
                    <select
                      name="city"
                      value={editFormData.city}
                      onChange={handleInputChange}
                      className="users-form-input users-select-input"
                    >
                      <option value="">Выберите город</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="users-modal-actions">
                <button className="users-cancel-btn" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="users-save-btn" onClick={handleSaveEdit}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Таблица */}
        <div className="users-table-container">
          <table className="users-management-table">
            <thead>
              <tr>
                <th>Аватар</th>
                <th>Пользователь</th>
                <th>Контактные данные</th>
                <th>Статус</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={user.isActive === false ? 'user-row-inactive' : ''}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <td className="user-avatar-cell">
                    <div className="user-avatar-wrapper">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="user-avatar-image" />
                      ) : (
                        <div className="user-avatar-default">
                          {user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(user.id, e.target.files[0])}
                        className="user-avatar-upload"
                        id={`user-avatar-${user.id}`}
                      />
                      <label 
                        htmlFor={`user-avatar-${user.id}`} 
                        className="user-avatar-upload-label"
                        title="Сменить аватар"
                      >
                        📷
                      </label>
                    </div>
                  </td>
                  <td className="user-info-cell">
                    <div className="user-main-info">
                      <strong>{user.nickname || 'Без имени'}</strong>
                      <span>{user.city || 'Город не указан'}</span>
                    </div>
                  </td>
                  <td className="user-contact-cell">
                    <div className="user-email">{user.email}</div>
                    {user.phone && <div className="user-phone">{user.phone}</div>}
                  </td>
                  <td className="user-status-cell">
                    <span className={`user-status-badge ${user.isActive === false ? 'user-status-inactive' : 'user-status-active'}`}>
                      {user.isActive === false ? 'Неактивен' : 'Активен'}
                    </span>
                  </td>
                  <td className="user-date-cell">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
                  </td>
                  <td className="user-actions-cell">
                    <div className="user-actions-wrapper">
                      <button
                        className="user-action-btn user-edit-btn"
                        onClick={() => handleEditUser(user)}
                        title="Редактировать"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="user-action-btn user-delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
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
          
          {filteredUsers.length === 0 && (
            <div className="users-no-data">
              <p>Покупатели не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;