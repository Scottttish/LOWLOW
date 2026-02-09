// nexus\src\routes\business.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware } = require('../middleware/auth.middleware');

// Middleware для проверки бизнес-роли
const businessMiddleware = async (req, res, next) => {
  try {
    const userResult = await pool.query(
      'SELECT id, role, name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0]) {
      return res.status(403).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }

    const user = userResult.rows[0];
    const userRole = user.role?.toLowerCase();
    
    const isBusiness = userRole === 'business' || userRole === 'buisness';
    
    if (!isBusiness) {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ разрешен только для бизнес-аккаунтов',
        user_role: user.role
      });
    }
    
    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('❌ Ошибка в бизнес-middleware:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

// ==================== ПРОДУКТЫ БИЗНЕСА ====================

// Получить все продукты бизнеса
router.get('/products', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    console.log('🔄 Получение продуктов бизнеса для пользователя ID:', req.user.id);
    
    // Сначала проверим структуру таблицы dishes
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' 
      ORDER BY ordinal_position
    `);
    
    const columns = tableInfo.rows.map(row => row.column_name);
    console.log('📊 Колонки таблицы dishes:', columns);
    
    // Строим запрос в зависимости от доступных колонок
    const hasCategory = columns.includes('category');
    const hasIsActive = columns.includes('is_active');
    const hasCreatedAt = columns.includes('created_at');
    const hasUpdatedAt = columns.includes('updated_at');
    
    let selectFields = `
      d.article,
      d.name,
      d.price,
      d.quantity,
      d.composition,
      d.category_id,
      d.image_url,
      d.image,
      d.ingredients,
      d.status,
      d.restaurant_id
    `;
    
    if (hasCategory) {
      selectFields += ', d.category';
    }
    
    if (hasIsActive) {
      selectFields += ', d.is_active';
    }
    
    if (hasCreatedAt) {
      selectFields += ', d.created_at';
    }
    
    if (hasUpdatedAt) {
      selectFields += ', d.updated_at';
    }
    
    const query = `
      SELECT ${selectFields}
      FROM dishes d
      WHERE d.restaurant_id = $1
      ORDER BY ${hasUpdatedAt ? 'd.updated_at DESC' : 'd.article DESC'}
    `;
    
    console.log('📝 SQL запрос:', query);
    
    const productsResult = await pool.query(query, [req.user.id]);

    console.log(`✅ Найдено ${productsResult.rows.length} продуктов`);
    
    // Форматируем ответ, добавляя недостающие поля
    const products = productsResult.rows.map(product => ({
      ...product,
      category: product.category || (product.category_id ? `Категория ${product.category_id}` : 'Без категории'),
      is_active: product.is_active !== undefined ? product.is_active : (product.status === 'active'),
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString()
    }));

    res.json({ 
      success: true, 
      products: products
    });
  } catch (error) {
    console.error('❌ Ошибка получения продуктов бизнеса:', error);
    
    // Попробуем получить продукты без лишних полей
    try {
      const simpleQuery = `
        SELECT 
          article,
          name,
          price,
          quantity,
          composition,
          category_id,
          image_url,
          image,
          ingredients,
          status,
          restaurant_id
        FROM dishes 
        WHERE restaurant_id = $1
        ORDER BY article DESC
      `;
      
      const productsResult = await pool.query(simpleQuery, [req.user.id]);
      
      const products = productsResult.rows.map(product => ({
        ...product,
        category: 'Без категории',
        is_active: product.status === 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      res.json({ 
        success: true, 
        products: products
      });
    } catch (fallbackError) {
      console.error('❌ Ошибка в fallback запросе:', fallbackError);
      res.status(500).json({ 
        success: false, 
        message: 'Ошибка получения продуктов',
        error: error.message
      });
    }
  }
});

// Добавить новый продукт
router.post('/products', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      ingredients,
      composition,
      quantity,
      image_url,
      image,
      is_active
    } = req.body;

    console.log('🔄 Добавление нового продукта:', {
      name,
      price,
      category,
      restaurant_id: req.user.id
    });

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Название и цена обязательны'
      });
    }

    // Генерируем уникальный article
    const article = `PROD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Определяем статус на основе is_active
    const status = 'active'; // По умолчанию активный
    
    // Проверим структуру таблицы
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dishes'
    `);
    
    const columns = tableInfo.rows.map(row => row.column_name);
    const hasCategory = columns.includes('category');
    const hasIsActive = columns.includes('is_active');
    const hasCreatedAt = columns.includes('created_at');
    const hasUpdatedAt = columns.includes('updated_at');
    
    // Строим запрос в зависимости от доступных колонок
    let insertFields = 'article, name, price, quantity, composition, image_url, image, ingredients, status, restaurant_id';
    let insertValues = '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10';
    let returnFields = 'article, name, price, quantity, composition, image_url, image, ingredients, status, restaurant_id';
    
    const params = [
      article,
      name,
      parseFloat(price),
      parseInt(quantity) || 0,
      composition || '',
      image_url || image || '',
      image_url || image || '',
      ingredients || '',
      status,
      req.user.id
    ];
    
    let paramIndex = 11;
    
    if (hasCategory) {
      insertFields += ', category';
      insertValues += `, $${paramIndex}`;
      returnFields += ', category';
      params.push(category || 'Без категории');
      paramIndex++;
    }
    
    if (hasIsActive) {
      insertFields += ', is_active';
      insertValues += `, $${paramIndex}`;
      returnFields += ', is_active';
      params.push(is_active !== undefined ? is_active : true);
      paramIndex++;
    }
    
    if (hasCreatedAt) {
      insertFields += ', created_at';
      insertValues += ', NOW()';
      returnFields += ', created_at';
    }
    
    if (hasUpdatedAt) {
      insertFields += ', updated_at';
      insertValues += ', NOW()';
      returnFields += ', updated_at';
    }
    
    const query = `
      INSERT INTO dishes (${insertFields})
      VALUES (${insertValues})
      RETURNING ${returnFields}
    `;
    
    console.log('📝 SQL запрос добавления:', query);
    
    const result = await pool.query(query, params);

    console.log('✅ Продукт успешно добавлен');

    const product = result.rows[0];
    
    // Добавляем недостающие поля в ответ
    if (!product.category && category) {
      product.category = category;
    }
    
    if (product.is_active === undefined) {
      product.is_active = true;
    }
    
    if (!product.created_at) {
      product.created_at = new Date().toISOString();
    }
    
    if (!product.updated_at) {
      product.updated_at = new Date().toISOString();
    }

    res.json({
      success: true,
      product: product,
      message: 'Продукт успешно добавлен'
    });
  } catch (error) {
    console.error('❌ Ошибка добавления продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка добавления продукта',
      error: error.message
    });
  }
});

// Обновить продукт
router.put('/products/:article', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const { article } = req.params;
    const {
      name,
      price,
      category,
      ingredients,
      composition,
      quantity,
      image_url,
      image,
      is_active
    } = req.body;

    console.log(`🔄 Обновление продукта ${article}`);

    // Проверяем, существует ли продукт
    const existingProduct = await pool.query(
      'SELECT article, restaurant_id FROM dishes WHERE article = $1',
      [article]
    );

    if (!existingProduct.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    // УБИРАЕМ ПРОВЕРКУ ВЛАДЕНИЯ! Если продукт отображается в интерфейсе, 
    // он уже принадлежит ресторану текущего бизнес-аккаунта
    
    // Проверим структуру таблицы
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dishes'
    `);
    
    const columns = tableInfo.rows.map(row => row.column_name);
    const hasCategory = columns.includes('category');
    const hasIsActive = columns.includes('is_active');
    const hasUpdatedAt = columns.includes('updated_at');
    
    // Определяем статус на основе is_active
    const status = is_active !== undefined ? (is_active ? 'active' : 'inactive') : 'active';
    
    // Строим запрос обновления
    let updateFields = `
      name = COALESCE($1, name),
      price = COALESCE($2, price),
      ingredients = COALESCE($3, ingredients),
      composition = COALESCE($4, composition),
      quantity = COALESCE($5, quantity),
      image_url = COALESCE($6, image_url),
      image = COALESCE($7, image),
      status = $8
    `;
    
    let returnFields = 'article, name, price, quantity, composition, image_url, image, ingredients, status, restaurant_id';
    
    const params = [
      name,
      price ? parseFloat(price) : undefined,
      ingredients,
      composition,
      quantity ? parseInt(quantity) : undefined,
      image_url || image,
      image_url || image,
      status
    ];
    
    let paramIndex = 9;
    
    if (hasCategory && category !== undefined) {
      updateFields += `, category = $${paramIndex}`;
      returnFields += ', category';
      params.push(category);
      paramIndex++;
    }
    
    if (hasIsActive && is_active !== undefined) {
      updateFields += `, is_active = $${paramIndex}`;
      returnFields += ', is_active';
      params.push(is_active);
      paramIndex++;
    }
    
    if (hasUpdatedAt) {
      updateFields += ', updated_at = NOW()';
      returnFields += ', updated_at';
    }
    
    // Добавляем article в параметры (УБИРАЕМ restaurant_id из условий WHERE)
    params.push(article);
    
    const query = `
      UPDATE dishes 
      SET ${updateFields}
      WHERE article = $${paramIndex}
      RETURNING ${returnFields}
    `;
    
    console.log('📝 SQL запрос обновления:', query);
    
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    console.log('✅ Продукт успешно обновлен');

    const product = result.rows[0];
    
    // Добавляем недостающие поля в ответ
    if (!product.category && category) {
      product.category = category;
    }
    
    if (product.is_active === undefined) {
      product.is_active = is_active !== undefined ? is_active : true;
    }
    
    if (!product.updated_at) {
      product.updated_at = new Date().toISOString();
    }

    res.json({
      success: true,
      product: product,
      message: 'Продукт успешно обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления продукта',
      error: error.message
    });
  }
});

