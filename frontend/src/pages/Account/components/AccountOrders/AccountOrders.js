import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../../../context/AccountContext';
import './AccountOrders.css';

const AccountOrders = () => {
  const navigate = useNavigate();
  const { orders, refreshOrders } = useAccount();
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        await refreshOrders();
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    if (orders) {
      const sortedOrders = orders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setUserOrders(sortedOrders);
    }
  }, [orders]);

  const handleBrowseProducts = () => {
    navigate('/restaurants');
  };

  const getStatusText = (status) => {
    if (!status) return 'Неизвестно';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'delivered': 
      case 'paid': return 'Завершен';
      case 'pending': return 'В обработке';
      case 'cancelled': return 'Отменен';
      case 'processing': return 'Готовится';
      case 'ready': return 'Готов к выдаче';
      case 'on_delivery': return 'В пути';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#6c757d';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'delivered':
      case 'paid': return '#4CAF50';
      case 'pending': return '#ffa726';
      case 'cancelled': return '#f44336';
      case 'processing': return '#2196F3';
      case 'ready': return '#9C27B0';
      case 'on_delivery': return '#FF9800';
      default: return '#6c757d';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { date: 'N/A', time: 'N/A' };
      }
      
      return {
        date: date.toLocaleDateString('ru-RU'),
        time: date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    } catch (error) {
      return { date: 'N/A', time: 'N/A' };
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0 ₸';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
  };

  return (
    <div className="account-section">
      <div className="section-header">
        <h2 className="section-title">Мои заказы</h2>
      </div>
      
      {userOrders.length > 0 ? (
        <div className="orders-checks">
          {userOrders.map(order => {
            const { date, time } = formatDateTime(order.created_at);
            const orderNumber = order.order_number || `#${order.id}`;
            const companyName = order.company_name || 'Ресторан';
            const totalAmount = order.final_amount || order.total_amount || 0;
            const cardLast4 = order.card_last4;
            const status = order.status || 'pending';
            const items = order.items || [];
            
            return (
              <div key={order.id} className="order-check">
                <div className="check-header">
                  <div className="check-restaurant">
                    <h3>{companyName}</h3>
                    <span className="check-order-id">{orderNumber}</span>
                  </div>
                  <div className="check-date">
                    {date} в {time}
                  </div>
                </div>
                
                {items.length > 0 ? (
                  <div className="check-items">
                    {items.map((item, index) => (
                      <div key={index} className="check-item">
                        <span className="item-name">{item.product_name || 'Товар'}</span>
                        <span className="item-quantity">×{item.quantity || 1}</span>
                        <span className="item-price">
                          {formatPrice(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="check-items">
                    <div className="check-item">
                      <span className="item-name">Информация о товарах недоступна</span>
                    </div>
                  </div>
                )}
                
                <div className="check-footer">
                  <div className="check-total">
                    <span>Итого:</span>
                    <strong>{formatPrice(totalAmount)}</strong>
                  </div>
                  <div className="check-status">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: `${getStatusColor(status)}20`,
                        color: getStatusColor(status),
                        borderColor: `${getStatusColor(status)}40`
                      }}
                    >
                      {getStatusText(status)}
                    </span>
                  </div>
                </div>
                
                {cardLast4 && (
                  <div className="check-payment">
                    💳 Оплачено картой: •••• {cardLast4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-orders">
          <div className="orders-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>У вас пока нет заказов</h3>
          <p>После оформления заказа вы сможете отслеживать его статус здесь</p>
          <button className="browse-products-btn" onClick={handleBrowseProducts}>
            Перейти к каталогу
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountOrders;