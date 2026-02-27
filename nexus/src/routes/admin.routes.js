// nexus/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { logAction } = require('../utils/logger');

const adminMiddleware = roleMiddleware('admin');

// ==================== ЖУРНАЛ ДЕЙСТВИЙ ====================

// Получить все логи действий
router.get('/action-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        al.id, 
        al.user_id, 
        u.name as user_name, 
        al.action_type, 
        al.description, 
        al.metadata, 
        al.created_at
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query);
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('❌ Ошибка получения журналов действий:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Отменить действие
router.post('/action-logs/:id/undo', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  let client;

  try {
    const logResult = await pool.query('SELECT * FROM action_logs WHERE id = $1', [id]);
    if (!logResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Лог не найден' });
    }

    const log = logResult.rows[0];
    const metadata = log.metadata || {};
    client = await pool.connect();
    await client.query('BEGIN');

    let undoSuccess = false;
    let message = '';

    switch (log.action_type) {
      case 'UPDATE_USER':
        if (metadata.previous && metadata.userId) {
          const p = metadata.previous;
          const uId = metadata.userId;

          // Восстанавливаем данные в таблице users
          await client.query(
            `UPDATE users 
             SET name=$1, email=$2, phone=$3, role=$4, city=$5, address=$6, 
                 company_name=$7, is_active=$8, avatar_url=$9, password=$10,
                 updated_at=NOW() 
             WHERE id=$11`,
            [p.name, p.email, p.phone, p.role, p.city, p.address, p.company_name, p.is_active, p.avatar_url, p.password, uId]
          );

          // Если это был бизнес, восстанавливаем данные в таблице restaurants
          if (p.role === 'business' || p.role === 'buisness') {
            await client.query(
              `UPDATE restaurants 
               SET company_name=$1, bin=$2, director_first_name=$3, director_last_name=$4, 
                   opening_time=$5, closing_time=$6, city=$7, logo_url=$8,
                   updated_at=NOW() 
               WHERE user_id=$9`,
              [
                p.company_name,
                p.bin || null,
                p.director_first_name || null,
                p.director_last_name || null,
                p.opening_time || null,
                p.closing_time || null,
                p.city || null,
                p.restaurant_logo || null,
                uId
              ]
            );
          }

          undoSuccess = true;
          message = 'Данные пользователя и заведения полностью восстановлены';
        }
        break;

      case 'UPDATE_PRODUCT':
        if (metadata.previous && metadata.article) {
          const p = metadata.previous;
          await client.query(
            `UPDATE dishes SET name=$1, price=$2, quantity=$3, composition=$4, category=$5, image_url=$6, status=$7, ingredients=$8, updated_at=NOW() WHERE article=$9`,
            [p.name, p.price, p.quantity, p.composition, p.category, p.image_url, p.status, p.ingredients, metadata.article]
          );
          undoSuccess = true;
          message = 'Данные продукта восстановлены';
        }
        break;

      case 'DELETE_PRODUCT':
        if (metadata.deletedProduct) {
          const p = metadata.deletedProduct;
          await client.query(
            `INSERT INTO dishes (article, name, price, quantity, composition, category, image_url, status, ingredients, restaurant_id, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [p.article, p.name, p.price, p.quantity, p.composition, p.category, p.image_url, p.status, p.ingredients, p.restaurant_id, p.created_at]
          );
          undoSuccess = true;
          message = 'Удаленный продукт восстановлен';
        }
        break;

      case 'CREATE_PRODUCT':
        if (metadata.product && metadata.product.article) {
          await client.query('DELETE FROM dishes WHERE article = $1', [metadata.product.article]);
          undoSuccess = true;
          message = 'Созданный продукт удален';
        }
        break;

      case 'UPDATE_ORDER_STATUS':
        if (metadata.orderId && metadata.oldStatus) {
          await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [metadata.oldStatus, metadata.orderId]);
          undoSuccess = true;
          message = 'Статус заказа возвращен к предыдущему';
        }
        break;

      case 'CREATE_USER':
        if (metadata.user && metadata.user.id) {
          const uId = metadata.user.id;
          // Delete logs first to avoid foreign key issues
          await client.query('DELETE FROM action_logs WHERE user_id = $1', [uId]);
          await client.query('DELETE FROM users WHERE id = $1', [uId]);
          undoSuccess = true;
          message = `Пользователь ${metadata.user.email} успешно удален`;
        }
        break;

      case 'CREATE_BUSINESS':
        if (metadata.createdUser && metadata.createdUser.id) {
          const uId = metadata.createdUser.id;
          await client.query('DELETE FROM dishes WHERE restaurant_id = $1', [uId]);
          await client.query('DELETE FROM restaurants WHERE user_id = $1', [uId]);
          await client.query('DELETE FROM action_logs WHERE user_id = $1', [uId]);
          await client.query('DELETE FROM users WHERE id = $1', [uId]);
          undoSuccess = true;
          message = `Бизнес-аккаунт ${metadata.companyName} и пользователь удалены`;
        }
        break;

      case 'UPDATE_USER_AVATAR':
        if (metadata.userId && metadata.previousAvatarUrl !== undefined) {
          await client.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [metadata.previousAvatarUrl, metadata.userId]);
          undoSuccess = true;
          message = 'Аватар пользователя восстановлен';
        }
        break;

      default:
        message = `Отмена для типа действия "${log.action_type}" пока не поддерживается или слишком сложна`;
    }

    if (undoSuccess) {
      await client.query('DELETE FROM action_logs WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({ success: true, message });
    } else {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: message || 'Не удалось отменить действие' });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Ошибка при отмене действия:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при отмене действия' });
  } finally {
    if (client) client.release();
  }
});

// ==================== ПОЛЬЗОВАТЕЛИ ====================

// Получить всех пользователей с пагинацией и фильтрами
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50, // Changed from 20 to 50
      search = '',
      role = '',
      is_active = '', // This was removed in the instruction's req.query destructuring, but kept in filtering logic below. I will remove it from destructuring as per instruction.
      sort_by = 'created_at', // This was removed in the instruction's req.query destructuring. I will remove it.
      sort_order = 'DESC' // This was removed in the instruction's req.query destructuring. I will remove it.
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.role, u.city, u.address,
        u.avatar_url,
        -- Prefer restaurant company name for business users, fallback to user company_name
        COALESCE(r.company_name, u.company_name) as company_name,
        r.id as restaurant_id,
        u.is_active,
        u.created_at, u.updated_at,
        u.longitude, u.latitude,
        -- Extra business fields
        r.director_first_name,
        r.director_last_name,
        r.bin,
        r.opening_time,
        r.closing_time,
        r.logo_url
      FROM users u
      LEFT JOIN restaurants r ON u.id = r.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (
        u.name ILIKE $${paramCount} OR
        u.email ILIKE $${paramCount} OR
        u.phone ILIKE $${paramCount} OR
        u.company_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (is_active !== '') { // This filter was not removed in the instruction's example, so keeping it.
      paramCount++;
      query += ` AND u.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    // Добавляем сортировку
    // The instruction removed sort_by and sort_order from req.query, but the original code had it.
    // The instruction's example query had `ORDER BY u.created_at DESC`.
    // I will simplify to `ORDER BY u.created_at DESC` as per the instruction's example.
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    params.push(parseInt(limit), offset);

    console.log('🔍 Запрос пользователей:', { query, params });

    const usersResult = await pool.query(query, params);

    // Получаем общее количество
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR phone ILIKE $${countParamCount} OR company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (is_active !== '') {
      countParamCount++;
      countQuery += ` AND is_active = $${countParamCount}`;
      countParams.push(is_active === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);

    // Получаем статистику по ролям
    const roleStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users
      GROUP BY role
    `);

    console.log(`✅ Найдено ${usersResult.rows.length} пользователей из ${countResult.rows[0].total}`);

    res.json({
      success: true,
      users: usersResult.rows,
      stats: {
        role_stats: roleStats.rows
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения пользователей:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Создать покупателя (админ)
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, phone, city, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email и пароль обязательны' });
    }

    const emailExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailExists.rows[0]) {
      return res.status(400).json({ success: false, message: 'Пользователь с таким email уже существует' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, city, address, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
       RETURNING id, name, email, role, city, address`,
      [name || '', email.toLowerCase(), passwordHash, phone || null, 'user', city || null, address || null]
    );

    await logAction(req.user.id, 'CREATE_USER', `Администратор создал покупателя ${email}`, { user: result.rows[0] });

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка создания покупателя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при создании покупателя' });
  }
});

// Получить конкретного пользователя
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Запрос пользователя ID: ${id}`);

    const userResult = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.city, u.address, 
        u.avatar_url, u.company_name, u.is_active, 
        u.longitude, u.latitude, u.created_at, u.updated_at,
        -- Для бизнес-пользователей получаем информацию о ресторане
        r.company_name as restaurant_name,
        r.bin as restaurant_bin,
        r.director_first_name,
        r.director_last_name,
        r.opening_time,
        r.closing_time,
        r.address as restaurant_address,
        r.city as restaurant_city,
        r.logo_url
       FROM users u
       LEFT JOIN restaurants r ON u.id = r.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = userResult.rows[0];

    // Если это бизнес-пользователь, получаем его продукты
    if (user.role === 'business' || user.role === 'buisness') {
      const productsResult = await pool.query(
        `SELECT 
          article, name, price, quantity, composition,
          image_url, ingredients, status, updated_at
         FROM dishes 
         WHERE restaurant_id = $1
         ORDER BY name`,
        [id]
      );

      user.products = productsResult.rows;
      user.products_count = productsResult.rows.length;
    }

    // Получаем заказы пользователя
    const ordersResult = await pool.query(
      `SELECT 
        id, order_number, total_amount, status,
        payment_status, created_at, restaurant_id
       FROM orders 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    user.recent_orders = ordersResult.rows;
    user.orders_count = ordersResult.rows.length;

    // Получаем карты пользователя
    const cardsResult = await pool.query(
      `SELECT 
        id, card_holder_name, card_last4, card_type,
        expiry_month, expiry_year, is_default, balance
       FROM user_cards 
       WHERE user_id = $1`,
      [id]
    );

    user.cards = cardsResult.rows;

    console.log(`✅ Данные пользователя ${user.email} получены`);

    res.json({
      success: true,
      user,
      message: 'Данные пользователя получены'
    });
  } catch (error) {
    console.error('❌ Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении пользователя'
    });
  }
});

