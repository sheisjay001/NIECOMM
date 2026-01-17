import mysql from 'mysql2/promise'

export default async function handler(req, res) {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST || '127.0.0.1',
      port: Number(DB_PORT || 3306),
      user: DB_USER || 'root',
      password: DB_PASSWORD || '',
      database: DB_NAME || 'test'
    })
    const [rows] = await conn.execute('SELECT id, name, price, image1 FROM products WHERE is_active = 1 AND stock_quantity > 0 ORDER BY created_at DESC LIMIT 12')
    await conn.end()
    res.status(200).json({ products: rows })
  } catch (e) {
    res.status(200).json({ products: [] })
  }
}
