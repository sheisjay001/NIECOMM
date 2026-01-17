-- Create database
CREATE DATABASE IF NOT EXISTS test;
USE test;

-- States in Nigeria
CREATE TABLE IF NOT EXISTS states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities in Nigeria
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- User roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Users table (both customers and vendors)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city_id INT,
    state_id INT,
    profile_image VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- Vendor information (extends users table)
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    business_address TEXT NOT NULL,
    business_email VARCHAR(100),
    business_phone VARCHAR(20),
    business_description TEXT,
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    account_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image1 VARCHAR(255),
    image2 VARCHAR(255),
    image3 VARCHAR(255),
    warranty_period INT, -- in months
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    city_id INT NOT NULL,
    state_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (state_id) REFERENCES states(id)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Returns/Refunds
CREATE TABLE IF NOT EXISTS returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('requested', 'approved', 'rejected', 'refunded') DEFAULT 'requested',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- In-app messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT NULL,
    order_id INT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('vendor', 'Vendors who can list products'),
('customer', 'Regular customers who can buy products');

-- Insert Nigerian states
INSERT INTO states (name) VALUES 
('Abia'),('Adamawa'),('Akwa Ibom'),('Anambra'),('Bauchi'),('Bayelsa'),
('Benue'),('Borno'),('Cross River'),('Delta'),('Ebonyi'),('Edo'),('Ekiti'),
('Enugu'),('Gombe'),('Imo'),('Jigawa'),('Kaduna'),('Kano'),('Katsina'),
('Kebbi'),('Kogi'),('Kwara'),('Lagos'),('Nasarawa'),('Niger'),('Ogun'),
('Ondo'),('Osun'),('Oyo'),('Plateau'),('Rivers'),('Sokoto'),('Taraba'),
('Yobe'),('Zamfara'),('FCT');
