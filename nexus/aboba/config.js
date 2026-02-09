require('dotenv').config();

const dbConfig = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT) || 5432,
  
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  
  allowExitOnIdle: true
};

if (process.env.PG_SSL === 'true' || process.env.PG_SSL === '1') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

console.log(`🔧 Конфигурация БД: ${dbConfig.database}@${dbConfig.host}`);

module.exports = dbConfig;