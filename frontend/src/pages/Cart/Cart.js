import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

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

const ClearCartModal = ({ isOpen, onClose, onConfirm, restaurantName }) => {
  if (!isOpen) return null;

  return (
    <div className="clear-cart-modal-overlay">
      <div className="clear-cart-modal">
        <div className="clear-cart-modal-header">
          <h3>Очистить корзину</h3>
          <button className="clear-cart-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="clear-cart-modal-content">
          <div className="clear-cart-warning-icon">⚠️</div>
          <p>Вы уверены, что хотите очистить корзину ресторана <strong>"{restaurantName}"</strong>?</p>
          <p className="clear-cart-warning-text">Это действие нельзя отменить. Все товары из этого ресторана будут удалены из корзины.</p>
        </div>
        
        <div className="clear-cart-modal-actions">
          <button 
            className="clear-cart-cancel-btn"
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className="clear-cart-confirm-btn"
            onClick={onConfirm}
          >
            Очистить корзину
          </button>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user: currentUser, 
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout,
    getDefaultCard
  } = useAuth();
  
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [showCheckoutNotification, setShowCheckoutNotification] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [groupedByRestaurant, setGroupedByRestaurant] = useState({});
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultCard, setDefaultCard] = useState(null);
  
  const restaurantScrollRef = useRef(null);

  const isRegularUser = currentUser && currentUser.role === 'user';
  const shouldShowCart = isRegularUser && isVisible && !location.pathname.includes('/account') && !location.pathname.includes('/business-account');

  useEffect(() => {
    const grouped = {};
    cart.forEach(item => {
      const restaurantId = item.restaurantId;
      if (!grouped[restaurantId]) {
        grouped[restaurantId] = {
          name: item.restaurantName,
          id: restaurantId,
          items: [],
          total: 0,
          itemCount: 0
        };
      }
      grouped[restaurantId].items.push(item);
      grouped[restaurantId].total += item.price * item.quantity;
      grouped[restaurantId].itemCount += item.quantity;
    });
    
    setGroupedByRestaurant(grouped);
    
    if (Object.keys(grouped).length > 0 && !activeRestaurant) {
      const firstRestaurantId = Object.keys(grouped)[0];
      setActiveRestaurant(firstRestaurantId);
    }
  }, [cart]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') {
      setIsVisible(false);
      setIsInitialized(true);
      return;
    }

    if (location.pathname.includes('/account') || location.pathname.includes('/business-account')) {
      setIsVisible(false);
      setIsInitialized(true);
      return;
    }

    loadCart();
    loadDefaultCard();
    setIsInitialized(true);

    const handleStorageChange = (e) => {
      if (e.key === `cart_${currentUser.id}` || e.key === null) {
        loadCart();
      }
    };

    const handleCartUpdated = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('cartForceUpdate', handleCartUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('cartForceUpdate', handleCartUpdated);
    };
  }, [currentUser, location.pathname]);

  useEffect(() => {
    if (!isRegularUser) return;

    const interval = setInterval(() => {
      if (!location.pathname.includes('/account') && !location.pathname.includes('/business-account')) {
        loadCart();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isRegularUser, location.pathname]);

  const loadCart = async () => {
    try {
      if (!currentUser || !isRegularUser) return;
      
      const backendCart = await getCart();
      
      const processedCart = backendCart.map(item => ({
        ...item,
        image: item.image || '/default-product.jpg'
      }));
      
      setCart(processedCart);
      setIsVisible(processedCart.length > 0);
      
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      try {
        const savedCart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`)) || [];
        setCart(savedCart);
        setIsVisible(savedCart.length > 0);
      } catch (localError) {
        console.error('Ошибка загрузки из localStorage:', localError);
      }
    }
  };

  const loadDefaultCard = async () => {
    try {
      if (!currentUser) return;
      const card = await getDefaultCard();
      setDefaultCard(card);
    } catch (error) {
      console.error('Ошибка загрузки карты:', error);
    }
  };

  const getRestaurantCount = () => {
    const restaurantIds = [...new Set(cart.map(item => item.restaurantId))];
    return restaurantIds.length;
  };

  const getActiveRestaurantTotal = () => {
    if (!activeRestaurant) return 0;
    
    const restaurantItems = cart.filter(item => {
      const itemRestaurantId = String(item.restaurantId);
      const activeRestaurantId = String(activeRestaurant);
      return itemRestaurantId === activeRestaurantId;
    });
    return restaurantItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleImageError = (e) => {
    e.target.src = '/default-product.jpg';
    e.target.onerror = null;
  };

  const increaseQuantity = async (productId) => {
    if (!isRegularUser) return;
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const maxQuantity = item.originalQuantity || 10;
    const newQuantity = item.quantity + 1;

    if (newQuantity > maxQuantity) {
      showNotification(`Максимальное количество: ${maxQuantity}`, 'warning');
      return;
    }

    try {
      await updateCartItem(productId, newQuantity);
    } catch (error) {
      console.error('Ошибка увеличения количества:', error);
      showNotification('Ошибка обновления корзины', 'error');
    }
  };

  const decreaseQuantity = async (productId) => {
    if (!isRegularUser) return;
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const newQuantity = item.quantity - 1;

    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
      } else {
        await updateCartItem(productId, newQuantity);
      }
    } catch (error) {
      console.error('Ошибка уменьшения количества:', error);
      showNotification('Ошибка обновления корзины', 'error');
    }
  };

  const removeFromCartHandler = async (productId) => {
    if (!isRegularUser) return;
    
    try {
      await removeFromCart(productId);
      const product = cart.find(item => item.id === productId);
      if (product) {
        showNotification(`Удалено из корзины: ${product.name}`, 'info');
      }
    } catch (error) {
      console.error('Ошибка удаления из корзины:', error);
      showNotification('Ошибка удаления из корзины', 'error');
    }
  };

  const clearActiveRestaurantCart = () => {
    if (!isRegularUser || !activeRestaurant) return;
    setShowClearCartModal(true);
  };

  const handleConfirmClearCart = async () => {
    if (!isRegularUser || !activeRestaurant) return;
    
    try {
      await clearCart(parseInt(activeRestaurant));
      
      setShowClearCartModal(false);
      showNotification(`Корзина ресторана "${groupedByRestaurant[activeRestaurant]?.name}" очищена`, 'info');
      
      const remainingRestaurants = [...new Set(cart.map(item => item.restaurantId))];
      if (remainingRestaurants.length > 0) {
        setActiveRestaurant(String(remainingRestaurants[0]));
      } else {
        setActiveRestaurant(null);
        setIsCartOpen(false);
      }
    } catch (error) {
      console.error('Ошибка очистки корзины:', error);
      showNotification('Ошибка очистки корзины', 'error');
    }
  };

  const handleCancelClearCart = () => {
    setShowClearCartModal(false);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const handleCheckoutError = (error) => {
    console.error('Ошибка при оформлении заказа:', error);
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('Недостаточно средств')) {
      setShowPaymentError(true);
    } else {
      showNotification('Ошибка оформления заказа: ' + errorMessage, 'error');
    }
  };

  const handleCheckout = async () => {
    if (!isRegularUser) {
      showNotification('Только обычные пользователи могут оформлять заказы', 'warning');
      return;
    }
    
    if (cart.length === 0) {
      showNotification('Корзина пуста', 'warning');
      return;
    }

    if (!activeRestaurant) {
      showNotification('Ошибка: информация о ресторане не найдена', 'error');
      return;
    }
    
    setIsLoading(true);
    
    const restaurantItems = cart.filter(item => {
      const itemRestaurantId = String(item.restaurantId);
      const activeRestaurantId = String(activeRestaurant);
      return itemRestaurantId === activeRestaurantId;
    });
    
    if (restaurantItems.length === 0) {
      showNotification('Нет товаров из этого ресторана для оформления заказа', 'warning');
      setIsLoading(false);
      return;
    }
    
    try {
      if (!defaultCard) {
        showNotification('Добавьте карту для оплаты', 'warning');
        setShowCheckoutNotification(true);
        setIsLoading(false);
        return;
      }
      
      let deliveryAddress = currentUser.address || 'Адрес не указан';
      
      const checkoutData = {
        delivery_address: deliveryAddress,
        delivery_longitude: currentUser.longitude || null,
        delivery_latitude: currentUser.latitude || null,
        notes: `Заказ из ${groupedByRestaurant[activeRestaurant]?.name}`,
        card_id: defaultCard.id
      };
      
      const result = await checkout(checkoutData);
      
      if (result.success) {
        showNotification(`Заказ #${result.orders[0]?.order_number} успешно оформлен!`, 'success');
        
        setCart([]);
        localStorage.removeItem(`cart_${currentUser.id}`);
        
        setActiveRestaurant(null);
        setIsCartOpen(false);
        
        setTimeout(() => {
          navigate(`/restaurant/${activeRestaurant}`);
        }, 1500);
      }
      
    } catch (error) {
      handleCheckoutError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToRestaurant = () => {
    if (!activeRestaurant) return;
    setIsCartOpen(false);
    navigate(`/restaurant/${activeRestaurant}`);
  };

  const getActiveRestaurantItems = () => {
    if (!activeRestaurant) return [];
    
    const items = cart.filter(item => {
      const itemRestaurantId = String(item.restaurantId);
      const activeRestaurantId = String(activeRestaurant);
      return itemRestaurantId === activeRestaurantId;
    });
    
    return items;
  };

  const switchRestaurant = (restaurantId) => {
    setActiveRestaurant(restaurantId);
  };

  if (!shouldShowCart || !isInitialized) {
    return null;
  }

  const activeRestaurantItems = getActiveRestaurantItems();
  const restaurantCount = getRestaurantCount();
  const activeRestaurantTotal = getActiveRestaurantTotal();

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <ClearCartModal
        isOpen={showClearCartModal}
        onClose={handleCancelClearCart}
        onConfirm={handleConfirmClearCart}
        restaurantName={groupedByRestaurant[activeRestaurant]?.name || 'Ресторан'}
      />

      {showCheckoutNotification && (
        <div className="payment-error-overlay">
          <div className="payment-error-modal">
            <div className="payment-error-header">
              <h3>Карта не добавлена</h3>
              <button 
                className="close-error-btn"
                onClick={() => setShowCheckoutNotification(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="payment-error-content">
              <div className="error-details">
                <p>Для оформления заказа необходимо добавить карту для оплаты.</p>
                <p>Перейдите в раздел "Мои карты" в личном кабинете.</p>
              </div>
            </div>
            
            <div className="payment-error-actions">
              <button 
                className="cancel-error-btn"
                onClick={() => setShowCheckoutNotification(false)}
              >
                Отмена
              </button>
              <button 
                className="go-to-cards-btn"
                onClick={() => {
                  setShowCheckoutNotification(false);
                  navigate('/account?tab=cards');
                }}
              >
                Перейти в карты
              </button>
            </div>
          </div>
        </div>
      )}

      {!isCartOpen && (
        <div className="cart-floating-button">
          <button 
            className="cart-toggle-btn"
            onClick={() => setIsCartOpen(true)}
          >
            🛒 Корзина ({restaurantCount})
            <span className="cart-total-price">{getTotalPrice().toLocaleString()} ₸</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>
              Корзина
              {Object.keys(groupedByRestaurant).length > 0 && (
                <div className="cart-restaurants-names">
                  <div className="restaurant-names-scroll" ref={restaurantScrollRef}>
                    {Object.entries(groupedByRestaurant).map(([restaurantId, restaurantData]) => (
                      <button
                        key={restaurantId}
                        className={`restaurant-name-btn ${activeRestaurant === restaurantId ? 'active' : ''}`}
                        onClick={() => switchRestaurant(restaurantId)}
                      >
                        {restaurantData.name}
                        <span className="restaurant-badge">
                          {restaurantData.itemCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </h3>
            <div className="cart-header-actions">
              {cart.length > 0 && activeRestaurant && (
                <button 
                  className="clear-cart-btn"
                  onClick={clearActiveRestaurantCart}
                  title="Очистить корзину ресторана"
                >
                  🗑️
                </button>
              )}
              <button 
                className="close-cart-btn"
                onClick={() => setIsCartOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h4>Корзина пуста</h4>
                <p>Добавьте товары из меню ресторана</p>
              </div>
            ) : (
              <>
                {activeRestaurant && groupedByRestaurant[activeRestaurant] && (
                  <div className="restaurant-section">
                    <div className="restaurant-section-header">
                      <Link 
                        to={`/restaurant/${activeRestaurant}`}
                        className="menu-back-btn"
                        onClick={goToRestaurant}
                      >
                        ← Вернуться к меню
                      </Link>
                    </div>
                    
                    {activeRestaurantItems.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-image">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="cart-item-content">
                          <div className="cart-item-info">
                            <h4 className="cart-item-name">{item.name}</h4>
                            <p className="cart-item-price">{item.price.toLocaleString()} ₸</p>
                          </div>
                          
                          <div className="cart-item-controls">
                            <button
                              className="quantity-btn decrease"
                              onClick={() => decreaseQuantity(item.id)}
                              disabled={isLoading}
                            >
                              -
                            </button>
                            
                            <span className="cart-item-quantity">{item.quantity}</span>
                            
                            <button
                              className="quantity-btn increase"
                              onClick={() => increaseQuantity(item.id)}
                              disabled={item.quantity >= (item.originalQuantity || 10) || isLoading}
                            >
                              +
                            </button>
                            
                            <button
                              className="remove-btn"
                              onClick={() => removeFromCartHandler(item.id)}
                              title="Удалить из корзины"
                              disabled={isLoading}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {cart.length > 0 && activeRestaurant && activeRestaurantItems.length > 0 && (
            <div className="cart-footer">
              <div className="restaurant-checkout-info">
                <div className="restaurant-total">
                  <span>Итого:</span>
                  <span className="restaurant-total-price">{activeRestaurantTotal.toLocaleString()} ₸</span>
                </div>
                <div className="payment-info">
                  <div className="card-selection">
                    <span>Карта для оплаты:</span>
                    <span className="selected-card">
                      {defaultCard ? `•••• ${defaultCard.card_last4}` : 'Не выбрана'}
                    </span>
                  </div>
                  {!defaultCard && (
                    <div className="no-card-warning">
                      ⚠️ Добавьте карту в разделе "Мои карты"
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={!defaultCard || isLoading}
              >
                {isLoading ? 'Оформление...' : `Оформить заказ из ${groupedByRestaurant[activeRestaurant]?.name}`}
              </button>
            </div>
          )}
        </div>
      )}

      {showPaymentError && (
        <div className="payment-error-overlay">
          <div className="payment-error-modal">
            <div className="payment-error-header">
              <h3>Недостаточно средств</h3>
              <button 
                className="close-error-btn"
                onClick={() => setShowPaymentError(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="payment-error-content">
              <div className="error-details">
                <p>На вашей карте недостаточно средств для оплаты заказа.</p>
                <p>Пополните баланс карты или выберите другую карту.</p>
              </div>
            </div>
            
            <div className="payment-error-actions">
              <button 
                className="cancel-error-btn"
                onClick={() => setShowPaymentError(false)}
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div 
          className="cart-overlay"
          onClick={() => setIsCartOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Cart;