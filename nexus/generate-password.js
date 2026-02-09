const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = '123456';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('🔐 Генерация хеша для пароля "123456":');
  console.log(`Пароль: ${password}`);
  console.log(`Соль: ${salt}`);
  console.log(`Хеш: ${hash}`);
  console.log('\n📋 SQL для вставки пользователя:');
  console.log(`INSERT INTO users (name, email, password, role) VALUES ('Test User', 'test@example.com', '${hash}', 'user');`);
  
  // Проверяем хеш
  const isValid = await bcrypt.compare(password, hash);
  console.log(`\n✅ Проверка хеша: ${isValid ? 'УСПЕШНО' : 'НЕУДАЧА'}`);
}

generatePasswordHash().catch(console.error);