import mysql from 'mysql2/promise'

export async function getConnection() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  return mysql.createConnection({
    host: DB_HOST || '127.0.0.1',
    port: Number(DB_PORT || 3306),
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'test'
  })
}

