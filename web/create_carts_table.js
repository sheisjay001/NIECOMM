
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nigeriagadgetmart',
    ssl: null
};

async function createTable() {
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS carts (
                user_id INT PRIMARY KEY, 
                items JSON, 
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table 'carts' created or already exists.");
        await conn.end();
    } catch (err) {
        console.error(err);
    }
}

createTable();