// Обновить пользователя
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      city,
      address,
      company_name,
      is_active,
      longitude,
      latitude,
      logo_url,
      avatar_url,
      bin,
      director_first_name,
      director_last_name,
      opening_time,
      closing_time,
      password
    } = req.body;

    console.log(`🔄 Обновление пользователя ID: ${id}`, {
      name, email, role, is_active
    });

    // Проверяем, существует ли пользователь и получаем полные данные для лога
    const existingResult = await pool.query(
      `SELECT u.*, r.bin, r.director_first_name, r.director_last_name, 
              r.opening_time, r.closing_time, r.logo_url as restaurant_logo
       FROM users u 
       LEFT JOIN restaurants r ON u.id = r.user_id 
       WHERE u.id = $1`,
      [id]
    );

    if (!existingResult.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const existingUser = existingResult.rows[0];

    // Проверяем уникальность email (если меняется)
    if (email && email !== existingUser.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows[0]) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }
    }

    // Обновляем пользователя
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           city = COALESCE($5, city),
           address = COALESCE($6, address),
           company_name = COALESCE($7, company_name),
           is_active = COALESCE($8, is_active),
           longitude = COALESCE($9, longitude),
           latitude = COALESCE($10, latitude),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING 
         id, name, email, phone, role, city, address,
         avatar_url, company_name, is_active, 
         longitude, latitude, created_at, updated_at`,
      [
        name,
        email,
        phone,
        role,
        city,
        address,
        company_name,
        is_active !== undefined ? is_active : true,
        longitude,
        latitude,
        id
      ]
    );

    console.log(`✅ Пользователь ${result.rows[0].email} обновлен`);

    // Calculate changes for detailed log message
    const changes = [];
    if (name && name !== existingUser.name) changes.push(`имя (${existingUser.name} -> ${name})`);
    if (email && email !== existingUser.email) changes.push(`email (${existingUser.email} -> ${email})`);
    if (phone && phone !== existingUser.phone) changes.push(`телефон (${existingUser.phone || 'нет'} -> ${phone})`);
    if (role && role !== existingUser.role) changes.push(`роль (${existingUser.role} -> ${role})`);
    if (city && city !== existingUser.city) changes.push(`город (${existingUser.city || 'нет'} -> ${city})`);
    if (is_active !== undefined && is_active !== existingUser.is_active) changes.push(`статус (${existingUser.is_active ? 'активен' : 'заблокирован'} -> ${is_active ? 'активен' : 'заблокирован'})`);

    // If this is a business user, update the restaurants table with all business-specific info
    const targetRole = role || existingUser.role;
    if (targetRole === 'business' || targetRole === 'buisness') {
      const effectiveLogo = logo_url || avatar_url || null;

      // Check if a password update was requested
      if (password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await pool.query(
          `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [passwordHash, id]
        );
      }

      // Check if restaurant entry exists
      const restaurantCheck = await pool.query(
        'SELECT id FROM restaurants WHERE user_id = $1',
        [id]
      );

      if (restaurantCheck.rows[0]) {
        // Update existing restaurant entry
        await pool.query(
          `UPDATE restaurants 
           SET company_name = $1,
               bin = $2,
               director_first_name = $3,
               director_last_name = $4,
               opening_time = $5,
               closing_time = $6,
               city = $7,
               logo_url = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $9`,
          [
            company_name !== undefined ? company_name : existingUser.company_name,
            bin !== undefined ? bin : existingUser.bin,
            director_first_name !== undefined ? director_first_name : existingUser.director_first_name,
            director_last_name !== undefined ? director_last_name : existingUser.director_last_name,
            opening_time !== undefined ? opening_time : existingUser.opening_time,
            closing_time !== undefined ? closing_time : existingUser.closing_time,
            city !== undefined ? city : existingUser.city,
            logo_url !== undefined ? logo_url : existingUser.restaurant_logo,
            id
          ]
        );
        console.log(`✅ Ресторан обновлен для пользователя ${id}, logo: ${effectiveLogo ? 'yes' : 'no'}`);

        // Add business changes to log
        if (company_name && company_name !== existingUser.company_name) changes.push(`название заведения (${existingUser.company_name || 'нет'} -> ${company_name})`);
        if (bin && bin !== existingUser.bin) changes.push(`БИН (${existingUser.bin || 'нет'} -> ${bin})`);
        if (opening_time && opening_time !== existingUser.opening_time) changes.push(`часы открытия (${existingUser.opening_time || '09:00'} -> ${opening_time})`);
        if (closing_time && closing_time !== existingUser.closing_time) changes.push(`часы закрытия (${existingUser.closing_time || '22:00'} -> ${closing_time})`);
        if (effectiveLogo && effectiveLogo !== existingUser.restaurant_logo) changes.push(`логотип обновлен`);
      } else if (company_name) {
        // Create restaurant entry if it doesn't exist yet
        await pool.query(
          `INSERT INTO restaurants (user_id, company_name, bin, director_first_name, director_last_name, opening_time, closing_time, city, logo_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id) DO NOTHING`,
          [
            id,
            company_name,
            bin || null,
            director_first_name || null,
            director_last_name || null,
            opening_time || null,
            closing_time || null,
            city || null,
            effectiveLogo
          ]
        );
        console.log(`✅ Ресторан создан для пользователя ${id}`);
      }

      // Also update avatar_url in users table if logo provided
      if (effectiveLogo) {
        await pool.query(
          `UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [effectiveLogo, id]
        );
      }
    } else if (company_name) {
      // Non-business but updating company name — just update the users table (already handled above)
    }

    // LOGGING
    const detailMsg = changes.length > 0 ? `: изменено ${changes.join(', ')}` : ' (без изменений данных)';
    await logAction(
      req.user.id,
      'UPDATE_USER',
      `Администратор обновил ${targetRole === 'business' ? 'заведение' : 'пользователя'} ${name || result.rows[0].name}${detailMsg}`,
      { previous: existingUser, current: result.rows[0], userId: id }
    );

    res.json({
      success: true,
      user: result.rows[0],
      message: 'Пользователь обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении пользователя',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Удалить пользователя
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  let client;

  try {
    const { id } = req.params;

    console.log(`🗑️ Удаление пользователя ID: ${id}`);

    // Не позволяем удалить самого себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить свой собственный аккаунт'
      });
    }

    client = await pool.connect();
    await client.query('BEGIN');

    // Проверяем, существует ли пользователь
    const existingUser = await client.query(
      'SELECT role, email, company_name FROM users WHERE id = $1',
      [id]
    );

    if (!existingUser.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const user = existingUser.rows[0];
    const isBusiness = user.role === 'business' || user.role === 'buisness';

    console.log(`🗑️ Удаление пользователя: ${user.email}, бизнес: ${isBusiness}`);

    // Удаляем связанные данные
    if (isBusiness) {
      // Получаем все продукты бизнеса
      const productsResult = await client.query(
        'SELECT article FROM dishes WHERE restaurant_id = $1',
        [id]
      );

      console.log(`🗑️ Удаление ${productsResult.rows.length} продуктов бизнеса`);

      // Удаляем продукты из корзин
      for (const product of productsResult.rows) {
        await client.query(
          'DELETE FROM cart_items WHERE dish_article = $1',
          [product.article]
        );
      }

      // Удаляем продукты
      await client.query('DELETE FROM dishes WHERE restaurant_id = $1', [id]);

      // Получаем заказы бизнеса
      const businessOrders = await client.query(
        'SELECT id FROM orders WHERE restaurant_id = $1',
        [id]
      );

      console.log(`🗑️ Удаление ${businessOrders.rows.length} заказов бизнеса`);

      // Удаляем элементы заказов
      for (const order of businessOrders.rows) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
      }

      // Удаляем заказы
      await client.query('DELETE FROM orders WHERE restaurant_id = $1', [id]);

      // Удаляем из restaurants
      await client.query('DELETE FROM restaurants WHERE user_id = $1', [id]);
    }

    // Удаляем карты пользователя
    const cardsCount = await client.query(
      'DELETE FROM user_cards WHERE user_id = $1 RETURNING id',
      [id]
    );
    console.log(`🗑️ Удалено ${cardsCount.rows.length} карт`);

    // Удаляем аватары
    const avatarsCount = await client.query(
      'DELETE FROM user_avatars WHERE user_id = $1 RETURNING id',
      [id]
    );
    console.log(`🗑️ Удалено ${avatarsCount.rows.length} аватаров`);

    // Удаляем корзину
    const cartCount = await client.query(
      'DELETE FROM cart_items WHERE user_id = $1 RETURNING id',
      [id]
    );
    console.log(`🗑️ Удалено ${cartCount.rows.length} элементов корзины`);

    // Если не бизнес, удаляем заказы пользователя
    if (!isBusiness) {
      const userOrders = await client.query(
        'SELECT id FROM orders WHERE user_id = $1',
        [id]
      );

      console.log(`🗑️ Удаление ${userOrders.rows.length} заказов пользователя`);

      for (const order of userOrders.rows) {
        await client.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
      }

      await client.query('DELETE FROM orders WHERE user_id = $1', [id]);
    }

    // Удаляем запросы на партнерство
    const partnershipCount = await client.query(
      'DELETE FROM partnership_requests WHERE user_id = $1 RETURNING id',
      [id]
    );
    console.log(`🗑️ Удалено ${partnershipCount.rows.length} запросов на партнерство`);

    // Удаляем пользователя
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    console.log(`✅ Пользователь ${user.email} полностью удален`);

    // LOGGING
    await logAction(
      req.user.id,
      'DELETE_USER',
      `Администратор удалил пользователя ${user.email} (ID: ${id})`,
      { deletedUser: user, wasBusiness: isBusiness }
    );

    res.json({
      success: true,
      message: 'Пользователь удален',
      deleted_user: {
        id: parseInt(id),
        email: user.email,
        role: user.role,
        was_business: isBusiness
      }
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Ошибка удаления пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении пользователя'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ==================== АВАТАРЫ ====================

// Загрузить аватар для конкретного пользователя (админ)
router.put('/users/:id/avatar', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'URL аватара не предоставлен' });
    }

    // Проверяем существование пользователя
    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    // Сохраняем в таблицу user_avatars
    const avatarRecord = await pool.query(
      `INSERT INTO user_avatars (
        user_id, avatar_url, file_name, mime_type, file_size, is_current, uploaded_at
      ) 
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id`,
      [id, avatarUrl, 'admin_upload.png', 'image/png', 0]
    );

    // Делаем предыдущие аватары неактивными
    await pool.query(
      'UPDATE user_avatars SET is_current = false WHERE user_id = $1 AND id != $2',
      [id, avatarRecord.rows[0].id]
    );

    // Обновляем аватар в основной таблице пользователей
    const updatedUser = await pool.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, avatar_url`,
      [avatarUrl, id]
    );

    // LOGGING
    await logAction(
      req.user.id,
      'UPDATE_USER_AVATAR',
      `Администратор обновил аватар пользователя ${updatedUser.rows[0].email} (ID: ${id})`,
      { userId: id, avatarUrl, previousAvatarUrl: userResult.rows[0].avatar_url }
    );

    res.json({ success: true, user: updatedUser.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка загрузки аватара админом:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// ==================== ПРОДУКТЫ ====================

// Получить все продукты (с фильтрами)
router.get('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      restaurantId = '', // Changed from 'company' to 'restaurantId'
      status = '',
      min_price = '',
      max_price = '',
      sort_by = 'updated_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        d.article,
        d.name,
        d.price,
        d.quantity,
        d.composition,
        d.category,
        d.image_url,
        d.image,
        d.ingredients,
        d.status,
        d.restaurant_id,
        r.company_name as company_name,
        r.user_id as company_user_id,
        d.updated_at,
        d.created_at
      FROM dishes d
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (d.name ILIKE $${paramCount} OR d.ingredients ILIKE $${paramCount} OR d.composition ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      query += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    if (restaurantId) {
      paramCount++;
      query += ` AND d.restaurant_id = $${paramCount}`;
      params.push(restaurantId);
    }

    if (status) {
      paramCount++;
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
    }

    if (min_price) {
      paramCount++;
      query += ` AND d.price >= $${paramCount}`;
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      paramCount++;
      query += ` AND d.price <= $${paramCount}`;
      params.push(parseFloat(max_price));
    }

    // Добавляем сортировку
    const validSortColumns = ['name', 'price', 'quantity', 'updated_at', 'created_at', 'company_name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'updated_at';
    const validSortOrders = ['ASC', 'DESC'];
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    console.log('🔍 Запрос продуктов:', { query, params });

    const productsResult = await pool.query(query, params);

    // Получаем статистику
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN d.status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN d.quantity > 0 THEN 1 END) as in_stock,
        COUNT(CASE WHEN d.quantity <= 0 THEN 1 END) as out_of_stock,
        COUNT(DISTINCT d.category) as categories,
        COUNT(DISTINCT r.company_name) as companies,
        COALESCE(AVG(d.price), 0) as avg_price,
        COALESCE(MIN(d.price), 0) as min_price,
        COALESCE(MAX(d.price), 0) as max_price
      FROM dishes d
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE 1=1
    `;

    const statsParams = [];
    let statsParamCount = 0;

    if (search) {
      statsParamCount++;
      statsQuery += ` AND (d.name ILIKE $${statsParamCount} OR d.ingredients ILIKE $${statsParamCount} OR d.composition ILIKE $${statsParamCount})`;
      statsParams.push(`%${search}%`);
    }

    if (category) {
      statsParamCount++;
      statsQuery += ` AND d.category = $${statsParamCount}`;
      statsParams.push(category);
    }

    if (restaurantId) {
      statsParamCount++;
      statsQuery += ` AND d.restaurant_id = $${statsParamCount}`;
      statsParams.push(restaurantId);
    }

    if (status) {
      statsParamCount++;
      statsQuery += ` AND d.status = $${statsParamCount}`;
      statsParams.push(status);
    }

    const statsResult = await pool.query(statsQuery, statsParams);

    // Получаем уникальные категории и компании для фильтров
    const categoriesResult = await pool.query(
      'SELECT DISTINCT category FROM dishes WHERE category IS NOT NULL ORDER BY category'
    );

    const companiesResult = await pool.query(
      'SELECT DISTINCT r.company_name FROM restaurants r JOIN dishes d ON r.id = d.restaurant_id WHERE r.company_name IS NOT NULL ORDER BY r.company_name'
    );

    console.log(`✅ Найдено ${productsResult.rows.length} продуктов`);

    res.json({
      success: true,
      products: productsResult.rows,
      filters: {
        categories: categoriesResult.rows.map(c => c.category),
        companies: companiesResult.rows.map(c => c.company_name),
        statuses: ['active', 'inactive']
      },
      stats: statsResult.rows[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(statsResult.rows[0].total),
        pages: Math.ceil(statsResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения продуктов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении продуктов'
    });
  }
});

// Получить конкретный продукт
router.get('/products/:article', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { article } = req.params;

    console.log(`🔍 Запрос продукта article: ${article}`);

    const productResult = await pool.query(
      `SELECT 
        d.article,
        d.name,
        d.price,
        d.quantity,
        d.composition,
        d.category,
        d.image_url,
        d.image,
        d.ingredients,
        d.status,
        d.restaurant_id,
        u.company_name,
        u.email as company_email,
        u.phone as company_phone,
        d.updated_at,
        d.created_at
      FROM dishes d
      JOIN users u ON d.restaurant_id = u.id
      WHERE d.article = $1`,
      [article]
    );

    if (!productResult.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    console.log(`✅ Продукт найден: ${productResult.rows[0].name}`);

    res.json({
      success: true,
      product: productResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка получения продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении продукта'
    });
  }
});

// Обновить продукт
router.put('/products/:article', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { article } = req.params;
    const {
      name,
      price,
      quantity,
      composition,
      category,
      image_url,
      image,
      ingredients,
      status
    } = req.body;

    console.log(`🔄 Обновление продукта article: ${article}`, {
      name, price, status
    });

    // Проверяем, существует ли продукт
    const existingProduct = await pool.query(
      'SELECT article, name FROM dishes WHERE article = $1',
      [article]
    );

    if (!existingProduct.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    // Обрабатываем изображение
    const productImageUrl = image_url || image;

    // Обновляем продукт
    const result = await pool.query(
      `UPDATE dishes 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           quantity = COALESCE($3, quantity),
           composition = COALESCE($4, composition),
           category = COALESCE($5, category),
           image_url = COALESCE($6, image_url),
           image = COALESCE($7, image),
           ingredients = COALESCE($8, ingredients),
           status = COALESCE($9, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE article = $10
       RETURNING 
         article, name, price, quantity, composition, 
         category, image_url, image, ingredients, 
         status, updated_at, created_at`,
      [
        name,
        price,
        quantity,
        composition,
        category,
        productImageUrl,
        productImageUrl, // update both fields if they exist
        ingredients,
        status,
        article
      ]
    );

    // Calculate changes for detailed log message
    const p = existingProduct.rows[0];
    const n = result.rows[0];
    const changes = [];
    if (name && name !== p.name) changes.push(`название (${p.name} -> ${n.name})`);
    if (price !== undefined && parseFloat(price) !== parseFloat(p.price || 0)) changes.push(`цена (${p.price} -> ${n.price})`);
    if (quantity !== undefined && parseInt(quantity) !== parseInt(p.quantity || 0)) changes.push(`кол-во (${p.quantity} -> ${n.quantity})`);
    if (category && category !== p.category) changes.push(`кат. (${p.category} -> ${n.category})`);
    if (status && status !== p.status) changes.push(`стат. (${p.status} -> ${n.status})`);

    const detailMsg = changes.length > 0 ? `: изменено ${changes.join(', ')}` : ' (без изменений данных)';

    // LOGGING
    await logAction(
      req.user.id,
      'UPDATE_PRODUCT',
      `Администратор обновил продукт ${result.rows[0].name}${detailMsg}`,
      { previous: p, current: n, article }
    );

    res.json({
      success: true,
      product: result.rows[0],
      message: 'Продукт обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении продукта',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Удалить продукт
router.delete('/products/:article', authMiddleware, adminMiddleware, async (req, res) => {
  let client;

  try {
    const { article } = req.params;

    console.log(`🗑️ Удаление продукта article: ${article}`);

    client = await pool.connect();
    await client.query('BEGIN');

    // Проверяем, существует ли продукт
    const existingProduct = await client.query(
      'SELECT article, name, restaurant_id FROM dishes WHERE article = $1',
      [article]
    );

    if (!existingProduct.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    const product = existingProduct.rows[0];
    console.log(`🗑️ Удаление продукта: ${product.name}`);

    // Удаляем из корзин
    const cartDeleteResult = await client.query(
      'DELETE FROM cart_items WHERE dish_article = $1 RETURNING id',
      [article]
    );
    console.log(`🗑️ Удалено ${cartDeleteResult.rows.length} элементов из корзин`);

    // Удаляем продукт
    await client.query('DELETE FROM dishes WHERE article = $1', [article]);

    await client.query('COMMIT');

    console.log(`✅ Продукт ${product.name} удален`);

    // LOGGING
    await logAction(
      req.user.id,
      'DELETE_PRODUCT',
      `Администратор удалил продукт ${product.name} (Артикул: ${article})`,
      { deletedProduct: product }
    );

    res.json({
      success: true,
      message: 'Продукт удален',
      deleted_product: {
        article: product.article,
        name: product.name,
        restaurant_id: product.restaurant_id,
        removed_from_carts: cartDeleteResult.rows.length
      }
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Ошибка удаления продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении продукта'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Создать продукт (админ)
router.post('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, price, quantity, composition, category, image_url, image, ingredients, status, restaurant_id } = req.body;

    if (!name || !price || !restaurant_id) {
      return res.status(400).json({ success: false, message: 'Название, цена и ID заведения обязательны' });
    }

    const article = `PROD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const productImageUrl = image_url || image || '';

    const result = await pool.query(
      `INSERT INTO dishes (article, name, price, quantity, composition, category, image_url, image, ingredients, status, restaurant_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       RETURNING article, name, price, quantity, category, status`,
      [article, name, parseFloat(price), parseInt(quantity) || 0, composition || '', category || '', productImageUrl, productImageUrl, ingredients || '', status || 'active', restaurant_id]
    );

    await logAction(req.user.id, 'CREATE_PRODUCT', `Администратор создал продукт ${name} для заведения (ID: ${restaurant_id})`, { product: result.rows[0] });

    res.json({ success: true, product: result.rows[0], message: 'Продукт создан' });
  } catch (error) {
    console.error('❌ Ошибка создания продукта:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при создании продукта' });
  }
});

// ==================== КАТЕГОРИИ ====================

// Получить все категории
router.get('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categoriesResult = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(d.article) as product_count
       FROM categories c
       LEFT JOIN dishes d ON c.id = d.category_id
       GROUP BY c.id, c.name, c.description
       ORDER BY c.name`
    );

    res.json({
      success: true,
      categories: categoriesResult.rows
    });
  } catch (error) {
    console.error('❌ Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении категорий'
    });
  }
});

// Создать категорию
router.post('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название категории обязательно'
      });
    }

    // Проверяем, существует ли категория
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows[0]) {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием уже существует'
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description`,
      [name, description || '']
    );

    res.json({
      success: true,
      category: result.rows[0],
      message: 'Категория создана'
    });
  } catch (error) {
    console.error('❌ Ошибка создания категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании категории'
    });
  }
});

