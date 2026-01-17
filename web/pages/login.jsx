import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        // For now just log; in a fuller migration we would store token/session
        console.log('Logged in user', data.user)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login · NIECOMM</title>
      </Head>
      <section className="py-5">
        <div className="container">
          <h2 className="mb-4">Login</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-6">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
          <div className="mt-3 d-flex gap-2">
            <Link href="/register" className="btn btn-outline-secondary">
              Create an account
            </Link>
            <Link href="/forgot-password" className="btn btn-link">
              Forgot password?
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

