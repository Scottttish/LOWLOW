// src/pages/AdminPanel/components/ProductsManagement/ProductsManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './ProductsManagement.css';

const ProductsManagement = () => {
  const { getAllProducts, users } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const sectionRef = useRef(null);

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
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = getAllProducts();
    setProducts(allProducts);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const companies = [...new Set(products.map(p => p.companyName).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.ingredients?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesCompany = filterCompany === 'all' || product.companyName === filterCompany;
    return matchesSearch && matchesCategory && matchesCompany;
  });

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      ingredients: product.ingredients || '',
      quantity: product.quantity || '',
      status: product.status || 'active'
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name || !editFormData.price || !editFormData.category) {
      alert('Название, цена и категория обязательны для заполнения');
      return;
    }

    try {
      // Получаем текущие продукты компании
      const companyProducts = JSON.parse(localStorage.getItem(`products_${editingProduct.companyId}`)) || [];
      
      // Обновляем продукт
      const updatedProducts = companyProducts.map(product => 
        product.id === editingProduct.id 
          ? { 
              ...product, 
              ...editFormData,
              price: parseInt(editFormData.price),
              quantity: editFormData.quantity ? parseInt(editFormData.quantity) : 0
            } 
          : product
      );
      
      // Сохраняем обновленные продукты
      localStorage.setItem(`products_${editingProduct.companyId}`, JSON.stringify(updatedProducts));
      
      // Обновляем состояние
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? { 
              ...product, 
              ...editFormData,
              price: parseInt(editFormData.price),
              quantity: editFormData.quantity ? parseInt(editFormData.quantity) : 0
            } 
          : product
      ));
      
      setEditingProduct(null);
      setEditFormData({});
      alert('Продукт успешно обновлен!');
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error);
      alert('Ошибка при сохранении изменений');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteProduct = (productId, companyId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        // Удаляем продукт из localStorage компании
        const companyProducts = JSON.parse(localStorage.getItem(`products_${companyId}`)) || [];
        const updatedProducts = companyProducts.filter(product => product.id !== productId);
        localStorage.setItem(`products_${companyId}`, JSON.stringify(updatedProducts));
        
        // Обновляем состояние
        setProducts(prev => prev.filter(product => product.id !== productId));
        alert('Продукт успешно удален!');
      } catch (error) {
        console.error('Ошибка при удалении продукта:', error);
        alert('Ошибка при удалении продукта');
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <div className="products-management-panel" ref={sectionRef}>
      <div className={`products-management-content ${isVisible ? 'products-content-visible' : ''}`}>
        
        {/* Заголовок и управление */}
        <div className="products-management-header">
          <h2 className="products-management-title">Управление продуктами</h2>
          <div className="products-management-controls">
            <div className="products-search-box">
              <input
                type="text"
                placeholder="Поиск продуктов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="products-search-input"
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="products-filter-select"
            >
              <option value="all">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select 
              value={filterCompany} 
              onChange={(e) => setFilterCompany(e.target.value)}
              className="products-filter-select"
            >
              <option value="all">Все компании</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Статистика */}
        <div className="products-stats-container">
          <div className="products-stat-card">
            <div className="products-stat-number">{filteredProducts.length}</div>
            <div className="products-stat-label">Всего продуктов</div>
          </div>
          <div className="products-stat-card">
            <div className="products-stat-number">{categories.length}</div>
            <div className="products-stat-label">Категорий</div>
          </div>
          <div className="products-stat-card">
            <div className="products-stat-number">{companies.length}</div>
            <div className="products-stat-label">Компаний</div>
          </div>
          <div className="products-stat-card">
            <div className="products-stat-number">
              {filteredProducts.filter(p => p.status !== 'inactive').length}
            </div>
            <div className="products-stat-label">Активных</div>
          </div>
        </div>

        {/* Модальное окно редактирования */}
        {editingProduct && (
          <div className="products-modal-overlay">
            <div className="products-modal-content">
              <div className="products-modal-header">
                <h3>Редактирование продукта</h3>
                <button className="products-modal-close" onClick={handleCancelEdit}>×</button>
              </div>
              
              <div className="products-modal-body">
                <div className="products-form-grid">
                  <div className="products-form-group">
                    <label>Название продукта *</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      className="products-form-input"
                      placeholder="Введите название продукта"
                    />
                  </div>
                  
                  <div className="products-form-group">
                    <label>Цена (₸) *</label>
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleInputChange}
                      className="products-form-input"
                      placeholder="Введите цену"
                      min="0"
                    />
                  </div>
                  
                  <div className="products-form-group">
                    <label>Категория *</label>
                    <select
                      name="category"
                      value={editFormData.category}
                      onChange={handleInputChange}
                      className="products-form-input products-select-input"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="products-form-group">
                    <label>Ингредиенты</label>
                    <textarea
                      name="ingredients"
                      value={editFormData.ingredients}
                      onChange={handleInputChange}
                      className="products-form-input products-textarea"
                      placeholder="Введите ингредиенты продукта..."
                      rows="2"
                    />
                  </div>
                  
                  <div className="products-form-group">
                    <label>Количество в наличии</label>
                    <input
                      type="number"
                      name="quantity"
                      value={editFormData.quantity}
                      onChange={handleInputChange}
                      className="products-form-input"
                      placeholder="Количество"
                      min="0"
                    />
                  </div>
                  
                  <div className="products-form-group">
                    <label>Статус</label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleInputChange}
                      className="products-form-input products-select-input"
                    >
                      <option value="active">Активный</option>
                      <option value="inactive">Неактивный</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="products-modal-actions">
                <button className="products-cancel-btn" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="products-save-btn" onClick={handleSaveEdit}>
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Сетка продуктов */}
        <div className="products-grid-container">
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className={`product-card-item ${product.status === 'inactive' ? 'product-inactive' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="product-image-container">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder">
                    📦
                  </div>
                )}
                {product.status === 'inactive' && (
                  <div className="product-inactive-badge">
                    Неактивен
                  </div>
                )}
              </div>
              
              <div className="product-content-wrapper">
                <div className="product-header-info">
                  <h3 className="product-name-title">{product.name}</h3>
                  <span className="product-category-badge">{product.category}</span>
                </div>
                
                {/* Ингредиенты показываются только если есть */}
                {product.ingredients && (
                  <p className="product-description-text">
                    {product.ingredients}
                  </p>
                )}
                
                <div className="product-company-info">
                  <span className="product-company-badge">
                    {product.companyName}
                  </span>
                </div>
                
                <div className="product-details-wrapper">
                  <div className="product-price-info">
                    <div className="product-current-price">{formatPrice(product.price)} ₸</div>
                  </div>
                  
                  <div className="product-meta-info">
                    {product.quantity !== undefined && (
                      <div className="product-quantity-info">
                        В наличии: {product.quantity}
                      </div>
                    )}
                    {product.createdAt && (
                      <div className="product-date-info">
                        Добавлен: {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Только кнопки Редактировать и Удалить */}
                <div className="product-actions-wrapper">
                  <button
                    className="product-action-btn product-edit-action-btn"
                    onClick={() => handleEditProduct(product)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="product-action-btn product-delete-action-btn"
                    onClick={() => handleDeleteProduct(product.id, product.companyId)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="products-no-data">
            <p>Продукты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsManagement;