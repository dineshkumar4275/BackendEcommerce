import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DB_NAME = process.env.DB_NAME || 'ecommerce_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// SQL to create tables
const createTablesSQL = `
-- Users table
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
);

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    category VARCHAR(100),
    sub_category VARCHAR(100),
    brand VARCHAR(100),
    stock INT DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    image_url TEXT,
    images TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    num_reviews INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_zipcode VARCHAR(20),
    shipping_country VARCHAR(100),
    phone_number VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking table
CREATE TABLE IF NOT EXISTS tracking (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50),
    status_code INT,
    location VARCHAR(200),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    estimated_delivery DATE,
    delivered_at TIMESTAMP,
    notes TEXT,
    updated_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking history table
CREATE TABLE IF NOT EXISTS tracking_history (
    id SERIAL PRIMARY KEY,
    tracking_id INT REFERENCES tracking(id) ON DELETE CASCADE,
    status VARCHAR(50),
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON tracking(order_id);
`;

// SQL to insert sample data
const insertSampleDataSQL = `
-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@example.com', '$2a$10$rQKpQKpQKpQKpQKpQKpQKu', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category, stock, image_url, is_featured) VALUES
('Smartphone X', 'Latest smartphone with amazing features', 59999, 'Electronics', 50, 'https://via.placeholder.com/300', true),
('Laptop Pro', 'High performance laptop for professionals', 89999, 'Electronics', 30, 'https://via.placeholder.com/300', true),
('Wireless Headphones', 'Noise cancellation headphones', 2999, 'Audio', 100, 'https://via.placeholder.com/300', false),
('Smart Watch', 'Fitness tracker with heart rate monitor', 19999, 'Wearables', 75, 'https://via.placeholder.com/300', true),
('Camera DSLR', 'Professional camera for photography', 54999, 'Cameras', 25, 'https://via.placeholder.com/300', false),
('Gaming Mouse', 'RGB gaming mouse with high DPI', 2499, 'Gaming', 200, 'https://via.placeholder.com/300', false),
('Mechanical Keyboard', 'RGB mechanical keyboard', 4999, 'Gaming', 150, 'https://via.placeholder.com/300', false),
('Tablet', '10 inch Android tablet', 29999, 'Electronics', 40, 'https://via.placeholder.com/300', true)
ON CONFLICT (id) DO NOTHING;
`;

// Function to create database if not exists
async function createDatabase() {
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (res.rowCount === 0) {
      // Create database
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database "${DB_NAME}" created successfully`);
    } else {
      console.log(`✅ Database "${DB_NAME}" already exists`);
    }

    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Error creating database:', err.message);
    await client.end();
    return false;
  }
}

// Function to create tables
async function createTables() {
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
  });

  try {
    await client.connect();
    console.log('📋 Creating tables...');

    // Execute table creation SQL
    await client.query(createTablesSQL);
    console.log('✅ Tables created successfully');

    // Insert sample data
    console.log('📊 Inserting sample data...');
    await client.query(insertSampleDataSQL);
    console.log('✅ Sample data inserted successfully');

    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    await client.end();
    return false;
  }
}

// Main function
async function setupDatabase() {
  console.log('\n🚀 Starting database setup...\n');

  // Create database
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    console.log('\n❌ Failed to create database. Please check your PostgreSQL connection.\n');
    process.exit(1);
  }

  // Create tables and insert sample data
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('\n❌ Failed to create tables.\n');
    process.exit(1);
  }

  console.log('\n🎉 Database setup completed successfully!\n');
  console.log('📝 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Login with: admin@example.com / admin123');
  console.log('3. Start adding products!\n');
  
  process.exit(0);
}

// Run the setup
setupDatabase();