const { pool } = require('../../aboba/index');

/**
 * Записывает действие пользователя в журнал
 * @param {number} userId - ID пользователя, совершившего действие
 * @param {string} actionType - Тип действия (например, 'CREATE_PRODUCT')
 * @param {string} description - Человекочитаемое описание действия
 * @param {object} metadata - Данные для отмены действия или доп. информация
 */
const logAction = async (userId, actionType, description, metadata = {}) => {
    try {
        await pool.query(
            'INSERT INTO action_logs (user_id, action_type, description, metadata) VALUES ($1, $2, $3, $4)',
            [userId, actionType, description, JSON.stringify(metadata)]
        );
        console.log(`✅ Action logged: ${actionType} by user ${userId}`);
    } catch (error) {
        console.error('❌ Error logging action:', error);
    }
};

module.exports = { logAction };
