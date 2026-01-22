const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter); // Apply to API routes

// Middleware
app.use(cors());
// Security Headers (CSP)
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data:; img-src 'self' data:; connect-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
app.use(bodyParser.json());
// Initialize DB Middleware
let dbInitialized = false;
app.use(async (req, res, next) => {
    if (!dbInitialized) {
        await initDb();
        dbInitialized = true;
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for local uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dir = 'public/uploads/misc';
        if (file.fieldname === 'image') dir = 'public/uploads/products';
        if (file.fieldname === 'reviewImage') dir = 'public/uploads/reviews';
        if (file.fieldname === 'cac_certificate') dir = 'public/uploads/verifications';
        if (file.fieldname === 'shop_image') dir = 'public/uploads/verifications';
        
        const absoluteDir = path.join(__dirname, dir);
        if (!fs.existsSync(absoluteDir)){
            fs.mkdirSync(absoluteDir, { recursive: true });
        }
        cb(null, absoluteDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Database Connection
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nigeriagadgetmart',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000 // 10s timeout
};

async function initDb() {
    try {
        // Check if database exists/connectable
        try {
            const checkConn = await getDb();
            await checkConn.end();
        } catch (err) {
            console.log('Initial DB connection failed:', err.message);
            let shouldCreateDb = false;

            // Check for SSL handshake error or timeout (common in local XAMPP)
            if (err.code === 'HANDSHAKE_NO_SSL_SUPPORT' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ER_CONN_REFUSED') {
                console.log('Retrying without SSL and forcing 127.0.0.1...');
                delete dbConfig.ssl;
                dbConfig.host = '127.0.0.1'; // Force IPv4
                // Retry connection check
                try {
                    const retryConn = await getDb();
                    await retryConn.end();
                    console.log('Connection successful after retry.');
                } catch (retryErr) {
                    console.log('Connection retry failed:', retryErr.message);
                    shouldCreateDb = true;
                }
            } else {
                shouldCreateDb = true;
            }

            if (shouldCreateDb) {
                // If connection fails, try creating the database (for local dev)
                console.log('Attempting to create database...');
                const conn = await mysql.createConnection({
                    host: dbConfig.host,
                    user: dbConfig.user,
                    password: dbConfig.password,
                    port: dbConfig.port,
                    ssl: dbConfig.ssl
                });
                await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
                await conn.end();
            }
        }
        
        // Create Tables
        const db = await getDb();
        
        // Roles Table
        await db.query(`CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE
        )`);
        
        // Seed Roles
        const [roles] = await db.query('SELECT * FROM roles');
        if (roles.length === 0) {
            await db.query("INSERT INTO roles (name) VALUES ('admin'), ('user'), ('vendor')");
        }

        // States Table
        await db.query(`CREATE TABLE IF NOT EXISTS states (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            lat DECIMAL(10, 8),
            lng DECIMAL(11, 8)
        )`);

        // Add columns if not exist
        try {
            await db.query("ALTER TABLE states ADD COLUMN lat DECIMAL(10, 8)");
            await db.query("ALTER TABLE states ADD COLUMN lng DECIMAL(11, 8)");
        } catch (e) {}

        // Seed States (Full List)
        const nigeriaStates = [
            { name: 'Abia', lat: 5.4527, lng: 7.5248 },
            { name: 'Adamawa', lat: 9.3265, lng: 12.3984 },
            { name: 'Akwa Ibom', lat: 5.0515, lng: 7.8467 },
            { name: 'Anambra', lat: 6.2209, lng: 6.9370 },
            { name: 'Bauchi', lat: 10.7761, lng: 9.7008 },
            { name: 'Bayelsa', lat: 4.7719, lng: 6.0699 },
            { name: 'Benue', lat: 7.3369, lng: 8.7404 },
            { name: 'Borno', lat: 11.8846, lng: 13.1520 },
            { name: 'Cross River', lat: 5.8702, lng: 8.5988 },
            { name: 'Delta', lat: 5.5544, lng: 5.7932 },
            { name: 'Ebonyi', lat: 6.2649, lng: 8.0137 },
            { name: 'Edo', lat: 6.5244, lng: 5.8987 },
            { name: 'Ekiti', lat: 7.6304, lng: 5.2190 },
            { name: 'Enugu', lat: 6.4584, lng: 7.5464 },
            { name: 'Federal Capital Territory (FCT) – Abuja', lat: 9.0765, lng: 7.3986 },
            { name: 'Gombe', lat: 10.2897, lng: 11.1673 },
            { name: 'Imo', lat: 5.5720, lng: 7.0588 },
            { name: 'Jigawa', lat: 12.2280, lng: 9.5616 },
            { name: 'Kaduna', lat: 10.5105, lng: 7.4165 },
            { name: 'Kano', lat: 12.0022, lng: 8.5920 },
            { name: 'Katsina', lat: 12.9908, lng: 7.6000 },
            { name: 'Kebbi', lat: 11.4942, lng: 4.2333 },
            { name: 'Kogi', lat: 7.7337, lng: 6.6906 },
            { name: 'Kwara', lat: 8.9669, lng: 4.6098 },
            { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
            { name: 'Nasarawa', lat: 8.4998, lng: 8.1997 },
            { name: 'Niger', lat: 9.9309, lng: 5.5983 },
            { name: 'Ogun', lat: 6.9075, lng: 3.5813 },
            { name: 'Ondo', lat: 7.2571, lng: 5.2058 },
            { name: 'Osun', lat: 7.5629, lng: 4.5200 },
            { name: 'Oyo', lat: 7.9350, lng: 3.9330 },
            { name: 'Plateau', lat: 9.2182, lng: 9.5179 },
            { name: 'Rivers', lat: 4.8156, lng: 7.0498 },
            { name: 'Sokoto', lat: 13.0059, lng: 5.2476 },
            { name: 'Taraba', lat: 8.8937, lng: 11.3614 },
            { name: 'Yobe', lat: 12.0000, lng: 11.5000 },
            { name: 'Zamfara', lat: 12.1628, lng: 6.6614 }
        ];

        // Rename Abuja to FCT if exists
        await db.query("UPDATE states SET name = 'Federal Capital Territory (FCT) – Abuja' WHERE name = 'Abuja'");

        for (const state of nigeriaStates) {
            const [exists] = await db.query('SELECT id FROM states WHERE name = ?', [state.name]);
            if (exists.length === 0) {
                await db.query('INSERT INTO states (name, lat, lng) VALUES (?, ?, ?)', [state.name, state.lat, state.lng]);
            }
        }

        // LGAs Table
        await db.query(`CREATE TABLE IF NOT EXISTS lgas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            state_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
        )`);

        // Cities Table
        await db.query(`CREATE TABLE IF NOT EXISTS cities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            state_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
        )`);

        // Users Table
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role_id INT,
            phone VARCHAR(20),
            state_id INT,
            city_id INT,
            lga_id INT,
            shop_address VARCHAR(255),
            cac_number VARCHAR(50),
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id)
        )`);

        // Attempt to add columns if they don't exist (for existing DBs)
        try {
            await db.query("ALTER TABLE users ADD COLUMN shop_address VARCHAR(255)");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE users ADD COLUMN cac_number VARCHAR(50)");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE users ADD COLUMN lga_id INT");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE users ADD COLUMN role_id INT");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20)");
        } catch (e) {}

        // Seed Default Admin
        const [adminUser] = await db.query("SELECT id FROM users WHERE email = 'admin@niecomm.com'");
        if (adminUser.length === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const [adminRole] = await db.query("SELECT id FROM roles WHERE name = 'admin'");
            if (adminRole.length > 0) {
                await db.query(
                    "INSERT INTO users (username, email, password, role_id, is_verified) VALUES (?, ?, ?, ?, 1)",
                    ['Admin', 'admin@niecomm.com', hashedPassword, adminRole[0].id]
                );
                console.log('Default Admin created: admin@niecomm.com / password123');
            }
        }
        
        // Vendor Verifications Table
        await db.query(`CREATE TABLE IF NOT EXISTS vendor_verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            cac_certificate_path VARCHAR(255),
            shop_image_path VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        try {
            await db.query("ALTER TABLE vendor_verifications ADD COLUMN cac_certificate_path VARCHAR(255)");
            await db.query("ALTER TABLE vendor_verifications ADD COLUMN shop_image_path VARCHAR(255)");
        } catch (e) {}

        // Products Table
        await db.query(`CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            quantity INT DEFAULT 0,
            category_id INT,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES users(id)
        )`);

        // Orders Table
        await db.query(`CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(50) NOT NULL UNIQUE,
            customer_id INT NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            shipping_address TEXT NOT NULL,
            status ENUM('processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
            payment_status ENUM('pending', 'paid', 'held', 'failed') DEFAULT 'pending',
            payment_method VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )`);

        // Update Orders Table for payment_method, delivered_at, payout_status
        try {
            await db.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50)");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP NULL");
        } catch (e) {}
        try {
            await db.query("ALTER TABLE orders ADD COLUMN payout_status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending'");
        } catch (e) {}

        // Order Items Table
        await db.query(`CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        // Reviews Table
        await db.query(`CREATE TABLE IF NOT EXISTS product_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id INT NOT NULL,
            rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            image_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        try {
            await db.query("ALTER TABLE product_reviews ADD COLUMN image_path VARCHAR(255)");
        } catch (e) {}

        // Wallet Transactions Table
        await db.query(`CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            type ENUM('credit', 'debit') NOT NULL,
            description VARCHAR(255),
            status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
            reference VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Update Users Table for OTP
        try {
            await db.query("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6)");
            await db.query("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP NULL");
        } catch (e) {}

        // Seed LGAs for Lagos (Sample)
        const lagosState = await db.query("SELECT id FROM states WHERE name = 'Lagos'");
        if (lagosState[0].length > 0) {
            const lagosId = lagosState[0][0].id;
            const lagosLgas = [
                'Alimosho', 'Ajeromi-Ifelodun', 'Kosofe', 'Mushin', 'Oshodi-Isolo', 'Ojo', 'Ikorodu', 'Surulere', 'Agege', 
                'Ifako-Ijaiye', 'Somolu', 'Amuwo-Odofin', 'Lagos Mainland', 'Ikeja', 'Eti-Osa', 'Badagry', 'Apapa', 'Lagos Island', 'Epe', 'Ibeju-Lekki'
            ];
            
            for (const lga of lagosLgas) {
                const [exists] = await db.query('SELECT id FROM lgas WHERE name = ? AND state_id = ?', [lga, lagosId]);
                if (exists.length === 0) {
                    await db.query('INSERT INTO lgas (state_id, name) VALUES (?, ?)', [lagosId, lga]);
                }
            }
        }
        
        // Seed LGAs for FCT (Sample)
        const fctState = await db.query("SELECT id FROM states WHERE name LIKE 'Federal Capital Territory%'");
        if (fctState[0].length > 0) {
            const fctId = fctState[0][0].id;
            const fctLgas = ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'];
            for (const lga of fctLgas) {
                const [exists] = await db.query('SELECT id FROM lgas WHERE name = ? AND state_id = ?', [lga, fctId]);
                if (exists.length === 0) {
                    await db.query('INSERT INTO lgas (state_id, name) VALUES (?, ?)', [fctId, lga]);
                }
            }
        }

        // Returns Table
        await db.query(`CREATE TABLE IF NOT EXISTS returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            reason TEXT NOT NULL,
            status ENUM('requested', 'approved', 'rejected', 'refunded') DEFAULT 'requested',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);

        // Vendor Profiles (Bank Details) - Extending Users or separate table
        // We will add columns to users table for simplicity as per current structure
        try {
            await db.query("ALTER TABLE users ADD COLUMN bank_name VARCHAR(100)");
            await db.query("ALTER TABLE users ADD COLUMN account_number VARCHAR(20)");
            await db.query("ALTER TABLE users ADD COLUMN account_name VARCHAR(100)");
        } catch (e) {}

        // Product Extras
        try {
            await db.query("ALTER TABLE products ADD COLUMN image2 VARCHAR(255)");
            await db.query("ALTER TABLE products ADD COLUMN image3 VARCHAR(255)");
            await db.query("ALTER TABLE products ADD COLUMN warranty_period INT DEFAULT 0"); // in months
        } catch (e) {}

        await db.end();
        console.log('Database and tables checked/created');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

async function getDb() {
    return await mysql.createConnection(dbConfig);
}

// API Routes

// Login
app.post('/api/auth/login', async ( req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter email and password' });
    }

    try {
        const conn = await getDb();
        const [rows] = await conn.execute(
            'SELECT u.id, u.username, u.email, u.password, u.role_id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
            [email]
        );
        await conn.end();

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info (in a real app, send a token)
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register
app.post('/api/auth/register', upload.any(), async (req, res) => {
    // Note: upload.any() handles multipart/form-data
    // Log the received body for debugging
    console.log('Register Payload:', req.body);
    
    const { username, email, password, role, phone, state_id, city_id, lga_id, shop_address, cac_number } = req.body;
    
    // Basic validation
    // Ensure all REQUIRED fields for a basic user are present
    if (!username || !email || !password) {
        console.log('Validation failed: Missing username, email, or password');
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (role === 'vendor' && (!shop_address || !cac_number)) {
        console.log('Validation failed: Vendor missing shop_address or cac_number');
        return res.status(400).json({ error: 'Vendors must provide Shop Address and CAC Number' });
    }

    try {
        const conn = await getDb();
        
        // Check if email exists
        const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            await conn.end();
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Get Role ID (default to user if not specified)
        let roleId = 2; // Default 'user'
        if (role === 'vendor') {
            const [r] = await conn.execute("SELECT id FROM roles WHERE name = 'vendor'");
            if (r.length > 0) roleId = r[0].id;
        } else {
             const [r] = await conn.execute("SELECT id FROM roles WHERE name = 'user'");
             if (r.length > 0) roleId = r[0].id;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await conn.execute(
            'INSERT INTO users (username, email, password, role_id, phone, state_id, city_id, lga_id, shop_address, cac_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [username, email, hashedPassword, roleId, phone || null, state_id || null, city_id || null, lga_id || null, shop_address || null, cac_number || null]
        );
        
        await conn.end();
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const conn = await getDb();
        
        await conn.query(`CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(50)
        )`);

        const [rows] = await conn.execute('SELECT * FROM categories ORDER BY name');
        
        // Check and seed new categories if they don't exist
        const defaultCats = [
            ['Phones', 'fa-mobile-alt'],
            ['Laptops', 'fa-laptop'],
            ['Accessories', 'fa-headphones'],
            ['Tablets', 'fa-tablet-alt'],
            ['Smartwatches', 'fa-clock'],
            ['Gaming', 'fa-gamepad']
        ];

        let hasNew = false;
        const existingNames = rows.map(r => r.name);
        
        for (const cat of defaultCats) {
            if (!existingNames.includes(cat[0])) {
                await conn.execute('INSERT INTO categories (name, icon) VALUES (?, ?)', cat);
                hasNew = true;
            }
        }
        
        if (hasNew || rows.length === 0) {
             const [newRows] = await conn.execute('SELECT * FROM categories ORDER BY name');
             await conn.end();
             return res.json(newRows);
        }

        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Products (with Location & Verification & Distance)
app.get('/api/products', async (req, res) => {
    try {
        const conn = await getDb();
        const { state_id, city_id, lga_id, user_lat, user_lng } = req.query;

        // Ensure table exists
        await conn.query(`CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vendor_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            quantity INT DEFAULT 0,
            category_id INT,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        let distanceCol = 'NULL as distance_km';
        if (user_lat && user_lng) {
            // Haversine Formula (approx) using State Coordinates
            distanceCol = `
                (6371 * acos(
                    cos(radians(${user_lat})) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(${user_lng})) +
                    sin(radians(${user_lat})) * sin(radians(s.lat))
                )) AS distance_km
            `;
        }

        let query = `
            SELECT p.*, 
                   u.username as vendor_name, 
                   u.is_verified, 
                   u.shop_address,
                   u.lga_id,
                   s.name as state_name,
                   c.name as city_name,
                   cat.name as category_name,
                   (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND id IN (SELECT order_id FROM order_items WHERE product_id = p.id)) as sales_count,
                   ${distanceCol}
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            LEFT JOIN states s ON u.state_id = s.id
            LEFT JOIN cities c ON u.city_id = c.id
            LEFT JOIN categories cat ON p.category_id = cat.id
        `;
        
        const params = [];
        const conditions = [];

        if (state_id) {
            conditions.push('u.state_id = ?');
            params.push(state_id);
        }
        if (city_id) {
            conditions.push('u.city_id = ?');
            params.push(city_id);
        }
        if (lga_id) {
            conditions.push('u.lga_id = ?');
            params.push(lga_id);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Sort by Verified first, then Distance (if available), then Newest
        let orderBy = 'u.is_verified DESC';
        if (user_lat && user_lng) {
            orderBy += ', distance_km ASC';
        }
        orderBy += ', p.created_at DESC';
        
        query += ` ORDER BY ${orderBy} LIMIT 50`;

        const [rows] = await conn.execute(query, params);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get States
app.get('/api/states', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM states ORDER BY name');
        await conn.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Cities
app.get('/api/states/:id/cities', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM cities WHERE state_id = ? ORDER BY name', [req.params.id]);
        await conn.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get LGAs
app.get('/api/states/:id/lgas', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM lgas WHERE state_id = ? ORDER BY name', [req.params.id]);
        await conn.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User Dashboard Data
app.get('/api/user/dashboard', async (req, res) => {
    const userId = req.query.user_id; // In real app, get from token/session
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        
        // Get Order Count
        const [orderCountRows] = await conn.execute('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?', [userId]);
        const orderCount = orderCountRows[0].count;

        // Get Recent Orders
        const [orders] = await conn.execute(
            'SELECT id, order_number, total_amount, status, payment_status, payout_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 5',
            [userId]
        );

        await conn.end();
        res.json({ orderCount, orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Vendor Dashboard Data
app.get('/api/vendor/dashboard', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        
        // Get Vendor Info
        const [userRows] = await conn.execute('SELECT is_verified FROM users WHERE id = ?', [userId]);
        const isVerified = userRows.length > 0 ? userRows[0].is_verified : 0;

        // Product Count
        const [prodRows] = await conn.execute('SELECT COUNT(*) as count FROM products WHERE vendor_id = ?', [userId]);
        const productCount = prodRows[0].count;

        // Order Count (Items sold)
        const [orderRows] = await conn.execute(`
            SELECT COUNT(*) as count 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE p.vendor_id = ?
        `, [userId]);
        const salesCount = orderRows[0].count;

        // Pending Returns
        const [returnRows] = await conn.execute(`
            SELECT COUNT(*) as count 
            FROM returns r
            JOIN products p ON r.product_id = p.id
            WHERE p.vendor_id = ? AND r.status = 'requested'
        `, [userId]);
        const pendingReturns = returnRows[0].count;

        // Average Rating
        const [ratingRows] = await conn.execute(`
            SELECT AVG(rating) as avg_rating
            FROM product_reviews pr
            JOIN products p ON pr.product_id = p.id
            WHERE p.vendor_id = ?
        `, [userId]);
        const avgRating = ratingRows[0].avg_rating || 0;

        // Verification Status
        const [verRows] = await conn.execute('SELECT status, created_at FROM vendor_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
        const verification = verRows.length > 0 ? verRows[0] : null;

        await conn.end();
        res.json({ isVerified, productCount, verification, salesCount, pendingReturns, avgRating });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Vendor Products List
app.get('/api/vendor/products', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM products WHERE vendor_id = ? ORDER BY created_at DESC', [userId]);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Product
app.post('/api/vendor/products', upload.single('image'), async (req, res) => {
    console.log('Received product add request:', req.body);
    console.log('Received file:', req.file);
    const { user_id, name, description, price, quantity, category_id } = req.body;
    if (!user_id || !name || !price) {
        console.log('Missing fields:', { user_id, name, price });
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const image = req.file ? 'uploads/products/' + req.file.filename : null;

    try {
        const conn = await getDb();
        
        // Verify user exists first
        const [userCheck] = await conn.execute('SELECT id FROM users WHERE id = ?', [user_id]);
        if (userCheck.length === 0) {
            console.log('User not found:', user_id);
            await conn.end();
            return res.status(400).json({ error: 'Invalid User ID. Please log out and log in again.' });
        }

        await conn.execute(
            'INSERT INTO products (vendor_id, name, description, price, quantity, category_id, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [user_id, name, description, price, quantity || 0, category_id || 1, image]
        );
        await conn.end();
        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        console.error('Add Product Error:', err);
        res.status(500).json({ error: 'Failed to add product: ' + err.message });
    }
});

// Delete Product
app.delete('/api/vendor/products/:id', async (req, res) => {
    const userId = req.query.user_id;
    const productId = req.params.id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        // Verify ownership
        const [check] = await conn.execute('SELECT id FROM products WHERE id = ? AND vendor_id = ?', [productId, userId]);
        if (check.length === 0) {
            await conn.end();
            return res.status(403).json({ error: 'Not authorized to delete this product' });
        }

        await conn.execute('DELETE FROM products WHERE id = ?', [productId]);
        await conn.end();
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Product
app.put('/api/vendor/products/:id', upload.single('image'), async (req, res) => {
    const userId = req.body.user_id; // Multipart form sends fields in body
    const productId = req.params.id;
    const { name, description, price, quantity, category_id } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        // Verify ownership
        const [check] = await conn.execute('SELECT id, image FROM products WHERE id = ? AND vendor_id = ?', [productId, userId]);
        if (check.length === 0) {
            await conn.end();
            return res.status(403).json({ error: 'Not authorized to edit this product' });
        }

        let imagePath = check[0].image;
        if (req.file) {
            imagePath = 'uploads/products/' + req.file.filename;
        }

        await conn.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, quantity = ?, category_id = ?, image = ? WHERE id = ?',
            [name, description, price, quantity, category_id, imagePath, productId]
        );
        
        await conn.end();
        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API Routes
// ----------------

// Admin Stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const conn = await getDb();
        const [users] = await conn.execute('SELECT COUNT(*) as count FROM users');
        const [orders] = await conn.execute('SELECT COUNT(*) as count FROM orders');
        const [products] = await conn.execute('SELECT COUNT(*) as count FROM products');
        const [pendingVendors] = await conn.execute("SELECT COUNT(*) as count FROM vendor_verifications WHERE status = 'pending'");
        const [pendingReturns] = await conn.execute("SELECT COUNT(*) as count FROM returns WHERE status = 'requested'");
        
        await conn.end();
        res.json({
            users: users[0].count,
            orders: orders[0].count,
            products: products[0].count,
            pendingVendors: pendingVendors[0].count,
            pendingReturns: pendingReturns[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get Pending Verifications
app.get('/api/admin/verifications', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute(`
            SELECT vv.*, u.username, u.email, u.shop_address, u.cac_number 
            FROM vendor_verifications vv 
            JOIN users u ON vv.user_id = u.id 
            WHERE vv.status = 'pending'
        `);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Approve/Reject Verification
app.post('/api/admin/verifications/:id', async (req, res) => {
    const { status, user_id } = req.body; // status: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const conn = await getDb();
        await conn.execute('UPDATE vendor_verifications SET status = ? WHERE id = ?', [status, req.params.id]);
        
        if (status === 'approved') {
            await conn.execute('UPDATE users SET is_verified = TRUE WHERE id = ?', [user_id]);
        }
        
        await conn.end();
        res.json({ message: `Verification ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Update Order Payment Status
app.post('/api/admin/orders/:id/payment', async (req, res) => {
    const { status } = req.body;
    try {
        const conn = await getDb();
        await conn.execute('UPDATE orders SET payment_status = ? WHERE id = ?', [status, req.params.id]);
        await conn.end();
        res.json({ message: 'Payment status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get Pending Withdrawals
app.get('/api/admin/withdrawals', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute(`
            SELECT wt.*, u.username, u.email, u.bank_name, u.account_number, u.account_name
            FROM wallet_transactions wt
            JOIN users u ON wt.user_id = u.id
            WHERE wt.type = 'debit' AND wt.description = 'Withdrawal Request' AND wt.status = 'pending'
            ORDER BY wt.created_at ASC
        `);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Process Withdrawal (Mark as Sent/Rejected)
app.post('/api/admin/withdrawals/:id', async (req, res) => {
    const { status, admin_note } = req.body; // status: 'completed' | 'rejected'
    if (!['completed', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const conn = await getDb();
        
        if (status === 'rejected') {
            // Refund the balance
            const [tx] = await conn.execute('SELECT user_id, amount FROM wallet_transactions WHERE id = ?', [req.params.id]);
            if (tx.length > 0) {
                const { user_id, amount } = tx[0];
                await conn.execute("INSERT INTO wallet_transactions (user_id, amount, type, description, status) VALUES (?, ?, 'credit', 'Withdrawal Refunded', 'completed')", [user_id, amount]);
            }
        }

        await conn.execute('UPDATE wallet_transactions SET status = ?, description = CONCAT(description, ?) WHERE id = ?', 
            [status, admin_note ? ` - ${admin_note}` : '', req.params.id]);
        
        await conn.end();
        res.json({ message: `Withdrawal ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get Returns
app.get('/api/admin/returns', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute(`
            SELECT r.*, u.username, p.name as product_name, o.order_number 
            FROM returns r 
            JOIN users u ON r.user_id = u.id 
            JOIN products p ON r.product_id = p.id 
            JOIN orders o ON r.order_id = o.id 
            ORDER BY r.created_at DESC
        `);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Update Return Status
app.post('/api/admin/returns/:id', async (req, res) => {
    const { status, admin_notes } = req.body;
    
    try {
        const conn = await getDb();
        await conn.execute('UPDATE returns SET status = ?, admin_notes = ? WHERE id = ?', [status, admin_notes, req.params.id]);
        await conn.end();
        res.json({ message: 'Return status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Messages API
app.get('/api/messages', async (req, res) => {
    const userId = req.query.user_id;
    const partnerId = req.query.partner_id;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        
        // Ensure table exists (lazy init)
        await conn.query(`CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            product_id INT NULL,
            order_id INT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP NULL
        )`);

        if (partnerId) {
            // Get conversation with specific partner
            const [rows] = await conn.execute(
                'SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC',
                [userId, partnerId, partnerId, userId]
            );
            await conn.end();
            res.json(rows);
        } else {
            // Get list of conversations
            const [rows] = await conn.execute(`
                SELECT 
                    IF(sender_id = ?, receiver_id, sender_id) AS partner_id,
                    MAX(created_at) AS last_time
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY partner_id
                ORDER BY last_time DESC
            `, [userId, userId, userId]);
            
            // Fetch partner names
            for (let row of rows) {
                const [u] = await conn.execute('SELECT username FROM users WHERE id = ?', [row.partner_id]);
                if (u.length > 0) row.partner_name = u[0].username;
            }
            
            await conn.end();
            res.json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/messages', async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    if (!sender_id || !receiver_id || !content) return res.status(400).json({ error: 'Missing fields' });

    try {
        const conn = await getDb();
        await conn.execute(
            'INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, NOW())',
            [sender_id, receiver_id, content]
        );
        await conn.end();
        res.status(201).json({ message: 'Message sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// States and Cities
app.get('/api/states', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM states ORDER BY name');
        await conn.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// Place Order
app.post('/api/orders', async (req, res) => {
    const { user_id, shipping_address, cart, payment_method } = req.body;
    if (!user_id || !shipping_address || !cart || cart.length === 0) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    try {
        const conn = await getDb();
        
        // Calculate Total & Validate Items
        let total = 0;
        const itemsToInsert = [];

        for (const item of cart) {
            const [rows] = await conn.execute('SELECT id, price FROM products WHERE id = ?', [item.id]);
            if (rows.length > 0) {
                const product = rows[0];
                const price = parseFloat(product.price);
                const qty = parseInt(item.quantity);
                total += price * qty;
                itemsToInsert.push({
                    product_id: product.id,
                    quantity: qty,
                    price: price
                });
            }
        }

        if (itemsToInsert.length === 0) {
            await conn.end();
            return res.status(400).json({ error: 'No valid items in cart' });
        }

        const orderNumber = 'NGM-' + Date.now();
        
        // Create Order
        // Status is 'processing', Payment is 'held' (Escrow)
        const [orderResult] = await conn.execute(
            "INSERT INTO orders (order_number, customer_id, total_amount, shipping_address, status, payment_status, payment_method, created_at) VALUES (?, ?, ?, ?, 'processing', 'held', ?, NOW())",
            [orderNumber, user_id, total, shipping_address, payment_method || 'card']
        );
        
        const orderId = orderResult.insertId;

        // Insert Order Items
        for (const item of itemsToInsert) {
            await conn.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await conn.end();
        res.status(201).json({ message: 'Order placed successfully', orderNumber });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// Get User Orders
app.get('/api/orders', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        const [rows] = await conn.execute(
            'SELECT id, order_number, total_amount, status, payment_status, payout_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC',
            [userId]
        );
        await conn.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Vendor Orders
app.get('/api/vendor/orders', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        // Join orders and order_items to find orders containing vendor's products
        // Group by order to aggregate items for this vendor
        const [rows] = await conn.execute(`
            SELECT o.id, o.order_number, o.status, o.payment_status, o.created_at,
                   GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p.name) SEPARATOR ', ') as items_summary,
                   SUM(oi.price * oi.quantity) as vendor_total
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.vendor_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [userId]);
        
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Vendor Profile
app.get('/api/vendor/profile', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT username, email, phone, shop_address, cac_number, state_id, city_id, lga_id, bank_name, account_number, account_name FROM users WHERE id = ?', [userId]);
        await conn.end();
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Vendor Profile (General & Bank)
app.put('/api/vendor/profile', async (req, res) => {
    const { user_id, username, phone, shop_address, cac_number, bank_name, account_number, account_name } = req.body;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        
        // Build dynamic update query
        let fields = [];
        let params = [];

        if (username !== undefined) { fields.push('username = ?'); params.push(username); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
        if (shop_address !== undefined) { fields.push('shop_address = ?'); params.push(shop_address); }
        if (cac_number !== undefined) { fields.push('cac_number = ?'); params.push(cac_number); }
        if (bank_name !== undefined) { fields.push('bank_name = ?'); params.push(bank_name); }
        if (account_number !== undefined) { fields.push('account_number = ?'); params.push(account_number); }
        if (account_name !== undefined) { fields.push('account_name = ?'); params.push(account_name); }

        if (fields.length === 0) return res.json({ message: 'No changes provided' });

        params.push(user_id);
        
        await conn.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );
        await conn.end();
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Product Details (Public)
app.get('/api/products/:id', async (req, res) => {
    try {
        const conn = await getDb();
        const { user_lat, user_lng } = req.query;

        let distanceCol = 'NULL as distance_km';
        if (user_lat && user_lng) {
            distanceCol = `
                (6371 * acos(
                    cos(radians(${user_lat})) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(${user_lng})) +
                    sin(radians(${user_lat})) * sin(radians(s.lat))
                )) AS distance_km
            `;
        }

        const [rows] = await conn.execute(`
            SELECT p.*, 
                   u.username as vendor_name, 
                   u.is_verified, 
                   u.shop_address,
                   s.name as state_name,
                   c.name as city_name,
                   (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND id IN (SELECT order_id FROM order_items WHERE product_id = p.id)) as sales_count,
                   (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id) as rating,
                   (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
                   ${distanceCol}
            FROM products p
            JOIN users u ON p.vendor_id = u.id
            LEFT JOIN states s ON u.state_id = s.id
            LEFT JOIN cities c ON u.city_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        await conn.end();
        
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- OTP Helper Functions ---
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Wallet API ---

// Get Wallet Balance & History
app.get('/api/wallet', async (req, res) => {
    // In a real app, verify token here
    // For demo, we assume user_id is passed in header or query (Simulated Auth)
    // BUT we should be consistent. Let's assume the frontend sends user_id for now if we don't have full JWT middleware yet
    const userId = req.query.user_id; 
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const db = await getDb();
        
        // Calculate Balance
        const [credits] = await db.query("SELECT SUM(amount) as total FROM wallet_transactions WHERE user_id = ? AND type = 'credit' AND status = 'completed'", [userId]);
        const [debits] = await db.query("SELECT SUM(amount) as total FROM wallet_transactions WHERE user_id = ? AND type = 'debit' AND status = 'completed'", [userId]);
        
        const balance = (credits[0].total || 0) - (debits[0].total || 0);

        // Get Transactions
        const [transactions] = await db.query("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId]);

        await db.end();
        res.json({ balance, transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request Withdrawal (Requires Password)
app.post('/api/wallet/withdraw', async (req, res) => {
    const { user_id, amount, password } = req.body;
    
    if (!user_id || !amount || !password) return res.status(400).json({ error: 'Missing required fields' });

    try {
        const db = await getDb();

        // Verify Password
        const [user] = await db.query("SELECT password FROM users WHERE id = ?", [user_id]);
        if (!user.length) {
            await db.end();
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            await db.end();
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Check Balance
        const [credits] = await db.query("SELECT SUM(amount) as total FROM wallet_transactions WHERE user_id = ? AND type = 'credit' AND status = 'completed'", [user_id]);
        const [debits] = await db.query("SELECT SUM(amount) as total FROM wallet_transactions WHERE user_id = ? AND type = 'debit' AND status = 'completed'", [user_id]);
        const balance = (credits[0].total || 0) - (debits[0].total || 0);

        if (balance < amount) {
            await db.end();
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // Create Withdrawal Transaction
        await db.query("INSERT INTO wallet_transactions (user_id, amount, type, description, status) VALUES (?, ?, 'debit', 'Withdrawal Request', 'pending')", [user_id, amount]);

        await db.end();
        res.json({ message: 'Withdrawal request submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- OTP API ---

app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const db = await getDb();
        const [user] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        
        if (!user.length) {
            await db.end();
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

        await db.query("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?", [otp, expiresAt, user[0].id]);

        // SIMULATION: Log OTP to console (Since we don't have email server)
        console.log(`[OTP SIMULATION] OTP for ${email}: ${otp}`);

        await db.end();
        res.json({ message: 'OTP sent successfully (Check console for simulation)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- Reviews API (Updated) ---
app.post('/api/reviews', upload.single('reviewImage'), async (req, res) => {
    const { product_id, user_id, rating, comment } = req.body;
    const imagePath = req.file ? `/uploads/reviews/${req.file.filename}` : null;

    try {
        const db = await getDb();
        await db.query(
            "INSERT INTO product_reviews (product_id, user_id, rating, comment, image_path) VALUES (?, ?, ?, ?, ?)",
            [product_id, user_id, rating, comment, imagePath]
        );
        await db.end();
        res.json({ message: 'Review added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Add Review (Old - Deprecated/Replaced)
// app.post('/api/products/:id/reviews', ...

// Submit Return Request
app.post('/api/returns', async (req, res) => {
    const { user_id, order_id, reason, return_method } = req.body;
    
    if (!user_id || !order_id || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const conn = await getDb();
        
        // Ensure table exists
        await conn.query(`CREATE TABLE IF NOT EXISTS returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id INT NOT NULL,
            product_id INT NULL, -- Can be null if returning whole order
            reason TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'requested', -- requested, approved, rejected, completed
            return_method VARCHAR(50) DEFAULT 'pickup', -- pickup, dropoff
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Get first product from order for now (Simplification)
        const [items] = await conn.execute('SELECT product_id FROM order_items WHERE order_id = ? LIMIT 1', [order_id]);
        const productId = items.length > 0 ? items[0].product_id : null;

        await conn.execute(
            'INSERT INTO returns (user_id, order_id, product_id, reason, return_method, status, created_at) VALUES (?, ?, ?, ?, ?, "requested", NOW())',
            [user_id, order_id, productId, reason, return_method || 'pickup']
        );
        
        await conn.end();
        res.status(201).json({ message: 'Return requested successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



// Get User Returns
app.get('/api/user/returns', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const conn = await getDb();
        const [rows] = await conn.execute(`
            SELECT r.*, p.name as product_name, o.order_number 
            FROM returns r 
            JOIN products p ON r.product_id = p.id 
            JOIN orders o ON r.order_id = o.id 
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC
        `, [userId]);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Order Status (Admin/Vendor)
app.put('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const conn = await getDb();
        
        let updateQuery = "UPDATE orders SET status = ? WHERE id = ?";
        let params = [status, orderId];

        // If delivered, set delivered_at
        if (status === 'delivered') {
            updateQuery = "UPDATE orders SET status = ?, delivered_at = NOW() WHERE id = ?";
        }

        await conn.execute(updateQuery, params);
        await conn.end();
        res.json({ message: 'Order status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get Escrow Stats
app.get('/api/admin/escrow-stats', async (req, res) => {
    try {
        const conn = await getDb();
        
        // Total held in escrow (payment_status='held')
        const [heldRows] = await conn.execute("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'held'");
        const totalHeld = heldRows[0].total || 0;

        // Pending Payouts (Delivered > 3 days ago, payout_status='pending', payment_status='held')
        const [pendingRows] = await conn.execute(`
            SELECT COUNT(*) as count, SUM(total_amount) as total 
            FROM orders 
            WHERE status = 'delivered' 
            AND payment_status = 'held'
            AND payout_status = 'pending'
            AND delivered_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
        `);
        
        // Orders currently in 3-day window
        const [windowRows] = await conn.execute(`
            SELECT COUNT(*) as count, SUM(total_amount) as total
            FROM orders
            WHERE status = 'delivered'
            AND payment_status = 'held'
            AND payout_status = 'pending'
            AND delivered_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        `);

        await conn.end();

        res.json({
            totalHeld,
            pendingPayouts: {
                count: pendingRows[0].count,
                total: pendingRows[0].total || 0
            },
            inWindow: {
                count: windowRows[0].count,
                total: windowRows[0].total || 0
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Process Escrow Payouts (Simulate Cron)
app.post('/api/admin/process-escrow', async (req, res) => {
    try {
        const conn = await getDb();
        
        // 1. Find eligible orders
        // Delivered > 3 days ago, Payment Held, Payout Pending
        const [orders] = await conn.execute(`
            SELECT o.id, o.order_number, o.total_amount, p.vendor_id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'delivered' 
            AND o.payment_status = 'held'
            AND o.payout_status = 'pending'
            AND o.delivered_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
            GROUP BY o.id
        `);

        if (orders.length === 0) {
            await conn.end();
            return res.json({ message: 'No eligible orders for payout', processed: 0 });
        }

        let processedCount = 0;

        for (const order of orders) {
            // Check for Active Returns
            const [returns] = await conn.execute("SELECT id FROM returns WHERE order_id = ? AND status IN ('requested', 'approved')", [order.id]);
            
            if (returns.length > 0) {
                // Skip this order if there is an active return
                continue;
            }

            // Process Payout
            // 1. Credit Vendor Wallet
            await conn.execute(
                "INSERT INTO wallet_transactions (user_id, amount, type, description, status, reference) VALUES (?, ?, 'credit', ?, 'completed', ?)",
                [order.vendor_id, order.total_amount, `Payout for Order #${order.order_number}`, order.order_number]
            );

            // 2. Update Order Payout Status
            await conn.execute("UPDATE orders SET payout_status = 'completed', payment_status = 'paid' WHERE id = ?", [order.id]);

            processedCount++;
        }

        await conn.end();
        res.json({ message: 'Escrow processing complete', processed: processedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User: Confirm Order Receipt & Satisfaction
app.post('/api/orders/:id/confirm', async (req, res) => {
    const orderId = req.params.id;
    try {
        const conn = await getDb();
        
        // 1. Get Order Details
        const [orders] = await conn.execute(`
            SELECT o.id, o.order_number, o.total_amount, o.status, o.payout_status, o.payment_status, p.vendor_id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = ?
            GROUP BY o.id
        `, [orderId]);

        if (orders.length === 0) {
            await conn.end();
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Check if already processed
        if (order.payout_status === 'completed') {
            await conn.end();
            return res.status(400).json({ error: 'Order already completed' });
        }

        // 2. Credit Vendor Wallet
        await conn.execute(
            "INSERT INTO wallet_transactions (user_id, amount, type, description, status, reference) VALUES (?, ?, 'credit', ?, 'completed', ?)",
            [order.vendor_id, order.total_amount, `Payout for Order #${order.order_number} (Confirmed by Buyer)`, order.order_number]
        );

        // 3. Update Order Status
        // Mark as delivered (if not already), paid, and payout completed
        await conn.execute(`
            UPDATE orders 
            SET status = 'delivered', 
                delivered_at = IF(delivered_at IS NULL, NOW(), delivered_at),
                payment_status = 'paid',
                payout_status = 'completed'
            WHERE id = ?
        `, [orderId]);

        await conn.end();
        res.json({ message: 'Order confirmed and funds released to vendor' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get Dashboard Stats
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const conn = await getDb();
        
        // Counts
        const [userCount] = await conn.execute("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'user'");
        const [vendorCount] = await conn.execute("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'vendor'");
        const [orderCount] = await conn.execute("SELECT COUNT(*) as count FROM orders");
        
        // Revenue (Escrowed)
        const [escrowTotal] = await conn.execute("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'held'");

        // Pending Verifications
        const [pendingVerifications] = await conn.execute("SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'vendor' AND u.is_verified = 0");

        await conn.end();
        
        res.json({
            users: userCount[0].count,
            vendors: vendorCount[0].count,
            orders: orderCount[0].count,
            escrow_held: escrowTotal[0].total || 0,
            pending_verifications: pendingVerifications[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get All Users (with filters)
app.get('/api/admin/users', async (req, res) => {
    try {
        const conn = await getDb();
        const role = req.query.role; // 'user' or 'vendor'
        
        let query = `
            SELECT u.id, u.username, u.email, u.phone, u.is_verified, u.created_at, r.name as role, u.shop_address, u.cac_number
            FROM users u 
            JOIN roles r ON u.role_id = r.id
        `;
        
        const params = [];
        if (role) {
            query += " WHERE r.name = ?";
            params.push(role);
        }
        
        query += " ORDER BY u.created_at DESC";

        const [rows] = await conn.execute(query, params);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Verify Vendor
app.put('/api/admin/verify-vendor', async (req, res) => {
    const { user_id, action } = req.body; // action: 'approve' or 'reject'
    if (!user_id || !action) return res.status(400).json({ error: 'Missing fields' });

    try {
        const conn = await getDb();
        const isVerified = action === 'approve' ? 1 : 0;
        
        await conn.execute("UPDATE users SET is_verified = ? WHERE id = ?", [isVerified, user_id]);
        
        await conn.end();
        res.json({ message: `Vendor ${action}d successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin: Get All Orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute(`
            SELECT o.*, u.username as customer_name 
            FROM orders o
            JOIN users u ON o.customer_id = u.id
            ORDER BY o.created_at DESC
        `);
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile
app.get('/api/user/profile', async (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        const [rows] = await conn.execute(
            'SELECT id, username, email, phone, state_id, city_id, lga_id, shop_address FROM users WHERE id = ?',
            [userId]
        );
        await conn.end();
        
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update User Profile
app.put('/api/user/profile', async (req, res) => {
    const { user_id, username, phone, state_id, city_id, lga_id, shop_address } = req.body;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const conn = await getDb();
        
        // Basic validation (optional)
        if (!username) return res.status(400).json({ error: 'Username is required' });

        await conn.execute(
            'UPDATE users SET username = ?, phone = ?, state_id = ?, city_id = ?, lga_id = ?, shop_address = ? WHERE id = ?',
            [username, phone || null, state_id || null, city_id || null, lga_id || null, shop_address || null, user_id]
        );

        await conn.end();
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Catch-all to serve index.html for unknown routes (SPA-like behavior if needed, or 404)
// For now, let's just serve specific files or 404
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check / Version endpoint
app.get('/api/version', (req, res) => {
    res.json({ version: '1.2.0', updated: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    if (err) {
        console.error(err.stack || err);
        return res.status(500).json({ error: 'Something went wrong!' });
    }
    next();
});

app.listen(PORT, async () => {
    await initDb();
    console.log(`Server running on http://localhost:${PORT}`);
});
