// Простой тест подключения к БД
console.log('🧪 Тестируем подключение к PostgreSQL...\n');

const { testConnection } = require('./aboba/index');

async function runTest() {
  console.log('='.repeat(50));
  const result = await testConnection();
  console.log('='.repeat(50));
  
  if (result.success) {
    console.log('✅ ТЕСТ ПРОЙДЕН! PostgreSQL подключен.');
    console.log(`📊 База данных: ${result.database}`);
    console.log(`👤 Пользователь: ${result.user}`);
    console.log(`🕐 Время БД: ${result.time}`);
    process.exit(0);
  } else {
    console.log('❌ ТЕСТ НЕ ПРОЙДЕН!');
    console.log(`Ошибка: ${result.error}`);
    console.log('\n🔧 Что проверить:');
    console.log('1. Запущен ли PostgreSQL?');
    console.log('2. Правильные ли данные в .env файле?');
    console.log('3. Существует ли база foodsharing?');
    console.log('4. Правильный ли пароль?');
    process.exit(1);
  }
}

runTest();