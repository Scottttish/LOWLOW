// nexus\index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool, testConnection } = require('./aboba/index');
const User = require('./src/models/User');
const AuthService = require('./src/auth/auth.service');
const AuthController = require('./src/auth/auth.controller');
const authRoutes = require('./src/auth/auth.routes');
const accountRoutes = require('./src/routes/account.routes');
const cartRoutes = require('./src/routes/cart.routes');
const dishesRoutes = require('./src/routes/dishes.routes');
const restaurantsRoutes = require('./src/routes/restaurants.routes');
const businessRoutes = require('./src/routes/business.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.path}`);
  next();
});

// Инициализация сервисов
let authController;

const initializeApp = async () => {
  try {
    console.log('🔍 Проверяем подключение к PostgreSQL...');
    const dbTest = await testConnection();
    
    if (!dbTest.success) {
      console.error('❌ ОШИБКА: Не удалось подключиться к PostgreSQL');
      process.exit(1);
    }
    
    console.log('✅ PostgreSQL подключен успешно!');
    
    const userModel = new User(pool);
    const authService = new AuthService(userModel);
    authController = new AuthController(authService);
    
    console.log('✅ Сервисы аутентификации инициализированы');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации приложения:', error);
    process.exit(1);
  }
};

// Маршруты
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Nexus Backend Server работает!',
    status: 'running',
    database: process.env.PG_DATABASE,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      account: '/api/account',
      cart: '/api/cart',
      dishes: '/api/dishes',
      restaurants: '/api/restaurants',
      business: '/api/business'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      server: 'running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Auth routes
app.use('/api/auth', (req, res, next) => {
  if (authController) {
    const router = authRoutes(authController);
    router(req, res, next);
  } else {
    res.status(503).json({
      success: false,
      message: 'Сервис аутентификации не готов'
    });
  }
});

// API routes
app.use('/api/account', accountRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/business', businessRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    await initializeApp();
    
    console.log('='.repeat(50));
    console.log(`🚀 Сервер запускается на порту ${PORT}`);
    console.log(`📊 База данных: ${process.env.PG_DATABASE}`);
    console.log('='.repeat(50));
    
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
      console.log('\n📋 Доступные маршруты:');
      console.log('   GET  /health                 - Проверка здоровья');
      console.log('   POST /api/auth/register      - Регистрация');
      console.log('   POST /api/auth/login         - Вход');
      console.log('   GET  /api/auth/me            - Информация о пользователе');
      console.log('   PUT  /api/account/user/me    - Обновление пользователя');
      console.log('   DELETE /api/account/user/me  - Удаление пользователя');
      console.log('   GET  /api/account/user/me/cards - Карты пользователя');
      console.log('   GET  /api/account/user/me/orders - Заказы пользователя');
      console.log('   GET  /api/account/user/me/location - Локация пользователя');
      console.log('   POST /api/account/user/me/avatar - Загрузка аватара');
      console.log('   GET  /api/cart/user/me/cart      - Корзина пользователя');
      console.log('   POST /api/cart/user/me/cart      - Добавить в корзину');
      console.log('   POST /api/cart/user/me/checkout  - Оформление заказа');
      console.log('   GET  /api/dishes                 - Получить блюда ресторана');
      console.log('   GET  /api/restaurants            - Получить все рестораны');
      console.log('   GET  /api/restaurants/:id        - Получить конкретный ресторан');
      console.log('   GET  /api/business/products      - Продукты бизнеса');
      console.log('   POST /api/business/products      - Добавить продукт');
      console.log('   PUT  /api/business/products/:article - Обновить продукт');
      console.log('   DELETE /api/business/products/:article - Удалить продукт');
      console.log('   GET  /api/business/orders        - Заказы бизнеса');
      console.log('   PUT  /api/business/orders/:orderId/status - Обновить статус заказа');
      console.log('   GET  /api/business/stats         - Статистика бизнеса');
      console.log('   GET  /api/business/categories    - Категории продуктов');
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Остановка сервера...');
  
  try {
    await pool.end();
    console.log('✅ PostgreSQL соединения закрыты');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при закрытии соединений:', error);
    process.exit(1);
  }
});

startServer();