// ==================== СТАТИСТИКА СИСТЕМЫ ====================

// Получить статистику системы
router.get('/stats/system', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('📊 Запрос статистики системы');

    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role IN ('business', 'buisness') THEN 1 END) as businesses,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as customers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        DATE(created_at) as date,
        COUNT(*) as daily_registrations
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    const productsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
        COUNT(CASE WHEN quantity > 0 THEN 1 END) as in_stock,
        COUNT(CASE WHEN quantity <= 0 THEN 1 END) as out_of_stock,
        COUNT(DISTINCT restaurant_id) as companies_with_products,
        COALESCE(AVG(price), 0) as avg_price,
        COALESCE(SUM(price * quantity), 0) as total_inventory_value
      FROM dishes
    `);

    const ordersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(AVG(final_amount), 0) as avg_order_value,
        DATE(created_at) as date,
        COUNT(*) as daily_orders,
        COALESCE(SUM(final_amount), 0) as daily_revenue
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    const partnershipStats = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_requests,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        DATE(created_at) as date,
        COUNT(*) as daily_requests
      FROM partnership_requests
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    const cardsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN is_default = true THEN 1 END) as default_cards,
        COALESCE(SUM(balance), 0) as total_balance,
        COUNT(DISTINCT user_id) as users_with_cards
      FROM user_cards
    `);

    const restaurantsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_restaurants,
        COUNT(DISTINCT city) as cities_count,
        COUNT(CASE WHEN is_open = true THEN 1 END) as open_restaurants,
        COUNT(CASE WHEN is_open = false THEN 1 END) as closed_restaurants,
        COALESCE(AVG(rating), 0) as avg_rating
      FROM restaurants
    `);

    console.log('✅ Статистика системы получена');

    res.json({
      success: true,
      stats: {
        users: usersStats.rows,
        products: productsStats.rows[0],
        orders: ordersStats.rows,
        partnership: partnershipStats.rows,
        cards: cardsStats.rows[0],
        restaurants: restaurantsStats.rows[0],
        summary: {
          total_users: usersStats.rows.reduce((sum, row) => sum + parseInt(row.total_users), 0),
          total_products: productsStats.rows[0]?.total_products || 0,
          total_orders: ordersStats.rows.reduce((sum, row) => sum + parseInt(row.total_orders), 0),
          total_revenue: ordersStats.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0),
          total_partnership_requests: partnershipStats.rows.reduce((sum, row) => sum + parseInt(row.total_requests), 0)
        }
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики системы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статистики'
    });
  }
});

// ==================== СОЗДАНИЕ БИЗНЕС-АККАУНТА ====================

// Создать бизнес-аккаунт (админ)
router.post('/users/business', authMiddleware, adminMiddleware, async (req, res) => {
  let client;

  try {
    const {
      name,
      email,
      password,
      phone,
      city,
      address,
      companyName,
      bin,
      directorFirstName,
      directorLastName,
      openingTime = '09:00',
      closingTime = '23:00',
      logo_url
    } = req.body;

    console.log('🏪 Создание бизнес-аккаунта:', { email, companyName });

    // Проверяем обязательные поля (Relaxed as requested)
    if (!email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Email, пароль и название компании обязательны'
      });
    }

    // Проверяем уникальность email
    const emailExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (emailExists.rows[0]) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    client = await pool.connect();
    await client.query('BEGIN');

    // Создаем пользователя
    const userResult = await client.query(
      `INSERT INTO users (
        name, email, password, phone, role, city, address,
        company_name, is_active, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
      RETURNING id, email, role, company_name, name`,
      [
        name,
        email.toLowerCase(),
        passwordHash,
        phone || null,
        'business',
        city || null,
        address || null,
        companyName
      ]
    );

    const userId = userResult.rows[0].id;
    console.log(`✅ Пользователь создан: ${email}, ID: ${userId}`);

    // Создаем запись в restaurants
    await client.query(
      `INSERT INTO restaurants (
        user_id, company_name, bin, director_first_name, 
        director_last_name, opening_time, closing_time, 
        city, address, logo_url, is_open, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, CURRENT_TIMESTAMP)`,
      [
        userId,
        companyName,
        bin || '',
        directorFirstName || '',
        directorLastName || '',
        openingTime,
        closingTime,
        city || '',
        address || '',
        logo_url || null
      ]
    );

    // If logo was provided, update avatar_url in users table too
    if (logo_url) {
      await client.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2`,
        [logo_url, userId]
      );
    }

    console.log(`✅ Ресторан создан для пользователя ${userId}`);

    await client.query('COMMIT');

    // LOGGING
    await logAction(
      req.user.id,
      'CREATE_BUSINESS',
      `Администратор создал бизнес-аккаунт для ${companyName} (${email})`,
      { createdUser: userResult.rows[0], companyName, userId: userId }
    );

    res.json({
      success: true,
      message: 'Бизнес-аккаунт создан',
      user: userResult.rows[0],
      credentials: {
        email: email,
        password: password,
        note: 'Сохраните эти данные для входа'
      }
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Ошибка создания бизнес-аккаунта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании бизнес-аккаунта',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;