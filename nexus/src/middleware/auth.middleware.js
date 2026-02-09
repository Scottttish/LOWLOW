const jwt = require('jsonwebtoken');
const { pool } = require('../../aboba/index');

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware для проверки JWT токена
const authMiddleware = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, jwtSecret);
    
    // Проверяем, существует ли пользователь в базе данных
    const userQuery = await pool.query(
      `SELECT id, name, email, phone, role, city, address, 
              avatar_url, company_name, is_active, 
              longitude, latitude, created_at 
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [decoded.id]
    );

    if (!userQuery.rows[0]) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден или неактивен'
      });
    }

    // Добавляем информацию о пользователе в запрос
    req.user = userQuery.rows[0];
    
    // Добавляем оригинальный decoded токен (опционально)
    req.token = token;

    next();
  } catch (error) {
    console.error('❌ Ошибка аутентификации:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истек',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Неверный токен',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при аутентификации',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware для проверки ролей пользователя
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware для проверки, что пользователь является владельцем ресурса
const ownerMiddleware = (idParamName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован'
      });
    }

    // Если пользователь администратор, пропускаем
    if (req.user.role === 'admin') {
      return next();
    }

    // Проверяем, совпадает ли ID пользователя с ID в параметрах запроса
    const resourceId = req.params[idParamName];
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'ID ресурса не указан'
      });
    }

    // Если это числовой ID
    if (parseInt(resourceId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Вы не являетесь владельцем этого ресурса'
      });
    }

    next();
  };
};

// Middleware для проверки активности пользователя
const activeUserMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован'
      });
    }

    // Проверяем, активен ли пользователь
    const userQuery = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userQuery.rows[0] || !userQuery.rows[0].is_active) {
      return res.status(403).json({
        success: false,
        message: 'Ваш аккаунт деактивирован',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Ошибка проверки активности пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при проверке аккаунта'
    });
  }
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  ownerMiddleware,
  activeUserMiddleware
};