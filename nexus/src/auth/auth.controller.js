// nexus/src/auth/auth.controller.js
const { validationResult } = require('express-validator');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  // Регистрация
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors: errors.array()
        });
      }

      const { name, email, password, phone, city, address, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Пароли не совпадают'
        });
      }

      console.log(`📝 Регистрация: ${email}`);

      const result = await this.authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone || null,
        city: city || null,
        address: address || null
      });

      console.log(`✅ Регистрация успешна: ${email}, ID: ${result.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Регистрация прошла успешно',
        data: result
      });

    } catch (error) {
      console.error('❌ Ошибка регистрации:', error.message);

      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при регистрации'
      });
    }
  }

  // ВХОД - ИСПРАВЛЕНО!
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      console.log(`🔑 Вход: ${email}`);

      const result = await this.authService.login(
        email.trim().toLowerCase(), 
        password
      );

      console.log(`✅ Вход успешен: ${email}, ID: ${result.user.id}`);

      res.json({
        success: true,
        message: 'Вход выполнен успешно',
        data: result
      });

    } catch (error) {
      console.error('❌ Ошибка входа:', error.message);

      if (error.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      // УБИРАЕМ ОШИБКУ АКТИВНОСТИ АККАУНТА
      // if (error.code === 'ACCOUNT_DEACTIVATED') {
      //   return res.status(403).json({
      //     success: false,
      //     message: error.message
      //   });
      // }

      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при входе'
      });
    }
  }

  // Проверка токена
  async verify(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Токен не предоставлен'
        });
      }

      const user = await this.authService.getUserFromToken(token);

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('❌ Ошибка верификации токена:', error.message);

      if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при верификации токена'
      });
    }
  }

  // Получение информации о пользователе
  async getMe(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
      }

      const user = await this.authService.userModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('❌ Ошибка получения информации о пользователе:', error);
      
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера'
      });
    }
  }

  // Смена пароля
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Пользователь не авторизован'
        });
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('❌ Ошибка смены пароля:', error);
      
      if (error.message === 'Неверный текущий пароль') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при смене пароля'
      });
    }
  }
}

module.exports = AuthController;