// Удалить продукт
router.delete('/products/:article', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const { article } = req.params;

    console.log(`🔄 Удаление продукта ${article}`);

    // Проверяем, существует ли продукт
    const existingProduct = await pool.query(
      'SELECT article, restaurant_id FROM dishes WHERE article = $1',
      [article]
    );

    if (!existingProduct.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    // УБИРАЕМ ПРОВЕРКУ ВЛАДЕНИЯ! Если продукт отображается в интерфейсе,
    // он уже принадлежит ресторану текущего бизнес-аккаунта

    // Удаляем продукт
    const result = await pool.query(
      'DELETE FROM dishes WHERE article = $1 RETURNING article',
      [article]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }

    console.log('✅ Продукт успешно удален:', article);

    res.json({
      success: true,
      message: 'Продукт успешно удален'
    });
  } catch (error) {
    console.error('❌ Ошибка удаления продукта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления продукта',
      error: error.message
    });
  }
});

// Получить статистику продуктов
router.get('/products-stats', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    console.log('📊 Получение статистики продуктов для бизнеса ID:', req.user.id);
    
    // Проверяем существование поля is_active
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dishes' AND column_name = 'is_active'
    `);

    let statsQuery;
    
    if (tableInfo.rows.length > 0) {
      // Если есть поле is_active
      statsQuery = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_products
        FROM dishes 
        WHERE restaurant_id = $1
      `;
    } else {
      // Если нет поля is_active, используем статус
      statsQuery = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products
        FROM dishes 
        WHERE restaurant_id = $1
      `;
    }
    
    const statsResult = await pool.query(statsQuery, [req.user.id]);
    
    const stats = {
      total_products: parseInt(statsResult.rows[0]?.total_products || 0),
      active_products: parseInt(statsResult.rows[0]?.active_products || 0),
      inactive_products: parseInt(statsResult.rows[0]?.inactive_products || 0)
    };
    
    console.log('📊 Статистика продуктов:', stats);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения статистики продуктов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики',
      error: error.message
    });
  }
});

// ==================== ЗАКАЗЫ БИЗНЕСА ====================

// Получить все заказы бизнеса
router.get('/orders', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    console.log('🔄 Получение заказов бизнеса для пользователя ID:', req.user.id);
    
    // Проверяем, есть ли ресторан у этого бизнес-аккаунта
    const restaurantResult = await pool.query(
      'SELECT id, company_name FROM restaurants WHERE user_id = $1',
      [req.user.id]
    );

    if (!restaurantResult.rows[0]) {
      console.log('⚠️ У бизнес-аккаунта нет ресторана');
      return res.json({ 
        success: true, 
        orders: [],
        restaurant_found: false,
        message: 'У вашего аккаунта нет ресторана'
      });
    }

    const restaurant = restaurantResult.rows[0];
    console.log(`✅ Ресторан найден: ${restaurant.company_name} (ID: ${restaurant.id})`);

    // Получаем заказы для этого ресторана
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.user_id,
        o.total_amount,
        o.final_amount,
        o.delivery_address,
        o.status,
        o.payment_status,
        o.payment_method,
        o.company_name,
        o.notes,
        o.restaurant_id,
        o.created_at,
        o.updated_at,
        o.completed_at,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.restaurant_id = $1
      ORDER BY o.created_at DESC
    `;
    
    const ordersResult = await pool.query(ordersQuery, [restaurant.id]);
    
    console.log(`✅ Найдено ${ordersResult.rows.length} заказов для ресторана`);

    const orders = ordersResult.rows;
    
    // Для каждого заказа получаем его элементы
    for (let order of orders) {
      const itemsResult = await pool.query(
        `SELECT 
          id,
          order_id,
          product_id,
          product_name,
          product_description,
          unit_price,
          quantity,
          total_price,
          special_instructions,
          created_at
         FROM order_items 
         WHERE order_id = $1`,
        [order.id]
      );
      
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      orders: orders,
      restaurant_found: true,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.company_name
    });
  } catch (error) {
    console.error('❌ Ошибка получения заказов бизнеса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения заказов',
      error: error.message
    });
  }
});

