// frontend/src/pages/BusinessAccount/components/BusinessAccountOrdersHistory/BusinessAccountOrdersHistory.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import './BusinessAccountOrdersHistory.css';
import '../../../../skeleton.css';

const BusinessAccountOrdersHistory = () => {
  const { user, getBusinessOrders, updateOrderStatus } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Получить заказы бизнеса
  const fetchBusinessOrders = async () => {
    if (!user || !user.id || (user.role !== 'business' && user.role !== 'buisness')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const businessOrders = await getBusinessOrders();

      if (businessOrders && Array.isArray(businessOrders)) {
        const formattedOrders = businessOrders.map(order => ({
          id: order.id,
          order_number: order.order_number || `ORD-${order.id}`,
          customerName: order.customer_name || 'Клиент',
          customerPhone: order.customer_phone || '',
          status: order.status || 'pending',
          total: parseFloat(order.final_amount || order.total_amount || 0),
          createdAt: order.created_at || new Date().toISOString(),
          items: order.items ? order.items.map(item => ({
            name: item.product_name || 'Товар',
            price: parseFloat(item.unit_price || 0),
            quantity: item.quantity || 1
          })) : []
        }));

        const sortedOrders = formattedOrders.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sortedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError('Не удалось загрузить заказы: ' + (err.message || 'Ошибка сервера'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchBusinessOrders();
    }
  }, [user]);

  // Обновить статус заказа
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);

      if (updatedOrder) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      alert('Ошибка при обновлении статуса: ' + (err.message || ''));
    }
  };

  // Функции для статус-бейджа вверху (как было раньше)
  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'pending': return 'В обработке';
      case 'cancelled': return 'Отменен';
      case 'delivered': return 'Доставлен';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#ffa726';
      case 'cancelled': return '#f44336';
      case 'delivered': return '#2196F3';
      default: return '#6c757d';
    }
  };

  // Функции для текста внизу (новые со смайликами и светлыми цветами)
  const getStatusTextForFooter = (status) => {
    switch (status) {
      case 'completed': return '✅ Заказ получен';
      case 'pending': return 'В обработке';
      case 'cancelled': return '❌ Заказ отменен';
      case 'delivered': return 'Доставлен';
      default: return status;
    }
  };

  // Светлые цвета для текста внизу (соответствуют смайликам)
  const getFooterStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50'; // Светло-зеленый
      case 'cancelled': return '#f44336'; // Светло-красный
      case 'pending': return '#ff9800';
      case 'delivered': return '#2196F3';
      default: return '#6c757d';
    }
  };

  // Сокращаем номер заказа
  const getShortOrderId = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.order_number) {
      const lastPart = order.order_number.split('-').pop();
      return `#${lastPart || order.order_number}`;
    }
    return `#${orderId.toString().slice(-6)}`;
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('ru-RU'),
        time: date.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (e) {
      return { date: 'Дата не указана', time: '' };
    }
  };

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.status === 'completed' || order.status === 'delivered')
      .reduce((total, order) => total + order.total, 0);
  };

  const getOrdersCount = (status) => {
    return orders.filter(order => order.status === status).length;
  };

  // Убираем отдельный экран загрузки, будем показывать скелетон
  if (loading && orders.length === 0) {
    // Не возвращаем ранний return, позволяем отрендерить структуру
  }

  if (error) {
    return (
      <div className="business-account-section">
        <div className="section-header">
          <h2 className="section-title">Заказы клиентов</h2>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchBusinessOrders}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="business-account-section">
      <div className="section-header">
        <h2 className="section-title">Заказы клиентов</h2>
      </div>

      {/* Статистика */}
      <div className="orders-stats">
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Всего заказов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getOrdersCount('pending')}</div>
          <div className="stat-label">В обработке</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{getOrdersCount('completed') + getOrdersCount('delivered')}</div>
          <div className="stat-label">Завершено</div>
        </div>
        <div className="stat-card revenue">
          <div className="stat-value">{getTotalRevenue().toLocaleString('ru-RU')} ₸</div>
          <div className="stat-label">Общая выручка</div>
        </div>
      </div>

      {/* Список заказов */}
      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map(order => {
            const { date, time } = formatDateTime(order.createdAt);
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info" style={{ textAlign: 'left' }}>
                    <h3 style={{ textAlign: 'left' }}>Заказ {getShortOrderId(order.id)}</h3>
                    <span className="order-customer" style={{ textAlign: 'left', display: 'block' }}>
                      👤 {order.customerName}
                      {order.customerPhone && (
                        <span className="customer-phone"> • {order.customerPhone}</span>
                      )}
                    </span>
                    <span className="order-date" style={{ textAlign: 'left', display: 'block' }}>
                      📅 {date} • 🕒 {time}
                    </span>
                  </div>
                  <div className="order-status">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                        borderColor: `${getStatusColor(order.status)}40`
                      }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">×{item.quantity}</span>
                        <span className="item-price">{(item.price * item.quantity).toLocaleString('ru-RU')} ₸</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-items">Нет товаров в заказе</div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    Итого: <strong>{order.total ? order.total.toLocaleString('ru-RU') : '0'} ₸</strong>
                  </div>

                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button
                          className="complete-order-btn"
                          onClick={() => handleStatusChange(order.id, 'completed')}
                        >
                          ✅ Получено
                        </button>
                        <button
                          className="cancel-order-btn"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                        >
                          ❌ Отклонить
                        </button>
                      </>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled' || order.status === 'delivered') && (
                      <span
                        className="footer-status-text"
                        style={{
                          color: getFooterStatusColor(order.status),
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'inline-block',
                          padding: '0',
                          backgroundColor: 'transparent',
                          border: 'none'
                        }}
                      >
                        {getStatusTextForFooter(order.status)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>История заказов</h3>
            <p>Здесь будут отображаться ваши заказы</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessAccountOrdersHistory;