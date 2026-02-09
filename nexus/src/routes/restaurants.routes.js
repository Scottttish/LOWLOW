const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware } = require('../middleware/auth.middleware');

// Получить все рестораны
router.get('/', authMiddleware, async (req, res) => {
  try {
    const restaurantsResult = await pool.query(
      `SELECT 
        r.id,
        r.user_id,
        r.company_name,
        r.city,
        r.address,
        r.longitude,
        r.latitude,
        r.created_at,
        u.email,
        u.phone,
        u.avatar_url,
        u.is_active,
        u.role
       FROM restaurants r
       JOIN users u ON r.user_id = u.id
       WHERE u.is_active = true
       ORDER BY r.company_name`
    );

    res.json({ 
      success: true, 
      restaurants: restaurantsResult.rows,
      count: restaurantsResult.rows.length
    });
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получить конкретный ресторан
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurantResult = await pool.query(
      `SELECT 
        r.id,
        r.user_id,
        r.company_name,
        r.city,
        r.address,
        r.longitude,
        r.latitude,
        r.created_at,
        u.email,
        u.phone,
        u.avatar_url,
        u.is_active,
        u.role,
        u.name
       FROM restaurants r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND u.is_active = true`,
      [id]
    );

    if (!restaurantResult.rows[0]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ресторан не найден' 
      });
    }

    res.json({ 
      success: true, 
      restaurant: restaurantResult.rows[0]
    });
  } catch (error) {
    console.error('Error getting restaurant:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;