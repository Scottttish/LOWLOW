import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AUTH_ENDPOINTS, getProxyUrl } from '../config';

const TestConnection = () => {
  const [backendStatus, setBackendStatus] = useState('Проверяем...');
  const [backendData, setBackendData] = useState(null);
  const [corsStatus, setCorsStatus] = useState('Проверяем...');
  const [proxyStatus, setProxyStatus] = useState('Проверяем...');
  const { isAuthenticated, currentUser, checkAuthStatus } = useAuth();

  const testBackendConnection = async () => {
    try {
      setBackendStatus('Проверяем прямое соединение...');
      
      // Тест 1: Прямое соединение с бэкендом
      const directResponse = await fetch(AUTH_ENDPOINTS.HEALTH, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        setBackendData(data);
        setBackendStatus('✅ Прямое соединение с бэкендом работает!');
      } else {
        setBackendStatus(`❌ Ошибка прямого соединения: ${directResponse.status}`);
      }
    } catch (error) {
      setBackendStatus(`❌ Ошибка: ${error.message}`);
    }
  };

  const testCorsConnection = async () => {
    try {
      setCorsStatus('Проверяем CORS...');
      
      // Тест CORS
      const corsResponse = await fetch(AUTH_ENDPOINTS.HEALTH, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      if (corsResponse.ok) {
        setCorsStatus('✅ CORS настроен правильно!');
      } else {
        setCorsStatus(`❌ CORS ошибка: ${corsResponse.status}`);
      }
    } catch (error) {
      setCorsStatus(`❌ CORS ошибка: ${error.message}`);
    }
  };

  const testProxyConnection = async () => {
    try {
      setProxyStatus('Проверяем proxy...');
      
      // Тест через proxy
      const proxyResponse = await fetch(getProxyUrl('/auth/health'), {
        method: 'GET',
        credentials: 'include'
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        setProxyStatus('✅ Proxy работает правильно!');
        console.log('Proxy response:', data);
      } else {
        setProxyStatus(`❌ Proxy ошибка: ${proxyResponse.status}`);
      }
    } catch (error) {
      setProxyStatus(`❌ Proxy ошибка: ${error.message}`);
    }
  };

  const runAllTests = () => {
    testBackendConnection();
    testCorsConnection();
    testProxyConnection();
    checkAuthStatus();
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>🔧 Тест соединения Frontend ↔ Backend</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Запустить все тесты
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h3>Статус соединения:</h3>
        <p><strong>Бэкенд:</strong> {backendStatus}</p>
        <p><strong>CORS:</strong> {corsStatus}</p>
        <p><strong>Proxy:</strong> {proxyStatus}</p>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h3>Статус авторизации:</h3>
        <p><strong>Авторизован:</strong> {isAuthenticated ? '✅ Да' : '❌ Нет'}</p>
        {currentUser && (
          <div>
            <p><strong>Пользователь:</strong> {currentUser.email}</p>
            <p><strong>Роль:</strong> {currentUser.role || 'USER'}</p>
          </div>
        )}
      </div>
      
      {backendData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Ответ от бэкенда:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(backendData, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        <h4>Информация для разработки:</h4>
        <p><strong>Frontend URL:</strong> {window.location.origin}</p>
        <p><strong>Backend URL:</strong> {process.env.REACT_APP_BACKEND_URL}</p>
        <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL}</p>
      </div>
    </div>
  );
};

export default TestConnection;