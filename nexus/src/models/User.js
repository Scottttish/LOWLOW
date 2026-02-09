// nexus/src/models/User.js
class User {
  constructor(pool) {
    this.pool = pool;
  }

  // Найти пользователя по email
  async findByEmail(email) {
    try {
      const result = await this.pool.query(
        `SELECT id, name, email, phone, role, city, address, 
                avatar_url, company_name, is_active, 
                longitude, latitude, created_at
         FROM users 
         WHERE email = $1 AND is_active = true`,
        [email.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Ошибка поиска пользователя по email:', error);
      throw error;
    }
  }

  // Найти пользователя по ID
  async findById(id) {
    try {
      const result = await this.pool.query(
        `SELECT id, name, email, phone, role, city, address, 
                avatar_url, company_name, is_active, 
                longitude, latitude, created_at
         FROM users 
         WHERE id = $1 AND is_active = true`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Ошибка поиска пользователя по ID:', error);
      throw error;
    }
  }

  // Создать нового пользователя (регистрация)
  async create(userData) {
    const { 
      name, 
      email, 
      password, 
      role = 'user', 
      phone = null, 
      city = null, 
      address = null,
      company_name = null
    } = userData;
    
    try {
      const result = await this.pool.query(
        `INSERT INTO users (
          name, email, password, role, phone, city, address,
          company_name, created_at, is_active
        ) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true)
         RETURNING id, name, email, phone, role, city, address, 
                   avatar_url, company_name, is_active, 
                   longitude, latitude, created_at`,
        [
          name, 
          email.toLowerCase(), 
          password,
          role, 
          phone, 
          city, 
          address,
          company_name
        ]
      );
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Не удалось создать пользователя');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Ошибка создания пользователя:', error);
      
      if (error.code === '23505') {
        const duplicateError = new Error('Пользователь с таким email уже существует');
        duplicateError.code = 'DUPLICATE_EMAIL';
        throw duplicateError;
      }
      
      if (error.code === '23502') {
        console.error('❌ Ошибка NOT NULL constraint:', error.detail);
        const nullError = new Error('Ошибка базы данных: обязательное поле не заполнено');
        nullError.code = 'NULL_CONSTRAINT';
        nullError.detail = error.detail;
        throw nullError;
      }
      
      throw error;
    }
  }

  // Обновить пароль пользователя
  async updatePassword(userId, passwordHash) {
    try {
      await this.pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );
      return true;
    } catch (error) {
      console.error('❌ Ошибка обновления пароля:', error);
      throw error;
    }
  }

  // Проверить, существует ли email
  async emailExists(email) {
    try {
      const result = await this.pool.query(
        'SELECT 1 FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('❌ Ошибка проверки email:', error);
      throw error;
    }
  }

  // Получить пользователя по email с паролем (для логина) - ИСПРАВЛЕНО!
  async getUserWithPassword(email) {
    try {
      const result = await this.pool.query(
        `SELECT id, name, email, password, phone, role, 
                city, address, avatar_url, company_name, is_active, 
                longitude, latitude, created_at
         FROM users 
         WHERE email = $1`, // УБРАЛИ: AND is_active = true
        [email.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Ошибка получения пользователя с паролем:', error);
      throw error;
    }
  }

  // Обновить информацию о пользователе
  async updateUser(userId, userData) {
    try {
      const {
        name,
        email,
        phone,
        city,
        address,
        avatar_url,
        company_name
      } = userData;

      const result = await this.pool.query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             city = COALESCE($4, city),
             address = COALESCE($5, address),
             avatar_url = COALESCE($6, avatar_url),
             company_name = COALESCE($7, company_name),
             updated_at = NOW()
         WHERE id = $8
         RETURNING id, name, email, phone, role, city, address, 
                   avatar_url, company_name, is_active, 
                   longitude, latitude, created_at, updated_at`,
        [
          name,
          email ? email.toLowerCase() : null,
          phone,
          city,
          address,
          avatar_url,
          company_name,
          userId
        ]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Ошибка обновления пользователя:', error);
      throw error;
    }
  }

  // Получить пароль пользователя для проверки
  async getPasswordHash(userId) {
    try {
      const result = await this.pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0]?.password || null;
    } catch (error) {
      console.error('❌ Ошибка получения пароля:', error);
      throw error;
    }
  }

  // Активировать пользователя
  async activateUser(userId) {
    try {
      const result = await this.pool.query(
        'UPDATE users SET is_active = true WHERE id = $1 RETURNING id, email, is_active',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Ошибка активации пользователя:', error);
      throw error;
    }
  }
}

module.exports = User;