const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Security Headers
app.use((req, res, next) => {
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
        const dir = path.join(__dirname, 'public/uploads/products');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'product-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Database Connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nigeriagadgetmart'
};

async function initDb() {
    try {
        const conn = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await conn.end();
        
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
            name VARCHAR(100) NOT NULL UNIQUE
        )`);

        // Seed States (Sample)
        const [states] = await db.query('SELECT * FROM states');
        if (states.length === 0) {
            const nigeriaStates = ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Enugu', 'Edo', 'Delta', 'Ogun'];
            for (const state of nigeriaStates) {
                await db.query('INSERT INTO states (name) VALUES (?)', [state]);
            }
        }

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
        
        // Vendor Verifications Table
        await db.query(`CREATE TABLE IF NOT EXISTS vendor_verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            document_type VARCHAR(50),
            document_path VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Reviews Table
        await db.query(`CREATE TABLE IF NOT EXISTS product_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id INT NOT NULL,
            rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

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
app.post('/api/auth/login', async (req, res) => {
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
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role, phone, state_id, city_id, shop_address, cac_number } = req.body;
    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (role === 'vendor' && (!shop_address || !cac_number)) {
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
            'INSERT INTO users (username, email, password, role_id, phone, state_id, city_id, shop_address, cac_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [username, email, hashedPassword, roleId, phone || null, state_id || null, city_id || null, shop_address || null, cac_number || null]
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

// Products (Simple listing)
app.get('/api/products', async (req, res) => {
    try {
        const conn = await getDb();
        
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

        const [rows] = await conn.execute('SELECT * FROM products ORDER BY created_at DESC LIMIT 20');
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
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
            'SELECT order_number, total_amount, status, payment_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 5',
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

        // Verification Status
        const [verRows] = await conn.execute('SELECT status, created_at FROM vendor_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
        const verification = verRows.length > 0 ? verRows[0] : null;

        await conn.end();
        res.json({ isVerified, productCount, verification });
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
    const { user_id, name, description, price, quantity, category_id } = req.body;
    if (!user_id || !name || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const image = req.file ? 'uploads/products/' + req.file.filename : null;

    try {
        const conn = await getDb();
        await conn.execute(
            'INSERT INTO products (vendor_id, name, description, price, quantity, category_id, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [user_id, name, description, price, quantity || 0, category_id || 1, image]
        );
        await conn.end();
        res.status(201).json({ message: 'Product added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product' });
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
    const { user_id, shipping_address, cart } = req.body;
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
        const [orderResult] = await conn.execute(
            "INSERT INTO orders (order_number, customer_id, total_amount, shipping_address, status, payment_status, created_at) VALUES (?, ?, ?, ?, 'processing', 'held', NOW())",
            [orderNumber, user_id, total, shipping_address]
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
            'SELECT order_number, total_amount, status, payment_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC',
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
        // Distinct orders because one order might have multiple products from same vendor
        const [rows] = await conn.execute(`
            SELECT DISTINCT o.order_number, o.total_amount, o.status, o.payment_status, o.created_at 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.vendor_id = ?
            ORDER BY o.created_at DESC
        `, [userId]);
        
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Product Details
app.get('/api/products/:id', async (req, res) => {
    try {
        const conn = await getDb();
        const [rows] = await conn.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            await conn.end();
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = rows[0];
        
        // Get Reviews
        const [reviews] = await conn.execute(`
            SELECT pr.*, u.username 
            FROM product_reviews pr 
            JOIN users u ON pr.user_id = u.id 
            WHERE pr.product_id = ? 
            ORDER BY pr.created_at DESC
        `, [req.params.id]);
        
        product.reviews = reviews;
        
        await conn.end();
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add Review
app.post('/api/products/:id/reviews', async (req, res) => {
    const { user_id, rating, comment } = req.body;
    if (!user_id || !rating) return res.status(400).json({ error: 'Rating required' });
    
    try {
        const conn = await getDb();
        await conn.execute(
            'INSERT INTO product_reviews (product_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())',
            [req.params.id, user_id, rating, comment]
        );
        await conn.end();
        res.status(201).json({ message: 'Review added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request Return
app.post('/api/returns', async (req, res) => {
    const { order_id, user_id, product_id, reason } = req.body;
    if (!order_id || !user_id || !product_id || !reason) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    try {
        const conn = await getDb();
        await conn.execute(
            'INSERT INTO returns (order_id, user_id, product_id, reason, status, created_at) VALUES (?, ?, ?, ?, "requested", NOW())',
            [order_id, user_id, product_id, reason]
        );
        await conn.end();
        res.status(201).json({ message: 'Return requested successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Vendor Profile (Bank Details)
app.put('/api/vendor/profile', async (req, res) => {
    const { user_id, bank_name, account_number, account_name } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Unauthorized' });
    
    try {
        const conn = await getDb();
        await conn.execute(
            'UPDATE users SET bank_name = ?, account_number = ?, account_name = ? WHERE id = ?',
            [bank_name, account_number, account_name, user_id]
        );
        await conn.end();
        res.json({ message: 'Profile updated' });
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

// Catch-all to serve index.html for unknown routes (SPA-like behavior if needed, or 404)
// For now, let's just serve specific files or 404
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
    await initDb();
    console.log(`Server running on http://localhost:${PORT}`);
});
