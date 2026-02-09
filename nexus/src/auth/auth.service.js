// nexus/src/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(userModel) {
    this.userModel = userModel;
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = '7d';
  }

  // Регистрация нового пользователя
  async register(userData) {
    const { name, email, password, phone, city, address } = userData;

    // Проверяем, существует ли email
    const emailExists = await this.userModel.emailExists(email);
    if (emailExists) {
      const error = new Error('Пользователь с таким email уже существует');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создаем пользователя
    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      city: city || null,
      address: address || null,
      role: 'user',
      company_name: null
    });

    // Генерируем токен
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        address: user.address,
        avatar_url: user.avatar_url,
        company_name: user.company_name,
        is_active: user.is_active,
        created_at: user.created_at
      },
      token
    };
  }

  // Вход пользователя - ИСПРАВЛЕНО!
  async login(email, password) {
    console.log(`🔍 Попытка входа для: ${email}`);
    
    // Находим пользователя по email ВМЕСТЕ С ПАРОЛЕМ
    const user = await this.userModel.getUserWithPassword(email);
    
    if (!user) {
      console.log(`❌ Пользователь не найден: ${email}`);
      const error = new Error('Неверный email или пароль');
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    console.log(`✅ Пользователь найден: ${user.email}, ID: ${user.id}`);
    console.log(`🔐 Активен ли аккаунт: ${user.is_active}`);
    
    // ПРОВЕРЯЕМ ПАРОЛЬ - сравниваем с полем 'password' из БД
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`🔐 Проверка пароля: ${isPasswordValid ? '✅ Верный' : '❌ Неверный'}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Неверный пароль для: ${email}`);
      const error = new Error('Неверный email или пароль');
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // АКТИВИРУЕМ АККАУНТ ПРИ ВХОДЕ ЕСЛИ ОН ДЕАКТИВИРОВАН
    if (!user.is_active) {
      console.log(`🔓 Активируем деактивированный аккаунт: ${email}`);
      
      // Обновляем статус в БД
      await this.userModel.activateUser(user.id);
      user.is_active = true;
      
      console.log(`✅ Аккаунт активирован: ${email}`);
    }

    // Генерируем токен
    const token = this.generateToken(user);

    console.log(`🎉 Вход успешен для: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
        city: user.city,
        address: user.address,
        avatar_url: user.avatar_url,
        company_name: user.company_name,
        is_active: user.is_active,
        created_at: user.created_at
      },
      token
    };
  }

  // Генерация JWT токена
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      name: user.name
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  // Верификация токена
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const expiredError = new Error('Токен истек');
        expiredError.code = 'TOKEN_EXPIRED';
        throw expiredError;
      }
      
      const invalidError = new Error('Неверный токен');
      invalidError.code = 'INVALID_TOKEN';
      throw invalidError;
    }
  }

  // Получить информацию о пользователе по токену
  async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    const user = await this.userModel.findById(decoded.id);
    
    if (!user) {
      const error = new Error('Пользователь не найден');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  // Смена пароля
  async changePassword(userId, currentPassword, newPassword) {
    // Получаем пароль пользователя
    const passwordHash = await this.userModel.getPasswordHash(userId);
    
    if (!passwordHash) {
      throw new Error('Пользователь не найден');
    }

    // Проверяем текущий пароль
    const isValid = await bcrypt.compare(currentPassword, passwordHash);
    if (!isValid) {
      throw new Error('Неверный текущий пароль');
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Обновляем пароль в БД
    await this.userModel.updatePassword(userId, newPasswordHash);
  }
}

module.exports = AuthService;