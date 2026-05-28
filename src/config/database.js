// import pkg from 'pg';
// import dotenv from 'dotenv';

// dotenv.config();

// const { Pool } = pkg;

// // PostgreSQL connection pool
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT),
//   ssl: false,
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

// // Test database connection
// pool.connect()
//   .then((client) => {
//     console.log('✅ Database connected successfully');
//     client.release();
//   })
//   .catch((err) => {
//     console.error('❌ Database connection error:', err.message);
//   });

// export default pool;
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => {
    console.log('✅ Neon Database Connected');
  })
  .catch((err) => {
    console.log('❌ DB Error:', err.message);
  });

export default pool;