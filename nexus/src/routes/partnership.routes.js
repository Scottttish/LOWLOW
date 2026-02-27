// nexus/src/routes/partnership.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../../aboba/index');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { logAction } = require('../utils/logger');
const MailService = require('../services/mail.service');

const mailService = new MailService();

// Создать запрос на партнерство (публичный маршрут)
router.post('/', async (req, res) => {
  try {
    const { email, message, user_id } = req.body;

    console.log('📧 Получен запрос на партнерство:', { email, user_id });

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email и сообщение обязательны'
      });
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный email'
      });
    }

    // Проверяем, существует ли пользователь, если указан user_id
    if (user_id) {
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [user_id]
      );

      if (!userCheck.rows[0]) {
        console.log(`❌ Пользователь с ID ${user_id} не найден`);
      }
    }

    // Сохраняем запрос в базу
    const result = await pool.query(
      `INSERT INTO partnership_requests (email, message, user_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING 
         id, 
         email, 
         message, 
         status, 
         created_at,
         COALESCE(user_id, NULL) as user_id`,
      [
        email,
        message,
        user_id || null,
        'new'
      ]
    );

    console.log('✅ Запрос на партнерство сохранен:', result.rows[0].id);

    // Отправляем email уведомление пользователю
    try {
      await mailService.sendPartnershipSubmit(email);
      console.log(`📧 Письмо-подтверждение отправлено на ${email}`);
    } catch (mailError) {
      console.error('❌ Ошибка отправки письма при подаче заявки:', mailError);
    }

    res.json({
      success: true,
      request: result.rows[0],
      message: 'Запрос на партнерство отправлен'
    });
  } catch (error) {
    console.error('❌ Ошибка создания запроса на партнерство:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании запроса',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Получить запросы на партнерство (только для админа)
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    console.log('📋 Админ запрашивает список запросов на партнерство');

    const requestsResult = await pool.query(
      `SELECT 
        pr.id,
        pr.email,
        pr.message,
        pr.status,
        pr.created_at,
        pr.updated_at,
        COALESCE(pr.user_id, NULL) as user_id,
        u.name as user_name,
        u.role as user_role
       FROM partnership_requests pr
       LEFT JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`
    );

    console.log(`✅ Найдено ${requestsResult.rows.length} запросов`);

    res.json({
      success: true,
      requests: requestsResult.rows,
      count: requestsResult.rows.length
    });
  } catch (error) {
    console.error('❌ Ошибка получения запросов на партнерство:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении запросов'
    });
  }
});

// Удалить запрос на партнерство (только для админа)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Удаление запроса на партнерство ID: ${id}`);

    // Проверяем существование запроса
    const existingRequest = await pool.query(
      'SELECT id FROM partnership_requests WHERE id = $1',
      [id]
    );

    if (!existingRequest.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }

    // Удаляем запрос
    const result = await pool.query(
      'DELETE FROM partnership_requests WHERE id = $1 RETURNING id, email',
      [id]
    );

    console.log(`✅ Запрос удален: ${result.rows[0].email}`);

    // LOGGING
    await logAction(
      req.user.id,
      'DELETE_PARTNERSHIP_REQUEST',
      `Администратор удалил запрос на партнерство от ${result.rows[0].email}`,
      { deletedRequest: result.rows[0] }
    );

    res.json({
      success: true,
      message: 'Запрос удален',
      deleted_id: result.rows[0].id
    });
  } catch (error) {
    console.error('❌ Ошибка удаления запроса на партнерство:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении запроса'
    });
  }
});

// Обновить статус запроса (только для админа)
router.put('/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Обновление статуса запроса ${id} на ${status}`);

    if (!status || !['new', 'reviewed', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный статус. Допустимые значения: new, reviewed, completed, rejected'
      });
    }

    // Обновляем статус
    const result = await pool.query(
      `UPDATE partnership_requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, status, updated_at`,
      [status, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Запрос не найден'
      });
    }

    console.log(`✅ Статус запроса ${id} обновлен на ${status}`);

    // Отправляем email в зависимости от нового статуса
    try {
      if (status === 'completed' || status === 'reviewed') {
        await mailService.sendPartnershipApproval(result.rows[0].email);
        console.log(`📧 Письмо об одобрении отправлено на ${result.rows[0].email}`);
      } else if (status === 'rejected') {
        await mailService.sendPartnershipRejection(result.rows[0].email);
        console.log(`📧 Письмо об отказе отправлено на ${result.rows[0].email}`);
      }
    } catch (mailError) {
      console.error(`❌ Ошибка отправки письма при изменении статуса (${status}):`, mailError);
    }

    // LOGGING
    await logAction(
      req.user.id,
      'UPDATE_PARTNERSHIP_STATUS',
      `Статус запроса от ${result.rows[0].email} изменен на "${status}"`,
      { requestId: id, oldStatus: result.rows[0].status, newStatus: status, email: result.rows[0].email }
    );

    res.json({
      success: true,
      request: result.rows[0],
      message: 'Статус запроса обновлен'
    });
  } catch (error) {
    console.error('❌ Ошибка обновления статуса запроса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении статуса'
    });
  }
});

// Получить статистику по запросам (только для админа)
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        DATE(created_at) as date,
        COUNT(*) as daily_count
       FROM partnership_requests
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 7`
    );

    const totalStats = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT user_id) as users_with_requests,
        MIN(created_at) as first_request_date,
        MAX(created_at) as last_request_date
       FROM partnership_requests`
    );

    res.json({
      success: true,
      stats: {
        daily: statsResult.rows,
        totals: totalStats.rows[0]
      }
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики запросов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статистики'
    });
  }
});

module.exports = router;