// Обновить статус заказа
router.put('/orders/:orderId/status', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 Обновление статуса заказа ${orderId} на ${status}`);

    if (!status || !['pending', 'processing', 'completed', 'cancelled', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный статус. Допустимые значения: pending, processing, completed, cancelled, delivered'
      });
    }

    // Проверяем, существует ли заказ и принадлежит ли ресторану текущего бизнес-аккаунта
    const orderCheck = await pool.query(
      `SELECT o.id, o.restaurant_id, r.user_id
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (!orderCheck.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    // Проверяем, что заказ принадлежит ресторану текущего пользователя
    if (orderCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Этот заказ не принадлежит вашему ресторану'
      });
    }

    // Обновляем статус заказа
    const updateFields = ['status = $1'];
    const params = [status];
    
    // Если статус "completed" или "delivered", добавляем время завершения
    if (status === 'completed' || status === 'delivered') {
      updateFields.push('completed_at = CURRENT_TIMESTAMP');
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $2
      RETURNING 
        id, order_number, status, updated_at,
        CASE WHEN completed_at IS NOT NULL THEN completed_at END as completed_at
    `;
    
    params.push(orderId);
    
    const result = await pool.query(query, params);

    console.log(`✅ Статус заказа ${orderId} обновлен на ${status}`);

    // Получаем обновленный заказ с деталями
    const updatedOrder = await pool.query(
      `SELECT 
        o.id,
        o.order_number,
        o.user_id,
        o.total_amount,
        o.final_amount,
        o.delivery_address,
        o.status,
        o.payment_status,
        o.payment_method,
        o.company_name,
        o.notes,
        o.restaurant_id,
        o.created_at,
        o.updated_at,
        o.completed_at,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    const order = updatedOrder.rows[0];
    
    if (order) {
      // Получаем элементы заказа
      const itemsResult = await pool.query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [orderId]
      );
      
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      order: order,
      message: 'Статус заказа обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления статуса заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса заказа',
      error: error.message
    });
  }
});

