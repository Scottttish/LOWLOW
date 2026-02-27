import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../../context/AuthContext';
import './ProductsManagement.css';

const ProductsManagement = () => {
  const { getAllProducts, adminUpdateProduct, adminDeleteProduct, adminCreateProduct, getAllUsers } = useAuth();
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [isVisible, setIsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [customCategory, setCustomCategory] = useState('');
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
    loadRestaurants();

    // Real-time refresh every 15 seconds
    const interval = setInterval(() => {
      loadProducts();
      // No need to poll restaurants as often, but let's keep it simple
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadRestaurants = async () => {
    try {
      const allUsers = await getAllUsers();
      if (allUsers) {
        const businessUsers = allUsers.filter(u => u.role === 'business' || u.role === 'buisness');
        setRestaurants(businessUsers);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('🔍 AdminPanel: Fetching products from admin API...');
      const allProducts = await getAllProducts();
      console.log('✅ AdminPanel: Products received:', {
        count: allProducts?.length || 0,
        products: allProducts
      });

      if (!allProducts || allProducts.length === 0) {
        console.warn('⚠️ AdminPanel: No products found in database');
      }

      setProducts(allProducts || []);
    } catch (error) {
      console.error('❌ AdminPanel: Failed to load products:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      setProducts([]);
      // Show user-friendly error
      alert(`Ошибка загрузки продуктов: ${error.message}\n\nПожалуйста, проверьте:\n1. Запущен ли backend сервер\n2. Есть ли продукты в таблице dishes\n3. Консоль браузера для деталей (F12)`);
    }
  };

  const productCategories = [
    "Бургеры",
    "Роллы",
    "Пицца",
    "Суши",
    "Основные блюда",
    "Закуски",
    "Салаты",
    "Супы",
    "Десерты",
    "Напитки",
    "Гарниры",
    "Другое..."
  ];

  const categories = [...new Set([...productCategories, ...products.map(p => p.category).filter(Boolean)])];
  // Support both snake_case (backend) and camelCase (frontend legacy) for company name
  const companies = [...new Set(products.map(p => p.company_name || p.companyName).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const productName = product.name || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.ingredients && product.ingredients.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;

    const prodCompanyName = product.company_name || product.companyName;
    const matchesCompany = filterCompany === 'all' || prodCompanyName === filterCompany;

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
    try {
      const productData = {
        ...editFormData,
        price: parseFloat(editFormData.price),
        quantity: editFormData.quantity ? parseInt(editFormData.quantity) : 0,
        restaurant_id: editFormData.restaurant_id,
        category: editFormData.category === 'Другое...' ? customCategory : editFormData.category
      };

      if (isCreateModalOpen) {
        if (!productData.restaurant_id) {
          // Fallback to first restaurant if not selected
          productData.restaurant_id = restaurants[0]?.id;
        }
        await adminCreateProduct(productData);
        setIsCreateModalOpen(false);
      } else {
        await adminUpdateProduct(editingProduct.article, productData);
        setEditingProduct(null);
      }

      // Refresh data
      loadProducts();
      setEditFormData({});
      setCustomCategory('');
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    }
  };

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true);
    setEditFormData({
      name: '',
      price: '',
      category: productCategories[0],
      ingredients: '',
      quantity: '',
      status: 'active',
      restaurant_id: restaurants[0]?.id || ''
    });
    setCustomCategory('');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
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

  const handleDeleteProduct = async (productArticle) => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await adminDeleteProduct(productArticle);
        setProducts(prev => prev.filter(product => product.article !== productArticle));
      } catch (error) {
        console.error('Ошибка при удалении продукта:', error);
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
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="products-filter-select"
            >
              <option value="all">Все компании</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <button className="products-create-btn" onClick={handleCreateProduct}>
              + Создать продукт
            </button>
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

        {(editingProduct || isCreateModalOpen) && createPortal(
          <div className="products-modal-overlay">
            <div className="products-modal-content">
              <div className="products-modal-header">
                <h3>{isCreateModalOpen ? 'Создание продукта' : 'Редактирование продукта'}</h3>
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

                  {editFormData.category === 'Другое...' && (
                    <div className="products-form-group">
                      <label>Своя категория *</label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="products-form-input"
                        placeholder="Введите название категории"
                      />
                    </div>
                  )}

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

                  <div className="products-form-group">
                    <label>Заведение *</label>
                    <select
                      name="restaurant_id"
                      value={editFormData.restaurant_id}
                      onChange={handleInputChange}
                      className="products-form-input products-select-input"
                    >
                      <option value="">Выберите заведение</option>
                      {restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.company_name || restaurant.companyName}
                        </option>
                      ))}
                    </select>
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

                  <div className="products-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Ингредиенты</label>
                    <textarea
                      name="ingredients"
                      value={editFormData.ingredients}
                      onChange={handleInputChange}
                      className="products-form-input products-textarea"
                      placeholder="Введите ингредиенты продукта..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="products-modal-actions">
                <button className="products-cancel-btn" onClick={handleCancelEdit}>
                  Отмена
                </button>
                <button className="products-save-btn" onClick={handleSaveEdit}>
                  {isCreateModalOpen ? 'Создать продукт' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Сетка продуктов */}
        <div className="products-grid-container">
          {filteredProducts.map((product, index) => (
            <div
              key={product.article}
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
                    {product.company_name || product.companyName}
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
                    {product.updated_at && (
                      <div className="product-date-info">
                        Обновлен: {new Date(product.updated_at).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="product-actions-wrapper">
                  <button
                    className="product-action-btn product-edit-action-btn"
                    onClick={() => handleEditProduct(product)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="product-action-btn product-delete-action-btn"
                    onClick={() => handleDeleteProduct(product.article)}
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