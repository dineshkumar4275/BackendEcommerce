import pool from './src/config/database.js';

const createTables = async () => {
  try {
    console.log('Creating tables...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create OTP codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ OTP codes table created');
    
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        stock INT DEFAULT 0,
        image_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        order_number VARCHAR(50) UNIQUE,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at)`);
    console.log('✅ Indexes created');
    
    // Insert sample admin
    await pool.query(`
      INSERT INTO users (name, email, password, role) 
      VALUES ('Admin User', 'admin@example.com', '$2a$10$rQKpQKpQKpQKpQKpQKpQKu', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Sample admin user added');
    
    // Insert sample products
    await pool.query(`
      INSERT INTO products (name, description, price, category, stock, image_url, is_featured) VALUES
      ('Smartphone X', 'Latest smartphone with amazing features', 59999, 'Electronics', 50, 'https://via.placeholder.com/300', true),
      ('Laptop Pro', 'High performance laptop', 89999, 'Electronics', 30, 'https://via.placeholder.com/300', true),
      ('Wireless Headphones', 'Noise cancellation headphones', 2999, 'Audio', 100, 'https://via.placeholder.com/300', false),
      ('Smart Watch', 'Fitness tracker', 19999, 'Wearables', 75, 'https://via.placeholder.com/300', true)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Sample products added');
    
    console.log('🎉 All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error.message);
    process.exit(1);
  }
};

createTables();