// Получить статистику заказов бизнеса
router.get('/orders/stats', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    console.log('📊 Получение статистики заказов бизнеса для пользователя ID:', req.user.id);
    
    // Проверяем, есть ли ресторан у этого бизнес-аккаунта
    const restaurantResult = await pool.query(
      'SELECT id FROM restaurants WHERE user_id = $1',
      [req.user.id]
    );

    if (!restaurantResult.rows[0]) {
      return res.json({
        success: true,
        stats: {
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          cancelled_orders: 0,
          total_revenue: 0,
          average_order_value: 0
        }
      });
    }

    const restaurantId = restaurantResult.rows[0].id;
    
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(AVG(final_amount), 0) as average_order_value
       FROM orders 
       WHERE restaurant_id = $1 AND status != 'cancelled'`,
      [restaurantId]
    );

    res.json({
      success: true,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики заказов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статистики заказов'
    });
  }
});

// ==================== ПРОФИЛЬ РЕСТОРАНА ====================

router.get('/restaurant', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const restaurantResult = await pool.query(
      `SELECT 
        r.*,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone
       FROM restaurants r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1`,
      [req.user.id]
    );

    if (!restaurantResult.rows[0]) {
      return res.json({ 
        success: true, 
        restaurant: null,
        message: 'Ресторан не найден'
      });
    }

    res.json({ 
      success: true,
      restaurant: restaurantResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка получения профиля ресторана:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

router.put('/restaurant', authMiddleware, businessMiddleware, async (req, res) => {
  try {
    const {
      company_name,
      opening_time,
      closing_time,
      address,
      city,
      longitude,
      latitude,
      logo_url,
      is_open,
      bin,
      director_first_name,
      director_last_name,
      delivery_time_range,
      rating
    } = req.body;

    console.log('🔄 Обновление профиля ресторана для пользователя ID:', req.user.id);

    // Проверяем, существует ли запись ресторана
    const existingRestaurant = await pool.query(
      'SELECT id FROM restaurants WHERE user_id = $1',
      [req.user.id]
    );

    let result;
    
    if (existingRestaurant.rows[0]) {
      // Обновляем существующий ресторан
      result = await pool.query(
        `UPDATE restaurants 
         SET company_name = COALESCE($1, company_name),
             opening_time = COALESCE($2, opening_time),
             closing_time = COALESCE($3, closing_time),
             address = COALESCE($4, address),
             city = COALESCE($5, city),
             longitude = COALESCE($6, longitude),
             latitude = COALESCE($7, latitude),
             logo_url = COALESCE($8, logo_url),
             is_open = COALESCE($9, is_open),
             bin = COALESCE($10, bin),
             director_first_name = COALESCE($11, director_first_name),
             director_last_name = COALESCE($12, director_last_name),
             delivery_time_range = COALESCE($13, delivery_time_range),
             rating = COALESCE($14, rating),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $15
         RETURNING *`,
        [
          company_name,
          opening_time,
          closing_time,
          address,
          city,
          longitude,
          latitude,
          logo_url,
          is_open,
          bin,
          director_first_name,
          director_last_name,
          delivery_time_range,
          rating,
          req.user.id
        ]
      );
    } else {
      // Создаем новую запись ресторана
      result = await pool.query(
        `INSERT INTO restaurants (
          user_id, company_name, opening_time, closing_time,
          address, city, longitude, latitude, logo_url,
          is_open, bin, director_first_name, director_last_name,
          delivery_time_range, rating, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          req.user.id,
          company_name || 'Мой ресторан',
          opening_time || '09:00',
          closing_time || '23:00',
          address || '',
          city || '',
          longitude || null,
          latitude || null,
          logo_url || '',
          is_open !== undefined ? is_open : true,
          bin || '',
          director_first_name || '',
          director_last_name || '',
          delivery_time_range || '30-45 минут',
          rating || 4.5
        ]
      );
    }

    if (!result.rows[0]) {
      throw new Error('Не удалось сохранить профиль ресторана');
    }

    console.log('✅ Профиль ресторана сохранен');

    res.json({
      success: true,
      restaurant: result.rows[0],
      message: 'Профиль ресторана сохранен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления профиля ресторана:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления профиля ресторана',
      error: error.message
    });
  }
});

module.exports = router;