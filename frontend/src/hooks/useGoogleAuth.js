import { useState } from 'react';

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    
    try {
      // Загружаем Google API
      await new Promise((resolve, reject) => {
        if (window.google) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // Создаем невидимую кнопку Google
      const googleButton = document.createElement('div');
      googleButton.style.position = 'absolute';
      googleButton.style.opacity = '0';
      googleButton.style.width = '100%';
      googleButton.style.height = '100%';
      googleButton.style.top = '0';
      googleButton.style.left = '0';
      googleButton.style.cursor = 'pointer';
      googleButton.style.zIndex = '10';

      // Инициализируем Google OAuth
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // ЗАМЕНИТЕ НА ВАШ CLIENT_ID
        callback: handleGoogleResponse,
        context: 'use',
        ux_mode: 'popup',
      });

      // Рендерим невидимую кнопку
      window.google.accounts.id.renderButton(googleButton, {
        type: 'icon',
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '300'
      });

      return {
        googleButton,
        loading
      };

    } catch (error) {
      console.error('Google Auth initialization error:', error);
      setLoading(false);
      return null;
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      console.log('Google Auth response received');
      
      // Декодируем JWT токен чтобы получить данные пользователя
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture
      };

      console.log('Google user data:', userData);

      // Отправляем на бэкенд
      const authResponse = await fetch('http://localhost:8080/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await authResponse.json();
      
      if (data.success) {
        // Сохраняем пользователя
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/'; // Редирект на главную
      } else {
        alert('Google authentication failed: ' + data.message);
      }
    } catch (error) {
      console.error('Google response handling error:', error);
      alert('Error during Google authentication');
    } finally {
      setLoading(false);
    }
  };

  return {
    handleGoogleAuth,
    loading
  };
};