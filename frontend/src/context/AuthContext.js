// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [loading, setLoading] = useState(false);

  const initializationStarted = useRef(false);
  const backendCheckDone = useRef(false);

  const API_BASE_URL = 'http://localhost:5000';
  const API_AUTH_URL = `${API_BASE_URL}/api/auth`;

  const storeToken = (token) => {
    localStorage.setItem('jwt_token', token);
  };

  const getToken = () => {
    return localStorage.getItem('jwt_token');
  };

  const clearToken = () => {
    localStorage.removeItem('jwt_token');
  };

  const checkBackendAvailability = async () => {
    if (backendCheckDone.current) {
      return isBackendAvailable;
    }

    try {
      setIsCheckingBackend(true);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setIsBackendAvailable(data.status === 'healthy');
        backendCheckDone.current = true;
        return data.status === 'healthy';
      } else {
        setIsBackendAvailable(false);
        backendCheckDone.current = true;
        return false;
      }
    } catch (error) {
      setIsBackendAvailable(false);
      backendCheckDone.current = true;
      return false;
    } finally {
      setIsCheckingBackend(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = getToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/account/user/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.user) {
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || '',
            city: data.user.city || '',
            role: data.user.role || 'user',
            avatar_url: data.user.avatar_url || null,
            nickname: data.user.name || 'Пользователь',
            created_at: data.user.created_at,
            is_active: data.user.is_active !== undefined ? data.user.is_active : true,
            company_name: data.user.company_name || '',
            address: data.user.address || '',
            longitude: data.user.longitude || null,
            latitude: data.user.latitude || null
          };

          setUser(userData);
          return true;
        }
      } else {
        if (response.status === 401) {
          clearToken();
          setUser(null);
        }
      }

      return false;

    } catch (error) {
      console.error('❌ Ошибка при проверке авторизации:', error);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);

      const loginData = {
        email: email.trim().toLowerCase(),
        password: password
      };

      console.log('🔑 Отправка запроса на вход:', loginData.email);

      const response = await fetch(`${API_AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('📡 Ответ сервера:', response.status);

      const data = await response.json();

      console.log('📊 Данные ответа:', {
        success: data.success,
        message: data.message,
        hasUser: !!data.data?.user,
        hasToken: !!data.data?.token
      });

      if (response.ok && data.success) {
        if (data.data && data.data.user && data.data.token) {
          console.log('✅ Токен получен, сохраняем...');
          storeToken(data.data.token);

          const userData = {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            phone: data.data.user.phone || '',
            city: data.data.user.city || '',
            role: data.data.user.role || 'user',
            avatar_url: data.data.user.avatar_url || null,
            nickname: data.data.user.name || 'Пользователь',
            created_at: data.data.user.created_at,
            is_active: true,
            company_name: data.data.user.company_name || '',
            address: data.data.user.address || '',
            longitude: data.data.user.longitude || null,
            latitude: data.data.user.latitude || null
          };

          console.log('✅ Данные пользователя получены:', userData.email);

          setUser(userData);
          return userData;
        } else {
          console.error('❌ Неполные данные в ответе:', data);
          throw new Error(data.message || 'Ошибка входа: неполные данные');
        }
      } else {
        let errorMessage = data.message || 'Ошибка авторизации';

        if (response.status === 401) {
          errorMessage = 'Неверный email или пароль';
        }

        console.error('❌ Ошибка входа:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Ошибка в AuthContext.login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);

      if (!userData.nickname || !userData.email || !userData.password) {
        throw new Error('Заполните все обязательные поля');
      }

      const registerData = {
        name: userData.nickname,
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        confirmPassword: userData.confirmPassword || userData.password,
        phone: userData.phone || '',
        city: userData.city || '',
        address: userData.address || ''
      };

      console.log('📝 Регистрация пользователя:', registerData.email);

      const response = await fetch(`${API_AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      console.log('📡 Ответ регистрации:', response.status);

      const data = await response.json();

      console.log('📊 Данные регистрации:', {
        success: data.success,
        message: data.message
      });

      if (!response.ok || !data.success) {
        let errorMessage = data.message || 'Ошибка регистрации';

        if (response.status === 409) {
          errorMessage = 'Пользователь с таким email уже существует';
        } else if (response.status === 400 && data.errors) {
          errorMessage = data.errors[0]?.msg || 'Ошибка валидации';
        }

        console.error('❌ Ошибка регистрации:', errorMessage);
        throw new Error(errorMessage);
      }

      if (data.data && data.data.token) {
        console.log('✅ Токен регистрации получен');
        storeToken(data.data.token);
      }

      if (data.data && data.data.user) {
        const newUser = {
          id: data.data.user.id,
          name: data.data.user.name,
          email: data.data.user.email,
          phone: data.data.user.phone || '',
          city: data.data.user.city || '',
          role: data.data.user.role || 'user',
          avatar_url: data.data.user.avatar_url || null,
          nickname: data.data.user.name || 'Пользователь',
          created_at: data.data.user.created_at,
          is_active: true,
          company_name: data.data.user.company_name || '',
          address: data.data.user.address || '',
          longitude: data.data.user.longitude || null,
          latitude: data.data.user.latitude || null
        };

        console.log('✅ Пользователь зарегистрирован:', newUser.email);
        setUser(newUser);
        return newUser;
      }

      throw new Error('Не удалось получить данные пользователя');

    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = getToken();
      if (token && user) {
        await fetch(`${API_BASE_URL}/api/account/user/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ is_active: false }),
        });
      }
    } catch (error) {
      console.error('Error updating is_active on logout:', error);
    } finally {
      clearToken();
      setUser(null);

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  };

  const updateUser = async (updatedUserData) => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/account/user/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка обновления пользователя');
      }

      if (data.user) {
        const updatedUser = {
          ...user,
          ...updatedUserData,
          ...data.user
        };

        setUser(updatedUser);
        return updatedUser;
      }

      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Файл не выбран'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Размер файла не должен превышать 5MB'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Пожалуйста, выберите изображение'));
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const avatarUrl = e.target.result;
          const token = getToken();

          const response = await fetch(`${API_BASE_URL}/api/account/user/me/avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify({ avatarUrl }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Ошибка загрузки аватара');
          }

          if (data.user) {
            setUser(data.user);
            resolve({ avatar_url: data.user.avatar_url });
          } else {
            resolve({ avatar_url: avatarUrl });
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };

      reader.readAsDataURL(file);
    });
  };

  const deleteUser = async () => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/account/user/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка удаления пользователя');
      }

      setUser(null);
      clearToken();

      return true;

    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ==================== КОРЗИНА ====================

  const addToCart = async (dish, restaurant) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const dishArticle = dish.article || dish.id;

      const response = await fetch(`${API_BASE_URL}/api/cart/user/me/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          dish_article: dishArticle,
          restaurant_id: restaurant.id,
          quantity: 1
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка добавления в корзину');
      }

      return {
        success: true,
        message: 'Добавлено в корзину',
        item: data.item
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const getCart = async () => {
    try {
      const token = getToken();

      if (!token) {
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/user/me/cart`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          return data.cart.map(item => ({
            id: item.id,
            article: item.dish_article,
            name: item.dish_name,
            price: item.price,
            image: item.image || '/default-product.jpg',
            restaurantId: item.restaurant_id,
            restaurantName: item.restaurant_name,
            quantity: item.quantity
          }));
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/user/me/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка обновления корзины');
      }

      return data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/user/me/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка удаления из корзины');
      }

      return data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async (restaurantId = null) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const url = restaurantId
        ? `${API_BASE_URL}/api/cart/user/me/cart?restaurant_id=${restaurantId}`
        : `${API_BASE_URL}/api/cart/user/me/cart`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка очистки корзины');
      }

      return data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const checkout = async (checkoutData) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/user/me/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка при оформлении заказа');
      }

      return data;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
  };

  const createOrder = async (orderData) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const cardsResponse = await fetch(`${API_BASE_URL}/api/account/user/me/cards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!cardsResponse.ok) {
        throw new Error('Не удалось получить карты');
      }

      const cardsData = await cardsResponse.json();

      if (!cardsData.success || !cardsData.cards || cardsData.cards.length === 0) {
        throw new Error('Добавьте карту для оплаты');
      }

      const defaultCard = cardsData.cards.find(card => card.is_default);

      if (!defaultCard) {
        throw new Error('Добавьте карту для оплаты');
      }

      const checkoutData = {
        delivery_address: orderData.deliveryAddress || user.address || 'Адрес не указан',
        notes: `Заказ из ${orderData.companyName}`,
        card_id: defaultCard.id
      };

      return await checkout(checkoutData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const getDefaultCard = async () => {
    try {
      const token = getToken();

      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/account/user/me/cards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cards) {
          return data.cards.find(card => card.is_default);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting default card:', error);
      return null;
    }
  };

  // ==================== БИЗНЕС ФУНКЦИИ (ПРОДУКТЫ) ====================

  const getBusinessProducts = async () => {
    if (!user || user.role !== 'business') {
      console.error('❌ Только бизнес-аккаунты могут получать продукты');
      throw new Error('Только бизнес-аккаунты могут получать продукты');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка получения продуктов');
      }

      // Преобразуем данные для работы с is_active
      return (data.products || []).map(product => ({
        ...product,
        is_active: product.is_active !== undefined ? product.is_active : (product.status === 'active')
      }));
    } catch (error) {
      console.error('Error getting business products:', error);
      throw error;
    }
  };

  const addBusinessProduct = async (productData) => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут добавлять продукты');
    }

    try {
      const token = getToken();

      // Подготавливаем данные для отправки
      const requestData = {
        name: productData.name,
        price: parseFloat(productData.price),
        category: productData.category,
        ingredients: productData.ingredients || '',
        composition: productData.composition || '',
        quantity: parseInt(productData.quantity || 0),
        is_active: productData.is_active !== undefined ? productData.is_active : true
      };

      // Добавляем image_url только если он есть
      if (productData.image_url) {
        requestData.image_url = productData.image_url;
        requestData.image = productData.image_url;
      }

      console.log('➕ Добавление продукта:', requestData);

      const response = await fetch(`${API_BASE_URL}/api/business/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('📊 Ответ добавления продукта:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка добавления продукта');
      }

      const newProduct = data.product || data;
      return {
        ...newProduct,
        is_active: newProduct.is_active !== undefined ? newProduct.is_active : true
      };
    } catch (error) {
      console.error('❌ Ошибка добавления бизнес продукта:', error);
      throw error;
    }
  };

  const updateBusinessProduct = async (article, productData) => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут обновлять продукты');
    }

    try {
      const token = getToken();

      // Подготавливаем данные для отправки
      const requestData = {
        name: productData.name,
        price: parseFloat(productData.price),
        category: productData.category,
        ingredients: productData.ingredients || '',
        composition: productData.composition || '',
        quantity: parseInt(productData.quantity || 0),
        is_active: productData.is_active !== undefined ? productData.is_active : true
      };

      // Добавляем image_url только если он есть
      if (productData.image_url) {
        requestData.image_url = productData.image_url;
        requestData.image = productData.image_url;
      }

      console.log('🔄 Обновление продукта:', {
        article,
        data: requestData
      });

      const response = await fetch(`${API_BASE_URL}/api/business/products/${article}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      console.log('📊 Ответ обновления продукта:', {
        status: response.status,
        success: data.success,
        message: data.message
      });

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка обновления продукта');
      }

      // Обработка успешного ответа
      const updatedProduct = data.product || data;
      return {
        ...updatedProduct,
        is_active: updatedProduct.is_active !== undefined ? updatedProduct.is_active : true
      };
    } catch (error) {
      console.error('❌ Ошибка обновления бизнес продукта:', error);
      throw error;
    }
  };

  const deleteBusinessProduct = async (article) => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут удалять продукты');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/products/${article}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка удаления продукта');
      }

      return data;
    } catch (error) {
      console.error('Error deleting business product:', error);
      throw error;
    }
  };

  // ==================== БИЗНЕС ФУНКЦИИ (ЗАКАЗЫ) ====================

  const getBusinessOrders = async () => {
    console.log('🔄 [AUTH CONTEXT] Запрос заказов бизнеса');

    if (!user || user.role !== 'business') {
      console.error('❌ Только бизнес-аккаунты могут получать заказы');
      throw new Error('Только бизнес-аккаунты могут получать заказы');
    }

    try {
      const token = getToken();
      console.log('🔑 Токен:', token ? 'есть' : 'нет');
      console.log('👤 ID пользователя:', user.id);
      console.log('👤 Роль пользователя:', user.role);

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/api/business/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      console.log('📡 Ответ сервера заказов:', response.status, response.statusText);

      const data = await response.json();

      console.log('📊 Данные ответа заказов:', {
        success: data.success,
        message: data.message,
        orders_count: data.orders?.length || 0,
        restaurant_found: data.restaurant_found,
        restaurant_id: data.restaurant_id
      });

      if (!response.ok || !data.success) {
        console.error('❌ Ошибка получения заказов:', data.message);
        throw new Error(data.message || 'Ошибка получения заказов');
      }

      console.log('✅ Заказы успешно получены:', data.orders?.length || 0, 'шт');

      if (data.orders && data.orders.length > 0) {
        console.log('📊 Пример заказа:', {
          id: data.orders[0].id,
          customer_name: data.orders[0].customer_name,
          status: data.orders[0].status,
          total_amount: data.orders[0].total_amount,
          items_count: data.orders[0].items?.length || 0
        });
      }

      return data.orders || [];
    } catch (error) {
      console.error('❌ Ошибка в getBusinessOrders:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    console.log(`🔄 [AUTH CONTEXT] Обновление статуса заказа ${orderId} на ${status}`);

    if (!user || user.role !== 'business') {
      console.error('❌ Только бизнес-аккаунты могут обновлять статусы заказов');
      throw new Error('Только бизнес-аккаунты могут обновлять статусы заказов');
    }

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/api/business/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      console.log('📡 Ответ обновления статуса:', response.status);

      const data = await response.json();

      console.log('📊 Данные обновления статуса:', {
        success: data.success,
        message: data.message
      });

      if (!response.ok || !data.success) {
        console.error('❌ Ошибка обновления статуса заказа:', data.message);
        throw new Error(data.message || 'Ошибка обновления статуса заказа');
      }

      console.log('✅ Статус заказа обновлен:', data.order);
      return data.order;
    } catch (error) {
      console.error('❌ Ошибка в updateOrderStatus:', error);
      throw error;
    }
  };

  // ==================== БИЗНЕС ФУНКЦИИ (СТАТИСТИКА) ====================

  const getBusinessStats = async () => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут получать статистику');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/products-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Если эндпоинт не доступен, вычисляем локально
        const products = await getBusinessProducts();
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.is_active !== undefined ? p.is_active : (p.status === 'active')).length;
        const inactiveProducts = totalProducts - activeProducts;

        return {
          stats: {
            total_products: totalProducts,
            active_products: activeProducts,
            inactive_products: inactiveProducts
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting business stats, calculating locally:', error);
      // Вычисляем локально при ошибке
      const products = await getBusinessProducts();
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_active !== undefined ? p.is_active : p.status === 'active').length;
      const inactiveProducts = totalProducts - activeProducts;

      return {
        stats: {
          total_products: totalProducts,
          active_products: activeProducts,
          inactive_products: inactiveProducts
        }
      };
    }
  };

  const getCategories = async () => {
    try {
      // Возвращаем статический список категорий
      return ['Пицца', 'Бургеры', 'Суши', 'Салаты', 'Напитки', 'Десерты', 'Завтраки', 'Горячие блюда'];
    } catch (error) {
      console.error('Error getting categories:', error);
      return ['Пицца', 'Бургеры', 'Суши', 'Салаты', 'Напитки', 'Десерты'];
    }
  };

  const saveBusinessLocation = async (longitude, latitude, city, address) => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут сохранять локацию');
    }

    try {
      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/api/account/user/me/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          longitude,
          latitude,
          city: city || user.city,
          address: address || user.address
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка сохранения локации');
      }

      setUser(prev => ({
        ...prev,
        longitude,
        latitude,
        city: city || prev.city,
        address: address || prev.address
      }));

      return data.location;
    } catch (error) {
      console.error('Error saving business location:', error);
      throw error;
    }
  };

  // ==================== БИЗНЕС ФУНКЦИИ (ПРОФИЛЬ РЕСТОРАНА) ====================

  const getRestaurantProfile = async () => {
    if (!user || user.role !== 'business') {
      return null;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/restaurant`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data.restaurant || null;
    } catch (error) {
      console.error('Error getting restaurant profile:', error);
      return null;
    }
  };

  const updateRestaurantProfile = async (restaurantData) => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут обновлять профиль ресторана');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/restaurant`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка обновления профиля ресторана');
      }

      return data.restaurant;
    } catch (error) {
      console.error('Error updating restaurant profile:', error);
      throw error;
    }
  };

  const isBusiness = () => {
    return user?.role === 'business';
  };

  // ==================== ОБЩИЕ ФУНКЦИИ ====================

  const getUserOrders = async () => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/account/user/me/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка получения заказов');
      }

      return data.orders || [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  };

  const getRestaurants = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/restaurants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка получения ресторанов');
      }

      return data.restaurants || [];
    } catch (error) {
      console.error('Error getting restaurants:', error);
      return [];
    }
  };

  const getRestaurantDishes = async (restaurantId) => {
    try {
      const token = getToken();

      if (!token) {
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/api/dishes?restaurant_id=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (!data.success) {
        return [];
      }

      // Преобразуем данные для работы с is_active
      return (data.dishes || []).map(dish => ({
        ...dish,
        is_active: dish.is_active !== undefined ? dish.is_active : (dish.status === 'active')
      }));
    } catch (error) {
      console.error('Error getting restaurant dishes:', error);
      return [];
    }
  };

  // ==================== ТЕСТОВЫЕ ФУНКЦИИ ====================

  const createTestOrder = async () => {
    if (!user || user.role !== 'business') {
      throw new Error('Только бизнес-аккаунты могут создавать тестовые заказы');
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/business/test-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ошибка создания тестового заказа');
      }

      return data;
    } catch (error) {
      console.error('Error creating test order:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (initializationStarted.current) {
      return;
    }

    initializationStarted.current = true;

    const init = async () => {
      try {
        const backendAvailable = await checkBackendAvailability();
        setIsBackendAvailable(backendAvailable);

        if (backendAvailable) {
          const token = getToken();
          if (token) {
            await checkAuthStatus();
          }
        }

        setIsInitialized(true);

      } catch (error) {
        console.error('❌ Ошибка инициализации AuthContext:', error);
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isInitialized,
    isBackendAvailable,
    isCheckingBackend,

    getToken,

    register,
    login,
    logout,
    updateUser,
    uploadAvatar,
    deleteUser,

    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkout,
    createOrder,
    getDefaultCard,

    // Бизнес функции (продукты)
    getBusinessProducts,
    addBusinessProduct,
    updateBusinessProduct,
    deleteBusinessProduct,

    // Бизнес функции (заказы)
    getBusinessOrders,
    updateOrderStatus,

    // Бизнес функции (статистика и профиль)
    getBusinessStats,
    getCategories,
    saveBusinessLocation,
    getRestaurantProfile,
    updateRestaurantProfile,
    isBusiness,

    // Общие функции
    getUserOrders,
    getRestaurants,
    getRestaurantDishes,

    // Тестовые функции
    createTestOrder,

    // Сервисные функции
    checkAuthStatus,
    checkBackendAvailability,

    // Admin Functions
    getAllUsers: async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        return data.users || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },

    getAllProducts: async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE_URL}/api/admin/products?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        return data.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },

    adminUpdateUser: async (id, userData) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    },

    adminDeleteUser: async (id) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    },

    adminUpdateUserAvatar: async (userId, avatarUrl) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/avatar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ avatarUrl })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error uploading user avatar by admin:', error);
        throw error;
      }
    },

    createBusinessUser: async (businessData) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(businessData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    },

    adminUpdateProduct: async (article, productData) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${article}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    },

    adminDeleteProduct: async (article) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${article}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data;
    },

    getActionLogs: async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE_URL}/api/admin/action-logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.logs;
      } catch (error) {
        console.error('Error fetching action logs:', error);
        throw error;
      }
    },

    undoAction: async (logId) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/action-logs/${logId}/undo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error undoing action:', error);
        throw error;
      }
    },

    adminCreateUser: async (userData) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    adminCreateProduct: async (productData) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(productData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },

    getPartnershipRequests: async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/partnership`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.requests || [];
      } catch (error) {
        console.error('Error fetching partnership requests:', error);
        return [];
      }
    },

    updatePartnershipStatus: async (id, status) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/partnership/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({ status })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error updating partnership status:', error);
        throw error;
      }
    },

    deletePartnershipRequest: async (id) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/partnership/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      } catch (error) {
        console.error('Error deleting partnership request:', error);
        throw error;
      }
    },

    getActionLogs: async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE_URL}/api/admin/action-logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Ошибка сервера');
        return data.logs || [];
      } catch (error) {
        console.error('Error fetching action logs:', error);
        throw error;
      }
    },

    undoAction: async (logId) => {
      try {
        const token = getToken();
        if (!token) throw new Error('No token');

        const response = await fetch(`${API_BASE_URL}/api/admin/action-logs/${logId}/undo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Ошибка отмены');
        return data;
      } catch (error) {
        console.error('Error undoing action:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;