// nexus\src\routes\account.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware } = require('../middleware/auth.middleware');

// Получить информацию о текущем пользователе
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT 
        id, name, email, phone, role, city, address, 
        avatar_url, company_name, is_active, 
        longitude, latitude, created_at, updated_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [req.user.id]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    res.json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Обновить информацию о пользователе (ИСПРАВЛЕННАЯ ВЕРСИЯ)
router.put('/user/me', authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      city, 
      address,
      avatar_url,
      company_name
    } = req.body;
    
    const userResult = await pool.query(
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
        email,
        phone,
        city,
        address,
        avatar_url,
        company_name,
        req.user.id
      ]
    );

    if (!userResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    res.json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить карты пользователя
router.get('/user/me/cards', authMiddleware, async (req, res) => {
  try {
    const cardsResult = await pool.query(
      `SELECT 
        id, user_id, card_holder_name, card_number_hash, 
        card_last4, card_type, expiry_month, expiry_year, 
        is_default, balance, created_at, updated_at
       FROM user_cards 
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, cards: cardsResult.rows });
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Добавить новую карту
router.post('/user/me/cards', authMiddleware, async (req, res) => {
  try {
    const { 
      cardNumber, 
      cardHolderName, 
      expiryMonth, 
      expiryYear, 
      cardType = 'unknown', 
      isDefault = false 
    } = req.body;

    if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Все обязательные поля должны быть заполнены' 
      });
    }

    const cardLast4 = cardNumber.toString().slice(-4);
    
    // Проверяем сколько карт уже у пользователя
    const cardsResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_cards WHERE user_id = $1',
      [req.user.id]
    );
    
    const cardCount = parseInt(cardsResult.rows[0].count);
    
    // Если новая карта основная или это первая карта, снимаем основной статус с других
    if (isDefault || cardCount === 0) {
      await pool.query(
        'UPDATE user_cards SET is_default = false WHERE user_id = $1',
        [req.user.id]
      );
    }

    // Сохраняем новую карту
    const result = await pool.query(
      `INSERT INTO user_cards (
        user_id, card_holder_name, card_number_hash, 
        card_last4, card_type, expiry_month, expiry_year, 
        is_default, balance, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.0, NOW(), NOW())
      RETURNING id, user_id, card_holder_name, card_last4, card_type, 
                expiry_month, expiry_year, is_default, balance, created_at, updated_at`,
      [
        req.user.id, 
        cardHolderName, 
        `hash_${cardNumber}`, 
        cardLast4, 
        cardType, 
        expiryMonth, 
        expiryYear, 
        isDefault || cardCount === 0
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Не удалось сохранить карту');
    }

    res.json({ 
      success: true, 
      card: result.rows[0],
      message: 'Карта успешно сохранена'
    });
  } catch (error) {
    console.error('Error saving card:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        success: false, 
        message: 'Карта с таким номером уже существует' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера при сохранении карты'
    });
  }
});

// Удалить карту
router.delete('/user/me/cards/:cardId', authMiddleware, async (req, res) => {
  try {
    const { cardId } = req.params;

    // Проверяем существует ли карта и является ли она основной
    const cardResult = await pool.query(
      'SELECT is_default FROM user_cards WHERE id = $1 AND user_id = $2',
      [cardId, req.user.id]
    );

    if (!cardResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Карта не найдена' });
    }

    // Удаляем карту
    await pool.query(
      'DELETE FROM user_cards WHERE id = $1 AND user_id = $2',
      [cardId, req.user.id]
    );

    // Если удалили основную карту, устанавливаем первую доступную как основную
    if (cardResult.rows[0].is_default) {
      const remainingCards = await pool.query(
        'SELECT id FROM user_cards WHERE user_id = $1 LIMIT 1',
        [req.user.id]
      );
      
      if (remainingCards.rows[0]) {
        await pool.query(
          'UPDATE user_cards SET is_default = true WHERE id = $1',
          [remainingCards.rows[0].id]
        );
      }
    }

    res.json({ success: true, message: 'Карта удалена' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Установить карту как основную
router.put('/user/me/cards/:cardId/default', authMiddleware, async (req, res) => {
  try {
    const { cardId } = req.params;

    await pool.query('BEGIN');

    // Проверяем существует ли карта
    const existingCard = await pool.query(
      'SELECT id FROM user_cards WHERE id = $1 AND user_id = $2',
      [cardId, req.user.id]
    );

    if (!existingCard.rows[0]) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Карта не найдена' });
    }

    // Снимаем основной статус со всех карт пользователя
    await pool.query(
      'UPDATE user_cards SET is_default = false WHERE user_id = $1',
      [req.user.id]
    );

    // Устанавливаем выбранную карту как основную
    await pool.query(
      'UPDATE user_cards SET is_default = true WHERE id = $1 AND user_id = $2',
      [cardId, req.user.id]
    );

    await pool.query('COMMIT');

    res.json({ success: true, message: 'Карта установлена как основная' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error setting default card:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить заказы пользователя
router.get('/user/me/orders', authMiddleware, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT 
        o.id, o.user_id, o.order_number, o.total_amount, 
        o.tax_amount, o.delivery_fee, o.final_amount, 
        o.delivery_address, o.delivery_longitude, o.delivery_latitude,
        o.status, o.payment_status, o.payment_method, o.card_last4,
        o.company_name, o.notes, o.restaurant_id, 
        o.created_at, o.updated_at, o.completed_at
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    const orders = ordersResult.rows;
    
    // Для каждого заказа получаем его элементы
    for (let order of orders) {
      const itemsResult = await pool.query(
        `SELECT 
          id, order_id, product_id, product_name, product_description,
          unit_price, quantity, total_price, special_instructions, created_at
         FROM order_items 
         WHERE order_id = $1`,
        [order.id]
      );
      
      order.items = itemsResult.rows;
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Создать новый заказ
router.post('/user/me/orders', authMiddleware, async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      deliveryAddress,
      companyName,
      restaurantId
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Нет товаров в заказе' 
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await pool.query('BEGIN');

    // Создаем заказ
    const orderResult = await pool.query(
      `INSERT INTO orders (
        user_id, order_number, total_amount, final_amount,
        delivery_address, company_name, restaurant_id, 
        status, payment_status, payment_method, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id`,
      [
        req.user.id,
        orderNumber,
        totalAmount || 0,
        totalAmount || 0,
        deliveryAddress || '',
        companyName || '',
        restaurantId || null,
        'pending',
        'pending',
        'card'
      ]
    );

    const orderId = orderResult.rows[0].id;

    // Добавляем элементы заказа
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_description,
          unit_price, quantity, total_price, created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          orderId,
          item.productId || null,
          item.productName || 'Товар',
          item.productDescription || '',
          item.unitPrice || 0,
          item.quantity || 1,
          item.totalPrice || 0
        ]
      );
    }

    await pool.query('COMMIT');

    // Получаем созданный заказ с элементами
    const newOrder = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    const orderItems = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    newOrder.rows[0].items = orderItems.rows;

    res.json({ success: true, order: newOrder.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить локацию пользователя
router.get('/user/me/location', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT 
        id, name, email, longitude, latitude, city, address
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    const user = userResult.rows[0];
    
    if (user && user.longitude && user.latitude) {
      res.json({ 
        success: true, 
        location: {
          longitude: user.longitude,
          latitude: user.latitude,
          city: user.city,
          address: user.address
        }
      });
    } else {
      res.json({ success: false, message: 'Локация не настроена' });
    }
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Сохранить локацию пользователя
router.put('/user/me/location', authMiddleware, async (req, res) => {
  try {
    const { longitude, latitude, city, address } = req.body;
    
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Координаты обязательны' 
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET longitude = $1, latitude = $2, 
           city = COALESCE($3, city), 
           address = COALESCE($4, address),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, longitude, latitude, city, address`,
      [longitude, latitude, city, address, req.user.id]
    );

    const user = result.rows[0];
    
    res.json({ 
      success: true, 
      location: {
        longitude: user.longitude,
        latitude: user.latitude,
        city: user.city,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Загрузить аватар пользователя
router.post('/user/me/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'URL аватара не предоставлен' });
    }

    // Сохраняем в таблицу user_avatars
    const avatarResult = await pool.query(
      `INSERT INTO user_avatars (
        user_id, avatar_url, file_name, mime_type, file_size, is_current, uploaded_at
      ) 
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id`,
      [
        req.user.id,
        avatarUrl,
        'avatar.png',
        'image/png',
        0
      ]
    );

    // Делаем предыдущие аватары неактивными
    await pool.query(
      'UPDATE user_avatars SET is_current = false WHERE user_id = $1 AND id != $2',
      [req.user.id, avatarResult.rows[0].id]
    );

    // Обновляем аватар в основной таблице пользователей
    const result = await pool.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, avatar_url`,
      [avatarUrl, req.user.id]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить аккаунт пользователя
router.delete('/user/me', authMiddleware, async (req, res) => {
  try {
    await pool.query('BEGIN');

    // Проверяем, является ли пользователь бизнесом
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0]) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const isBusiness = userResult.rows[0].role === 'business';

    if (isBusiness) {
      // Для бизнес-аккаунта удаляем все связанные данные
      
      // Получаем все продукты бизнеса
      const productsResult = await pool.query(
        'SELECT article FROM dishes WHERE restaurant_id = $1',
        [req.user.id]
      );
      
      // Удаляем эти продукты из корзин других пользователей
      for (const product of productsResult.rows) {
        await pool.query(
          'DELETE FROM cart_items WHERE dish_article = $1',
          [product.article]
        );
      }
      
      // Удаляем продукты бизнеса
      await pool.query('DELETE FROM dishes WHERE restaurant_id = $1', [req.user.id]);
      
      // Получаем заказы бизнеса
      const businessOrders = await pool.query(
        'SELECT id FROM orders WHERE restaurant_id = $1',
        [req.user.id]
      );
      
      // Удаляем элементы этих заказов
      for (const order of businessOrders.rows) {
        await pool.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
      }
      
      // Удаляем заказы бизнеса
      await pool.query('DELETE FROM orders WHERE restaurant_id = $1', [req.user.id]);
      
      // Удаляем запись из restaurants
      await pool.query('DELETE FROM restaurants WHERE user_id = $1', [req.user.id]);
    }

    // Удаляем карты пользователя
    await pool.query('DELETE FROM user_cards WHERE user_id = $1', [req.user.id]);
    
    // Удаляем аватары пользователя
    await pool.query('DELETE FROM user_avatars WHERE user_id = $1', [req.user.id]);
    
    // Удаляем элементы корзины пользователя
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    
    // Получаем заказы пользователя (если он не бизнес)
    if (!isBusiness) {
      const userOrders = await pool.query(
        'SELECT id FROM orders WHERE user_id = $1',
        [req.user.id]
      );
      
      // Удаляем элементы этих заказов
      for (const order of userOrders.rows) {
        await pool.query('DELETE FROM order_items WHERE order_id = $1', [order.id]);
      }
      
      // Удаляем заказы пользователя
      await pool.query('DELETE FROM orders WHERE user_id = $1', [req.user.id]);
    }
    
    // Удаляем пользователя
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);

    await pool.query('COMMIT');

    res.json({ success: true, message: 'Аккаунт удален' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Деактивировать аккаунт пользователя
router.post('/user/me/deactivate', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [req.user.id]
    );

    res.json({ success: true, message: 'Аккаунт деактивирован' });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;