const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');

module.exports = function(authController) {
  // Валидация для регистрации
  const registerValidation = [
    body('name')
      .trim()
      .notEmpty().withMessage('Имя обязательно')
      .isLength({ min: 2 }).withMessage('Имя должно содержать минимум 2 символа')
      .isLength({ max: 50 }).withMessage('Имя не должно превышать 50 символов'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email обязателен')
      .isEmail().withMessage('Введите корректный email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Пароль обязателен')
      .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Подтверждение пароля обязательно')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Пароли не совпадают');
        }
        return true;
      })
  ];

  // Валидация для входа
  const loginValidation = [
    body('email')
      .trim()
      .notEmpty().withMessage('Email обязателен')
      .isEmail().withMessage('Введите корректный email'),
    
    body('password')
      .notEmpty().withMessage('Пароль обязателен')
  ];

  // Валидация для смены пароля
  const changePasswordValidation = [
    body('currentPassword')
      .notEmpty().withMessage('Текущий пароль обязателен'),
    
    body('newPassword')
      .notEmpty().withMessage('Новый пароль обязателен')
      .isLength({ min: 6 }).withMessage('Новый пароль должен содержать минимум 6 символов')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('Новый пароль должен отличаться от текущего');
        }
        return true;
      }),
    
    body('confirmPassword')
      .notEmpty().withMessage('Подтверждение пароля обязательно')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Пароли не совпадают');
        }
        return true;
      })
  ];

  // Регистрация
  router.post('/register', registerValidation, (req, res) => {
    authController.register(req, res);
  });

  // Вход
  router.post('/login', loginValidation, (req, res) => {
    authController.login(req, res);
  });

  // Проверка токена
  router.get('/verify', (req, res) => {
    authController.verify(req, res);
  });

  // Получение информации о текущем пользователе (защищенный маршрут)
  router.get('/me', authMiddleware, (req, res) => {
    authController.getMe(req, res);
  });

  // Смена пароля (защищенный маршрут)
  router.post('/change-password', authMiddleware, changePasswordValidation, (req, res) => {
    authController.changePassword(req, res);
  });

  return router;
};