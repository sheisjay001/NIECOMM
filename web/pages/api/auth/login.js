import { getConnection } from '../../../lib/db'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password.' })
  }

  try {
    const conn = await getConnection()
    const [rows] = await conn.execute(
      `SELECT u.id, u.username, u.email, u.password, u.city_id, u.state_id, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    )
    await conn.end()

    if (!rows.length) {
      return res.status(404).json({ error: 'Account not found.' })
    }

    const user = rows[0]
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      city_id: user.city_id,
      state_id: user.state_id
    }

    return res.status(200).json({ user: payload })
  } catch (e) {
    return res.status(500).json({ error: 'Server error' })
  }
}

