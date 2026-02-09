const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware } = require('../middleware/auth.middleware');

// Получить корзину пользователя
router.get('/user/me/cart', authMiddleware, async (req, res) => {
  try {
    const cartResult = await pool.query(
      `SELECT 
        ci.id,
        ci.dish_article,
        ci.quantity,
        ci.restaurant_id,
        d.name as dish_name,
        d.price,
        d.image_url as image,
        d.composition as description,
        u.company_name as restaurant_name,
        d.category_id,
        c.name as category_name
       FROM cart_items ci
       JOIN dishes d ON ci.dish_article = d.article
       JOIN users u ON ci.restaurant_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );

    res.json({ 
      success: true, 
      cart: cartResult.rows,
      count: cartResult.rows.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Добавить блюдо в корзину
router.post('/user/me/cart', authMiddleware, async (req, res) => {
  try {
    const { dish_article, quantity = 1, restaurant_id } = req.body;

    if (!dish_article || !restaurant_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'dish_article и restaurant_id обязательны' 
      });
    }

    // Проверяем, существует ли блюдо
    const dishResult = await pool.query(
      'SELECT article, name, price FROM dishes WHERE article = $1',
      [dish_article]
    );

    if (!dishResult.rows[0]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Блюдо не найдено' 
      });
    }

    // Проверяем, есть ли уже это блюдо в корзине
    const existingCartItem = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND dish_article = $2',
      [req.user.id, dish_article]
    );

    let result;
    
    if (existingCartItem.rows[0]) {
      // Обновляем количество
      result = await pool.query(
        `UPDATE cart_items 
         SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND dish_article = $3
         RETURNING id, dish_article, quantity, restaurant_id`,
        [quantity, req.user.id, dish_article]
      );
    } else {
      // Добавляем новое блюдо
      result = await pool.query(
        `INSERT INTO cart_items (user_id, dish_article, quantity, restaurant_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, dish_article, quantity, restaurant_id`,
        [req.user.id, dish_article, quantity, restaurant_id]
      );
    }

    res.json({ 
      success: true, 
      item: result.rows[0],
      message: 'Добавлено в корзину'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Обновить количество блюда в корзине
router.put('/user/me/cart/:item_id', authMiddleware, async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Если количество <= 0, удаляем из корзины
      await pool.query(
        'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
        [item_id, req.user.id]
      );
      
      return res.json({ 
        success: true, 
        message: 'Удалено из корзины',
        removed: true 
      });
    }

    const result = await pool.query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, dish_article, quantity, restaurant_id`,
      [quantity, item_id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Элемент корзины не найден' 
      });
    }

    res.json({ 
      success: true, 
      item: result.rows[0],
      message: 'Количество обновлено'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Удалить блюдо из корзины
router.delete('/user/me/cart/:item_id', authMiddleware, async (req, res) => {
  try {
    const { item_id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [item_id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Элемент корзины не найден' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Удалено из корзины'
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Очистить корзину
router.delete('/user/me/cart', authMiddleware, async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    let query = 'DELETE FROM cart_items WHERE user_id = $1';
    const params = [req.user.id];

    if (restaurant_id) {
      query += ' AND restaurant_id = $2';
      params.push(restaurant_id);
    }

    const result = await pool.query(query + ' RETURNING id', params);

    res.json({ 
      success: true, 
      message: `Корзина ${restaurant_id ? 'ресторана' : ''} очищена`,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Оформить заказ с оплатой (ИСПРАВЛЕННАЯ ВЕРСИЯ)
router.post('/user/me/checkout', authMiddleware, async (req, res) => {
  let client;
  
  try {
    const { 
      delivery_address, 
      delivery_longitude, 
      delivery_latitude,
      notes,
      card_id 
    } = req.body;

    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Получаем корзину пользователя с информацией о блюдах
    const cartResult = await client.query(
      `SELECT 
        ci.dish_article,
        ci.quantity,
        ci.restaurant_id,
        d.name as dish_name,
        d.price,
        d.composition as description,
        u.company_name as restaurant_name
       FROM cart_items ci
       JOIN dishes d ON ci.dish_article = d.article
       JOIN users u ON ci.restaurant_id = u.id
       WHERE ci.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Корзина пуста' 
      });
    }

    // 2. Группируем по ресторанам
    const restaurants = {};
    let totalAmount = 0;
    
    cartResult.rows.forEach(item => {
      const restaurantId = item.restaurant_id;
      if (!restaurants[restaurantId]) {
        restaurants[restaurantId] = {
          name: item.restaurant_name,
          items: [],
          subtotal: 0
        };
      }
      
      const itemTotal = item.price * item.quantity;
      restaurants[restaurantId].items.push({
        dish_article: item.dish_article, // article из dishes (например: "PIZ001")
        dish_name: item.dish_name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });
      restaurants[restaurantId].subtotal += itemTotal;
      totalAmount += itemTotal;
    });

    // 3. Проверяем наличие и баланс карты
    const cardResult = await client.query(
      'SELECT id, balance, card_last4 FROM user_cards WHERE id = $1 AND user_id = $2',
      [card_id, req.user.id]
    );

    if (!cardResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Карта не найдена' 
      });
    }

    const card = cardResult.rows[0];
    
    if (card.balance < totalAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Недостаточно средств на карте' 
      });
    }

    // 4. Списываем средства с карты
    await client.query(
      'UPDATE user_cards SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totalAmount, card_id]
    );

    // 5. Создаем заказы для каждого ресторана
    const orders = [];
    
    for (const [restaurantId, restaurantData] of Object.entries(restaurants)) {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}-${restaurantId}`;
      
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, order_number, total_amount, final_amount,
          delivery_address, delivery_longitude, delivery_latitude,
          company_name, restaurant_id, status, payment_status,
          payment_method, card_last4, notes, created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING id, order_number`,
        [
          req.user.id,
          orderNumber,
          restaurantData.subtotal,
          restaurantData.subtotal,
          delivery_address,
          delivery_longitude,
          delivery_latitude,
          restaurantData.name,
          restaurantId,
          'pending',
          'paid',
          'card',
          card.card_last4,
          notes
        ]
      );

      const orderId = orderResult.rows[0].id;
      const orderNumberResult = orderResult.rows[0].order_number;

      // 6. Добавляем элементы заказа (ВАЖНО: product_id = dish_article из dishes)
      for (const item of restaurantData.items) {
        // ИСПРАВЛЕНО: Добавлен RETURNING id для гарантированной генерации ID
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_description,
            unit_price, quantity, total_price, special_instructions, created_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id`,
          [
            orderId,
            item.dish_article,        // product_id (article из dishes, например "PIZ001")
            item.dish_name,           // product_name
            item.description || '',   // product_description (composition из dishes)
            item.price,               // unit_price
            item.quantity,            // quantity
            item.total,               // total_price
            ''                        // special_instructions
          ]
        );
      }

      // Получаем созданный заказ
      const createdOrder = await client.query(
        `SELECT 
          id, user_id, order_number, total_amount, tax_amount, delivery_fee, final_amount,
          delivery_address, delivery_longitude, delivery_latitude, status, payment_status,
          payment_method, card_last4, company_name, notes, restaurant_id,
          created_at, updated_at, completed_at
         FROM orders WHERE id = $1`,
        [orderId]
      );

      const orderItems = await client.query(
        `SELECT 
          id, order_id, product_id, product_name, product_description,
          unit_price, quantity, total_price, special_instructions, created_at
         FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      orders.push({
        ...createdOrder.rows[0],
        items: orderItems.rows
      });
    }

    // 7. Очищаем корзину
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [req.user.id]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Заказ успешно оформлен',
      orders,
      totalAmount
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error during checkout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при оформлении заказа',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;