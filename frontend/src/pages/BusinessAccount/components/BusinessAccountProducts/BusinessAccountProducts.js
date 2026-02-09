// frontend/src/pages/BusinessAccount/components/BusinessAccountProducts/BusinessAccountProducts.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BusinessAccountProducts.css';

const BusinessAccountProducts = () => {
  const { user, getBusinessProducts, addBusinessProduct, updateBusinessProduct, deleteBusinessProduct } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Пицца', 'Бургеры', 'Суши', 'Салаты', 'Напитки', 'Десерты']);
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    inactive_products: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    ingredients: '',
    quantity: '0',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    if (user && user.role === 'business') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем продукты
      const productsData = await getBusinessProducts();
      setProducts(productsData || []);
      
      // Вычисляем статистику
      const totalProducts = productsData?.length || 0;
      const activeProducts = productsData?.filter(p => p.is_active === true || p.status === 'active').length || 0;
      const inactiveProducts = totalProducts - activeProducts;
      
      setStats({
        total_products: totalProducts,
        active_products: activeProducts,
        inactive_products: inactiveProducts
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name === 'is_active' ? value === 'true' : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewProduct(prev => ({
        ...prev,
        image_url: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      price: '',
      category: '',
      ingredients: '',
      quantity: '0',
      image_url: '',
      is_active: true
    });
    setEditingProduct(null);
    setShowAddForm(false);
    setIsSubmitting(false);
  };

  const validateProduct = () => {
    if (!newProduct.name.trim()) {
      alert('Введите название продукта');
      return false;
    }
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      alert('Введите корректную цену');
      return false;
    }
    
    if (!newProduct.category) {
      alert('Выберите категорию');
      return false;
    }
    
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateProduct() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const productData = {
        name: newProduct.name.trim(),
        price: newProduct.price,
        category: newProduct.category,
        ingredients: newProduct.ingredients || '',
        quantity: newProduct.quantity,
        image_url: newProduct.image_url || '',
        is_active: newProduct.is_active
      };

      console.log('📝 Сохранение продукта:', {
        editing: !!editingProduct,
        article: editingProduct?.article,
        data: productData
      });

      let result;
      if (editingProduct) {
        result = await updateBusinessProduct(editingProduct.article, productData);
        setProducts(products.map(p => p.article === editingProduct.article ? result : p));
      } else {
        result = await addBusinessProduct(productData);
        setProducts([...products, result]);
      }

      resetForm();
      await loadData(); // Перезагружаем данные, чтобы обновить статистику
      alert('Продукт успешно сохранен!');
      
    } catch (error) {
      console.error('❌ Ошибка сохранения продукта:', error);
      alert(error.message || 'Ошибка сохранения продукта');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price?.toString() || '',
      category: product.category || '',
      ingredients: product.ingredients || '',
      quantity: product.quantity?.toString() || '0',
      image_url: product.image_url || product.image || '',
      is_active: product.is_active !== undefined ? product.is_active : (product.status === 'active')
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (article) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await deleteBusinessProduct(article);
        setProducts(products.filter(p => p.article !== article));
        await loadData(); // Перезагружаем данные, чтобы обновить статистику
        alert('Продукт удален!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message || 'Ошибка удаления продукта');
      }
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      console.log('🔄 Изменение статуса продукта:', {
        article: product.article,
        name: product.name,
        currentStatus: product.is_active !== undefined ? product.is_active : product.status === 'active'
      });

      const currentIsActive = product.is_active !== undefined ? product.is_active : product.status === 'active';
      const newIsActive = !currentIsActive;
      
      const productData = {
        name: product.name,
        price: product.price,
        category: product.category || '',
        ingredients: product.ingredients || '',
        quantity: product.quantity || 0,
        image_url: product.image_url || product.image || '',
        is_active: newIsActive
      };

      console.log('📤 Отправка данных для обновления статуса:', productData);

      const updatedProduct = await updateBusinessProduct(product.article, productData);
      
      console.log('✅ Продукт обновлен:', updatedProduct);
      
      // Обновляем список продуктов
      setProducts(products.map(p => p.article === product.article ? updatedProduct : p));
      
      // Обновляем локальную статистику
      const updatedProducts = products.map(p => 
        p.article === product.article ? { ...p, is_active: newIsActive } : p
      );
      
      const activeProducts = updatedProducts.filter(p => p.is_active !== undefined ? p.is_active : p.status === 'active').length;
      const inactiveProducts = updatedProducts.length - activeProducts;
      
      setStats({
        total_products: updatedProducts.length,
        active_products: activeProducts,
        inactive_products: inactiveProducts
      });
      
    } catch (error) {
      console.error('❌ Ошибка обновления статуса продукта:', error);
      alert(error.message || 'Ошибка изменения статуса');
    }
  };

  if (loading) {
    return (
      <div className="business-account-section">
        <div className="section-header">
          <h2 className="section-title">Мои продукты</h2>
        </div>
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'business') {
    return (
      <div className="business-account-section">
        <div className="section-header">
          <h2 className="section-title">Мои продукты</h2>
        </div>
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
        <h2 className="section-title">Мои продукты</h2>
      </div>
      
      {/* Статистика */}
      <div className="products-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total_products}</div>
          <div className="stat-label">Всего продуктов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active_products}</div>
          <div className="stat-label">Активные</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inactive_products}</div>
          <div className="stat-label">Неактивные</div>
        </div>
      </div>

      {/* Модальное окно */}
      {showAddForm && (
        <div className="product-form-overlay">
          <div className="product-form">
            <div className="form-header">
              <h3>{editingProduct ? 'Редактировать продукт' : 'Добавить новый продукт'}</h3>
              <button className="close-form" onClick={resetForm}>×</button>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Фото продукта</label>
                <div 
                  className="image-upload-container"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newProduct.image_url ? (
                    <img src={newProduct.image_url} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="image-placeholder">
                      <span>+</span>
                      <p>Добавить фото</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Название продукта *</label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите название продукта"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Цена (₸) *</label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Введите цену"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Категория *</label>
                <select
                  name="category"
                  value={newProduct.category}
                  onChange={handleInputChange}
                  className="form-input select-input"
                  disabled={isSubmitting}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Ингредиенты</label>
                <textarea
                  name="ingredients"
                  value={newProduct.ingredients}
                  onChange={handleInputChange}
                  className="form-input textarea"
                  placeholder="Перечислите ингредиенты..."
                  rows="3"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Количество в наличии</label>
                <input
                  type="number"
                  name="quantity"
                  value={newProduct.quantity}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Количество"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Статус</label>
                <select
                  name="is_active"
                  value={newProduct.is_active}
                  onChange={handleInputChange}
                  className="form-input select-input"
                  disabled={isSubmitting}
                >
                  <option value="true">Активный</option>
                  <option value="false">Неактивный</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={resetForm} disabled={isSubmitting}>
                Отмена
              </button>
              <button 
                className="save-btn" 
                onClick={handleSaveProduct}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : (editingProduct ? 'Сохранить изменения' : 'Добавить продукт')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="products-grid">
        <div className="add-product-card-fixed">
          <button 
            className="add-product-btn-fixed"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            <span className="add-icon-fixed">+</span>
            <span>Добавить новый продукт</span>
          </button>
        </div>
        
        {products.map(product => {
          const isActive = product.is_active !== undefined ? product.is_active : product.status === 'active';
          
          return (
            <div key={product.article} className="product-card">
              <div className="product-header">
                <div className="product-image">
                  {product.image_url || product.image ? (
                    <img src={product.image_url || product.image} alt={product.name} className="product-image-preview" />
                  ) : (
                    <span className="product-emoji">🍽️</span>
                  )}
                </div>
                <div className="product-actions">
                  <button 
                    className="action-btn edit" 
                    title="Редактировать"
                    onClick={() => handleEditProduct(product)}
                    disabled={loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn delete" 
                    title="Удалить"
                    onClick={() => handleDeleteProduct(product.article)}
                    disabled={loading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">
                  {product.category || 'Без категории'}
                </p>
                {product.ingredients && (
                  <p className="product-ingredients">
                    Ингредиенты: {product.ingredients}
                  </p>
                )}
                <div className="product-details">
                  <p className="product-price">{product.price ? product.price.toLocaleString() : '0'} ₸</p>
                  <p className="product-quantity">В наличии: {product.quantity || 0}</p>
                </div>
                <div className="product-footer">
                  <span className={`product-status ${isActive ? 'active' : 'inactive'}`}>
                    {isActive ? 'Активный' : 'Неактивный'}
                  </span>
                  <button 
                    className={`status-toggle ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(product)}
                    disabled={loading}
                  >
                    {isActive ? 'Деактивировать' : 'Активировать'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {products.length === 0 && !showAddForm && (
          <div className="empty-products">
            <div className="empty-icon">🍽️</div>
            <h3>Продуктов пока нет</h3>
            <p>Нажмите на кнопку выше чтобы добавить первый продукт</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAccountProducts;