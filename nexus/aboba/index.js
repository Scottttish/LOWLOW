// nexus\aboba\index.js
const { Pool } = require('pg');
require('dotenv').config();

// Создаем пул подключений
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'foodsharing',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '314159265359o',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // максимальное количество клиентов в пуле
  idleTimeoutMillis: 30000, // закрыть простаивающие клиенты через 30 секунд
  connectionTimeoutMillis: 2000, // возвращать ошибку через 2 секунды, если подключение не установлено
});

// Функция для тестирования подключения
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1 as test');
    return { success: true, message: '✅ PostgreSQL подключен успешно!' };
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
    return { 
      success: false, 
      message: 'Ошибка подключения к PostgreSQL', 
      error: error.message 
    };
  } finally {
    if (client) client.release();
  }
}

// Обработка ошибок пула
pool.on('error', (err) => {
  console.error('❌ Неожиданная ошибка пула PostgreSQL:', err);
});

module.exports = {
  pool,
  testConnection
};