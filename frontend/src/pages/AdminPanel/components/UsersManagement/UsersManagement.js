// src/pages/AdminPanel/components/UsersManagement/UsersManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './UsersManagement.css';

const UsersManagement = () => {
  const { getAllUsers, adminUpdateUser, adminDeleteUser, adminCreateUser, user: currentUser } = useAuth();
  // Добавляем локальный стейт для users
  const [users, setUsers] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
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

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      if (data) {
        setUsers(data);
        // Show users with roles 'user', 'business', 'admin'.
        // Hide explicitly only the current user
        const customerUsers = data.filter(u =>
          ['user', 'business', 'admin'].includes(u.role) && u.id !== currentUser?.id
        );
        setLocalUsers(customerUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Real-time refresh every 15 seconds
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const filteredUsers = localUsers.filter(user => {
    const matchesSearch = user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive !== false) ||
      (statusFilter === 'inactive' && user.isActive === false);

    return matchesSearch && matchesStatus;
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      nickname: user.name || user.nickname || '', // Map name to nickname field if needed
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      password: ''
    });
    setShowPassword(false);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editFormData,
        name: editFormData.nickname
      };

      if (!updateData.password) delete updateData.password;

      if (isCreateModalOpen) {
        await adminCreateUser(updateData);
        setIsCreateModalOpen(false);
      } else {
        await adminUpdateUser(editingUser.id, updateData);
        setEditingUser(null);
      }

      // Reload users immediately
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
    setEditFormData({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      city: cities[0],
      role: 'user',
      isActive: true,
      password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsCreateModalOpen(false);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleDeleteUser = async (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await adminDeleteUser(userId);
        // Reload users to show updated list immediately
        const data = await getAllUsers();
        if (data) {
          setUsers(data);
          const customerUsers = data.filter(u => u.role === 'user' && u.id !== currentUser?.id);
          setLocalUsers(customerUsers);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  return (
    <div className="users-management-panel" ref={sectionRef}>
      <div className={`users-management-content ${isVisible ? 'users-content-visible' : ''}`}>

        <div className="users-management-header">
          <h2 className="users-management-title">Управление пользователями</h2>
          <div className="users-management-controls">
            <div className="users-search-box">
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="users-search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="users-filter-select"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
            <button className="users-create-btn" onClick={handleCreateUser}>
              + Создать пользователя
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="users-stats-container">
          <div className="users-stat-card">
            <div className="users-stat-number">{filteredUsers.length}</div>
            <div className="users-stat-label">Всего пользователей</div>
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

        {/* Модальное окно редактирования/создания */}
        {(editingUser || isCreateModalOpen) && createPortal(
          <div className="users-modal-overlay">
            <div className="users-modal-content users-management-modal">
              <div className="users-modal-header">
                <h3>{isCreateModalOpen ? 'Создание пользователя' : 'Редактирование пользователя'}</h3>
                <button className="users-modal-close" onClick={handleCancelEdit}>×</button>
              </div>

              <div className="users-modal-body">
                <div className="users-form-grid">
                  <div className="users-form-group">
                    <label>Никнейм *</label>
                    <input
                      type="text"
                      name="nickname"
                      value={editFormData.nickname}
                      onChange={handleInputChange}
                      className="users-form-input"
                    />
                  </div>

                  <div className="users-form-group">
                    <label>Роль *</label>
                    <select
                      name="role"
                      value={editFormData.role || 'user'}
                      onChange={handleInputChange}
                      className="users-form-input users-select-input"
                    >
                      <option value="user">Покупатель</option>
                      <option value="business">Бизнес</option>
                      <option value="admin">Админ</option>
                    </select>
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
                    <label>Пароль *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={editFormData.password || ''}
                        onChange={handleInputChange}
                        className="users-form-input"
                        placeholder={isCreateModalOpen ? "Введите пароль" : "Оставьте пустым, если не меняете"}
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

                  <div className="users-form-group">
                    <label>Телефон</label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      className="users-form-input"
                      maxLength={15}
                      placeholder="+7 (___) ___ __ __"
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

                {/* Статус удален по запросу */}
              </div>

              <div className="users-modal-actions">
                <button className="users-cancel-btn" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="users-save-btn" onClick={handleSaveEdit}>
                  {isCreateModalOpen ? 'Создать пользователя' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Таблица */}
        <div className="users-table-container">
          <table className="users-management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Никнейм и Роль</th>
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
                  className={`user-row ${isVisible ? 'row-visible' : ''} ${user.isActive === false ? 'user-row-inactive' : ''}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="user-id-cell">#{user.id}</td>
                  <td className="user-info-cell">
                    <div className="user-main-info">
                      <strong>{user.name || user.nickname || 'Без никнейма'}</strong>
                      <span className="user-role-text">
                        {user.role === 'admin' ? 'Админ' : user.role === 'business' ? 'Бизнес' : 'Пользователь'}
                      </span>
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
                    <span className={`user-date-badge ${(user.created_at || user.createdAt) ? 'date-specified' : 'date-unspecified'}`}>
                      {(user.created_at || user.createdAt) ? new Date(user.created_at || user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
                    </span>
                  </td>
                  <td className="user-actions-cell">
                    <div className="user-actions-wrapper">
                      <button
                        className="user-action-btn user-edit-btn"
                        onClick={() => handleEditUser(user)}
                        title="Редактировать"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="user-action-btn user-delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
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

          {filteredUsers.length === 0 && (
            <div className="users-no-data">
              <p>Пользователи не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;