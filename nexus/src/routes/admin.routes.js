// nexus/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');

const adminMiddleware = roleMiddleware('admin');

// ==================== ПОЛЬЗОВАТЕЛИ ====================

// Получить всех пользователей с пагинацией и фильтрами
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      is_active = '',
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id, name, email, phone, role, city, address, 
        avatar_url, company_name, is_active, 
        created_at, updated_at,
        longitude, latitude
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (
        name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        phone ILIKE $${paramCount} OR
        company_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (is_active !== '') {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    // Добавляем сортировку
    const validSortColumns = ['id', 'name', 'email', 'created_at', 'updated_at', 'role'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrders = ['ASC', 'DESC'];
    const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    
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
      success: false, 
      message: 'Ошибка сервера при получении пользователей',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      latitude
    } = req.body;

    console.log(`🔄 Обновление пользователя ID: ${id}`, { 
      name, email, role, is_active 
    });

    // Проверяем, существует ли пользователь
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (!existingUser.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем уникальность email (если меняется)
    if (email && email !== existingUser.rows[0].email) {
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

    // Если это бизнес-пользователь, обновляем и ресторан
    if ((role === 'business' || role === 'buisness') && company_name) {
      await pool.query(
        `UPDATE restaurants 
         SET company_name = COALESCE($1, company_name),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [company_name, id]
      );
    }

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

// ==================== ПРОДУКТЫ ====================

// Получить все продукты (с фильтрами)
router.get('/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = '', 
      company = '',
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
        d.category_id,
        c.name as category_name,
        d.image_url,
        d.image,
        d.ingredients,
        d.status,
        d.restaurant_id,
        u.company_name,
        u.id as company_user_id,
        d.updated_at,
        d.created_at
      FROM dishes d
      LEFT JOIN categories c ON d.category_id = c.id
      JOIN users u ON d.restaurant_id = u.id
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
      query += ` AND c.name = $${paramCount}`;
      params.push(category);
    }

    if (company) {
      paramCount++;
      query += ` AND u.company_name = $${paramCount}`;
      params.push(company);
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
        COUNT(DISTINCT c.name) as categories,
        COUNT(DISTINCT u.company_name) as companies,
        COALESCE(AVG(d.price), 0) as avg_price,
        COALESCE(MIN(d.price), 0) as min_price,
        COALESCE(MAX(d.price), 0) as max_price
      FROM dishes d
      LEFT JOIN categories c ON d.category_id = c.id
      JOIN users u ON d.restaurant_id = u.id
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
      statsQuery += ` AND c.name = $${statsParamCount}`;
      statsParams.push(category);
    }

    if (company) {
      statsParamCount++;
      statsQuery += ` AND u.company_name = $${statsParamCount}`;
      statsParams.push(company);
    }

    if (status) {
      statsParamCount++;
      statsQuery += ` AND d.status = $${statsParamCount}`;
      statsParams.push(status);
    }

    const statsResult = await pool.query(statsQuery, statsParams);

    // Получаем уникальные категории и компании для фильтров
    const categoriesResult = await pool.query(
      'SELECT DISTINCT c.name FROM categories c ORDER BY c.name'
    );
    
    const companiesResult = await pool.query(
      'SELECT DISTINCT u.company_name FROM users u JOIN dishes d ON u.id = d.restaurant_id WHERE u.company_name IS NOT NULL ORDER BY u.company_name'
    );

    console.log(`✅ Найдено ${productsResult.rows.length} продуктов`);

    res.json({
      success: true,
      products: productsResult.rows,
      filters: {
        categories: categoriesResult.rows.map(c => c.name),
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
        d.category_id,
        c.name as category_name,
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
      LEFT JOIN categories c ON d.category_id = c.id
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
      category_id,
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

    // Проверяем, существует ли категория
    if (category_id) {
      const categoryCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [category_id]
      );
      
      if (!categoryCheck.rows[0]) {
        return res.status(400).json({
          success: false,
          message: 'Категория не найдена'
        });
      }
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
           category_id = COALESCE($5, category_id),
           image_url = COALESCE($6, image_url),
           image = COALESCE($7, image),
           ingredients = COALESCE($8, ingredients),
           status = COALESCE($9, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE article = $10
       RETURNING 
         article, name, price, quantity, composition,
         category_id, image_url, image, ingredients, 
         status, restaurant_id, updated_at`,
      [
        name,
        price ? parseFloat(price) : undefined,
        quantity ? parseInt(quantity) : undefined,
        composition,
        category_id ? parseInt(category_id) : undefined,
        productImageUrl,
        productImageUrl,
        ingredients,
        status,
        article
      ]
    );

    console.log(`✅ Продукт обновлен: ${result.rows[0].name}`);

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
      closingTime = '23:00'
    } = req.body;

    console.log('🏪 Создание бизнес-аккаунта:', { email, companyName });

    // Проверяем обязательные поля
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Имя, email, пароль и название компании обязательны'
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
        city, address, is_open, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP)`,
      [
        userId,
        companyName,
        bin || '',
        directorFirstName || '',
        directorLastName || '',
        openingTime,
        closingTime,
        city || '',
        address || ''
      ]
    );

    console.log(`✅ Ресторан создан для пользователя ${userId}`);

    await client.query('COMMIT');

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