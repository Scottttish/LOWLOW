// nexus\src\routes\dishes.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware } = require('../middleware/auth.middleware');

// Получить блюда ресторана
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'restaurant_id обязателен' 
      });
    }

    // Простой запрос с базовыми полями
    const dishesQuery = `
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
      WHERE restaurant_id = $1 AND (status = 'active' OR status IS NULL)
      ORDER BY name
    `;
    
    const dishesResult = await pool.query(dishesQuery, [restaurant_id]);

    // Форматируем ответ
    const dishes = dishesResult.rows.map(dish => ({
      ...dish,
      category: 'Без категории',
      is_active: dish.status === 'active'
    }));

    res.json({ 
      success: true, 
      dishes: dishes
    });
  } catch (error) {
    console.error('Error getting dishes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера',
      dishes: [] 
    });
  }
});

module.exports = router;