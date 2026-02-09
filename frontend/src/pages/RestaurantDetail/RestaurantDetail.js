import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './RestaurantDetail.css';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, addToCart, getRestaurantDishes } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const isRestaurantOwner = currentUser && restaurant && currentUser.id === restaurant.user_id;
  const isBusinessUser = currentUser && currentUser.role === 'business';
  const isRegularUser = currentUser && currentUser.role === 'user';
  const canAddToCart = isRegularUser && !isRestaurantOwner;

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/restaurants');
      return;
    }
    
    loadRestaurantData();
  }, [id, currentUser, navigate]);

  useEffect(() => {
    if (restaurant) {
      loadProducts();
    }
  }, [restaurant]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log(`Загрузка ресторана ID: ${id}`);
      
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.restaurant) {
          console.log('Получен ресторан:', data.restaurant);
          const formattedRestaurant = {
            id: data.restaurant.id,
            user_id: data.restaurant.user_id,
            name: data.restaurant.name || data.restaurant.company_name,
            email: data.restaurant.email,
            phone: data.restaurant.phone,
            role: data.restaurant.role,
            city: data.restaurant.city,
            address: data.restaurant.address,
            avatar: data.restaurant.avatar_url || null,
            companyName: data.restaurant.company_name,
            is_active: data.restaurant.is_active,
            longitude: data.restaurant.longitude,
            latitude: data.restaurant.latitude,
            created_at: data.restaurant.created_at,
            updated_at: data.restaurant.updated_at
          };
          setRestaurant(formattedRestaurant);
        } else {
          console.log('Ресторан не найден в ответе');
          navigate('/restaurants');
        }
      } else {
        console.error(`HTTP ошибка: ${response.status}`);
        navigate('/restaurants');
      }
    } catch (error) {
      console.error('Ошибка загрузки ресторана:', error);
      navigate('/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('Загрузка продуктов для ресторана ID:', id);
      
      const dishes = await getRestaurantDishes(id);
      console.log('Полученные продукты с сервера:', dishes);
      
      if (dishes && Array.isArray(dishes)) {
        // Преобразуем данные из базы в формат для фронта
        const processedProducts = dishes.map(dish => ({
          id: dish.article,
          article: dish.article,
          name: dish.name,
          price: parseFloat(dish.price) || 0,
          quantity: dish.quantity || 0,
          composition: dish.composition || '',
          category_id: dish.category_id,
          category: dish.category_name || 'Без категории',
          image: dish.image_url || dish.image || '/default-product.jpg',
          ingredients: dish.ingredients || '',
          status: dish.status || 'active',
          restaurant_id: dish.restaurant_id
        }));
        
        console.log('Обработанные продукты:', processedProducts);
        setProducts(processedProducts);
        setFilteredProducts(processedProducts);
      } else {
        console.log('Нет продуктов или неверный формат данных');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки продуктов:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.ingredients && product.ingredients.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  const handleImageError = (e) => {
    e.target.src = '/default-product.jpg';
    e.target.onerror = null;
  };

  const handleAddToCart = async (product) => {
    if (!canAddToCart) {
      if (isRestaurantOwner) {
        showNotification('Владельцы ресторана не могут добавлять товары в корзину', 'warning');
      } else if (isBusinessUser) {
        showNotification('Компании не могут делать заказы в других ресторанах', 'warning');
      }
      return;
    }

    if (product.quantity === 0) {
      showNotification('Товар закончился', 'warning');
      return;
    }

    try {
      const productToAdd = {
        ...product,
        article: product.article || product.id
      };
      
      const result = await addToCart(productToAdd, restaurant);
      
      if (result.success) {
        showNotification(result.message, 'success');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        showNotification(result.message, 'warning');
      }
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      showNotification('Ошибка добавления в корзину', 'error');
    }
  };

  const getAddToCartButtonText = (product) => {
    if (isRestaurantOwner) {
      return 'Ваш продукт';
    } else if (isBusinessUser) {
      return 'Только просмотр';
    } else if (product.quantity === 0) {
      return 'Нет в наличии';
    } else {
      return 'В корзину';
    }
  };

  const getAddToCartButtonClass = (product) => {
    if (isRestaurantOwner || isBusinessUser || product.quantity === 0) {
      return 'add-to-cart-btn disabled';
    }
    return 'add-to-cart-btn';
  };

  if (loading) {
    return (
      <div className="restaurant-detail-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка ресторана...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-not-found">
        <h2>Ресторан не найден</h2>
        <button onClick={() => navigate('/restaurants')}>
          Вернуться к ресторанам
        </button>
      </div>
    );
  }

  return (
    <div className="restaurant-detail">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="restaurant-header-simple">
        <div className="restaurant-info-simple">
          <div className="restaurant-avatar-simple">
            {restaurant.avatar ? (
              <img src={restaurant.avatar} alt={restaurant.companyName} />
            ) : (
              <div className="avatar-placeholder-simple">
                {restaurant.companyName?.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="restaurant-details-simple">
            <h1 className="restaurant-title-simple">{restaurant.companyName}</h1>
            {isRestaurantOwner && (
              <div className="owner-badge-simple">
                🔧 Это ваш ресторан
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="restaurant-content">
        <div className="categories-nav">
          <div className="categories-scroll">
            {['all', 'Бургеры', 'Пицца', 'Закуски', 'Десерты', 'Супы', 'Салаты', 'Напитки', 'Другое'].map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Все' : category}
              </button>
            ))}
          </div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Поиск продуктов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="products-section">
          <h2 className="products-title">Меню</h2>
          
          {productsLoading ? (
            <div className="products-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка меню...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <div className="no-products-icon">🍽️</div>
              <h3>Продукты не найдены</h3>
              <p>
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Попробуйте изменить поисковый запрос или выбрать другую категорию'
                  : 'В этом ресторане пока нет доступных продуктов'
                }
              </p>
              {isRestaurantOwner && (
                <button 
                  className="add-products-btn"
                  onClick={() => navigate('/business-account?section=products')}
                >
                  📝 Добавить продукты в бизнес-панели
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.article || product.id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onError={handleImageError}
                    />
                    {product.quantity !== undefined && product.quantity > 0 && (
                      <div className="quantity-badge">
                        В наличии: {product.quantity}
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    
                    {product.ingredients && (
                      <p className="product-ingredients">
                        {product.ingredients}
                      </p>
                    )}
                    
                    <div className="product-footer">
                      <div className="product-price">
                        {product.price.toLocaleString()} ₸
                      </div>
                      <div className="product-actions">
                        <button
                          className={getAddToCartButtonClass(product)}
                          onClick={() => handleAddToCart(product)}
                          disabled={!canAddToCart || product.quantity === 0}
                        >
                          {getAddToCartButtonText(product)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;