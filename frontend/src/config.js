/**
 * Конфигурация приложения FoodSharing
 * Все настройки берутся из .env файла
 */

const config = {
  // ========== БАЗОВЫЕ НАСТРОЙКИ ==========
  APP_NAME: process.env.REACT_APP_APP_NAME || 'FoodSharing',
  ENV: process.env.REACT_APP_ENV || 'development',
  
  // ========== URL АДРЕСА ==========
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // ========== НАСТРОЙКИ ПРИЛОЖЕНИЯ ==========
  DEFAULT_CITY: process.env.REACT_APP_DEFAULT_CITY || 'Алматы',
  DEFAULT_CURRENCY: process.env.REACT_APP_DEFAULT_CURRENCY || '₸',
  DEFAULT_LANGUAGE: process.env.REACT_APP_DEFAULT_LANGUAGE || 'ru',
  
  // ========== API ENDPOINTS ==========
  ENDPOINTS: {
    // Аутентификация
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      CHECK: '/auth/check',
      HEALTH: '/auth/health',
      TEST_CORS: '/auth/test-cors',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password'
    },
    
    // Пользователи
    USERS: {
      BASE: '/users',
      PROFILE: '/users/profile',
      UPDATE: '/users/update',
      UPDATE_PASSWORD: '/users/update-password',
      BY_ID: '/users/{id}'
    },
    
    // Рестораны
    RESTAURANTS: {
      BASE: '/restaurants',
      DETAILS: '/restaurants/{id}',
      SEARCH: '/restaurants/search',
      BY_CATEGORY: '/restaurants/category/{category}'
    },
    
    // Продукты
    PRODUCTS: {
      BASE: '/products',
      BY_RESTAURANT: '/products/restaurant/{restaurantId}',
      SEARCH: '/products/search'
    },
    
    // Заказы
    ORDERS: {
      BASE: '/orders',
      CREATE: '/orders/create',
      HISTORY: '/orders/history',
      BY_ID: '/orders/{id}',
      UPDATE_STATUS: '/orders/{id}/status'
    },
    
    // Корзина
    CART: {
      BASE: '/cart',
      ADD: '/cart/add',
      REMOVE: '/cart/remove',
      UPDATE: '/cart/update',
      CLEAR: '/cart/clear'
    },
    
    // Категории
    CATEGORIES: {
      BASE: '/categories',
      ALL: '/categories/all'
    }
  },
  
  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========
  
  /**
   * Получить полный URL для endpoint
   * @param {string} endpoint - Endpoint из конфига
   * @param {Object} params - Параметры для замены в пути
   * @returns {string} Полный URL
   */
  getFullUrl: function(endpoint, params = {}) {
    let url = endpoint;
    
    // Заменяем параметры в пути
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
    
    return `${this.API_BASE_URL}${url}`;
  },
  
  /**
   * Получить URL для запроса через proxy
   * Используется для fetch запросов
   * @param {string} endpoint - Endpoint из конфига
   * @returns {string} URL для fetch
   */
  getProxyUrl: function(endpoint) {
    return `/api${endpoint}`;
  },
  
  /**
   * Настройки для fetch запросов
   */
  fetchOptions: {
    default: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Для отправки куков
    },
    
    withAuth: (token) => ({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    })
  }
};

// ========== ЭКСПОРТ КОНСТАНТ ДЛЯ УДОБСТВА ==========

// Базовые URL
export const API_BASE_URL = config.API_BASE_URL;
export const BACKEND_URL = config.BACKEND_URL;
export const FRONTEND_URL = config.FRONTEND_URL;

// Endpoints аутентификации
export const AUTH_ENDPOINTS = {
  LOGIN: config.getFullUrl(config.ENDPOINTS.AUTH.LOGIN),
  REGISTER: config.getFullUrl(config.ENDPOINTS.AUTH.REGISTER),
  LOGOUT: config.getFullUrl(config.ENDPOINTS.AUTH.LOGOUT),
  HEALTH: config.getFullUrl(config.ENDPOINTS.AUTH.HEALTH),
  CHECK: config.getFullUrl(config.ENDPOINTS.AUTH.CHECK)
};

// Endpoints пользователей
export const USER_ENDPOINTS = {
  BASE: config.getFullUrl(config.ENDPOINTS.USERS.BASE),
  PROFILE: config.getFullUrl(config.ENDPOINTS.USERS.PROFILE),
  UPDATE: config.getFullUrl(config.ENDPOINTS.USERS.UPDATE)
};

// Endpoints ресторанов
export const RESTAURANT_ENDPOINTS = {
  BASE: config.getFullUrl(config.ENDPOINTS.RESTAURANTS.BASE),
  DETAILS: (id) => config.getFullUrl(config.ENDPOINTS.RESTAURANTS.DETAILS, { id })
};

// Endpoints заказов
export const ORDER_ENDPOINTS = {
  BASE: config.getFullUrl(config.ENDPOINTS.ORDERS.BASE),
  CREATE: config.getFullUrl(config.ENDPOINTS.ORDERS.CREATE),
  HISTORY: config.getFullUrl(config.ENDPOINTS.ORDERS.HISTORY)
};

// Endpoints корзины
export const CART_ENDPOINTS = {
  BASE: config.getFullUrl(config.ENDPOINTS.CART.BASE),
  ADD: config.getFullUrl(config.ENDPOINTS.CART.ADD),
  REMOVE: config.getFullUrl(config.ENDPOINTS.CART.REMOVE)
};

// Настройки приложения
export const APP_CONFIG = {
  NAME: config.APP_NAME,
  DEFAULT_CITY: config.DEFAULT_CITY,
  DEFAULT_CURRENCY: config.DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE: config.DEFAULT_LANGUAGE
};

// Вспомогательные методы
export const getFullUrl = config.getFullUrl.bind(config);
export const getProxyUrl = config.getProxyUrl.bind(config);
export const fetchOptions = config.fetchOptions;

export default config;