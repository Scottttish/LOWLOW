import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const AccountContext = createContext({});

export const useAccount = () => useContext(AccountContext);

export const AccountProvider = ({ children }) => {
  const { user, getToken, logout: authLogout } = useAuth();
  
  const [accountData, setAccountData] = useState(null);
  const [cards, setCards] = useState([]);
  const [orders, setOrders] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
  });

  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        authLogout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    if (user) {
      fetchAccountData();
    } else {
      setAccountData(null);
      setCards([]);
      setOrders([]);
      setLocation(null);
    }
  }, [user]);

  const fetchAccountData = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const userResponse = await api.get(`/account/user/me`);
      
      if (userResponse.data.success) {
        setAccountData(userResponse.data.user);
      }

    } catch (error) {
      console.error('Error fetching account data:', error);
    }
  }, [user, getToken, api]);

  const refreshCards = async () => {
    try {
      if (!user) {
        return { success: false, message: 'Пользователь не авторизован' };
      }
      
      const response = await api.get(`/account/user/me/cards`);
      
      if (response.data.success) {
        setCards(response.data.cards || []);
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
  };

  const saveCard = async (cardData) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      console.log('Sending card data:', cardData);
      const response = await api.post(`/account/user/me/cards`, cardData);
      
      if (response.data.success) {
        await refreshCards();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при сохранении карты');
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  };

  const deleteCard = async (cardId) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.delete(`/account/user/me/cards/${cardId}`);
      if (response.data.success) {
        await refreshCards();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при удалении карты');
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  };

  const setDefaultCard = async (cardId) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.put(`/account/user/me/cards/${cardId}/default`);
      if (response.data.success) {
        await refreshCards();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при установке основной карты');
    } catch (error) {
      console.error('Error setting default card:', error);
      throw error;
    }
  };

  const refreshOrders = async () => {
    try {
      if (!user) {
        return { success: false, message: 'Пользователь не авторизован' };
      }
      
      const response = await api.get(`/account/user/me/orders`);
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  const createOrder = async (orderData) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.post(`/account/user/me/orders`, orderData);
      if (response.data.success) {
        await refreshOrders();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при создании заказа');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const refreshLocation = async () => {
    try {
      if (!user) {
        return { success: false, message: 'Пользователь не авторизован' };
      }
      
      const response = await api.get(`/account/user/me/location`);
      
      if (response.data.success && response.data.location) {
        setLocation(response.data.location);
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocation(null);
      return { success: false, message: error.message };
    }
  };

  const saveLocation = async (locationData) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.put(`/account/user/me/location`, locationData);
      
      if (response.data.success) {
        setLocation(response.data.location);
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при сохранении локации');
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!user) {
        return null;
      }
      
      const response = await api.get(`/account/user/me/location`);
      if (response.data.success) {
        return response.data.location;
      }
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.put(`/account/user/me`, profileData);
      
      if (response.data.success) {
        setAccountData(response.data.user);
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при обновлении профиля');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (avatarFile) => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const avatarUrl = URL.createObjectURL(avatarFile);
      
      const response = await api.post(`/account/user/me/avatar`, {
        avatarUrl: avatarUrl
      });
      
      if (response.data.success) {
        setAccountData(response.data.user);
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при загрузке аватара');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.delete(`/account/user/me`);
      if (response.data.success) {
        await authLogout();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при удалении аккаунта');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const deactivateAccount = async () => {
    try {
      if (!user) throw new Error('Пользователь не авторизован');
      
      const response = await api.post(`/account/user/me/deactivate`);
      if (response.data.success) {
        await authLogout();
        return response.data;
      }
      throw new Error(response.data.message || 'Ошибка при деактивации аккаунта');
    } catch (error) {
      console.error('Error deactivating account:', error);
      throw error;
    }
  };

  const logout = async () => {
    await authLogout();
  };

  const value = {
    accountData,
    cards,
    orders,
    location,
    loading,
    
    fetchAccountData,
    refreshCards,
    saveCard,
    deleteCard,
    setDefaultCard,
    refreshOrders,
    createOrder,
    refreshLocation,
    saveLocation,
    getCurrentLocation,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    deactivateAccount,
    logout
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export default AccountContext;