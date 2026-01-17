import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        setProducts(data.products || [])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <>
      <Head>
        <title>NIECOMM</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="true" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
      </Head>
      <nav className="navbar navbar-expand-lg sticky-top bg-white">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <i className="fas fa-bolt" />
            </div>
            <span className="fw-bold text-dark">NIECOMM</span>
          </Link>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Open menu">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-4 me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link px-3 active" href="/">Home</Link></li>
              <li className="nav-item"><Link className="nav-link px-3" href="/">Marketplace</Link></li>
              <li className="nav-item"><Link className="nav-link px-3" href="/">Vendors</Link></li>
            </ul>
            <div className="d-flex align-items-center gap-3">
              <Link href="/login" className="btn btn-outline-primary btn-sm px-3 rounded-pill">Log In</Link>
              <Link href="/register" className="btn btn-primary btn-sm px-3 rounded-pill">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero" data-anim="fade-up">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 text-start">
              <span className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill">
                <i className="fas fa-check-circle me-2" />Verified Vendors Only
              </span>
              <h1 className="display-3 fw-bold mb-4 text-white">The Trusted Marketplace for Gadgets in Nigeria</h1>
              <p className="lead mb-5 text-secondary text-light opacity-75">
                Buy and sell authentic electronics with confidence.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="btn btn-primary btn-lg px-4">Shop Now</a>
                <a href="#" className="btn btn-outline-light btn-lg px-4">Become a Vendor</a>
              </div>
              <div className="mt-5 d-flex align-items-center gap-4 text-white opacity-75">
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-shield-alt fa-lg" /><span>Secure Payments</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-truck fa-lg" /><span>Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 animate-on-scroll">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-5">
            <div>
              <h2 className="mb-2">Fresh Arrivals</h2>
              <p className="text-muted mb-0">The latest gadgets from verified local vendors</p>
            </div>
            <a href="#" className="btn btn-primary">View All Products</a>
          </div>
          <div className="row g-4" data-anim="fade-up">
            {loading && <div className="col-12"><div className="alert alert-info">Loading products...</div></div>}
            {!loading && products.length === 0 && <div className="col-12"><div className="alert alert-warning">No products found.</div></div>}
            {products.map(product => (
              <div className="col-md-6 col-lg-3 animate-on-scroll" key={product.id}>
                <div className="card h-100 shadow-sm hover-tilt" data-anim="zoom-in">
                  <img src={product.image1 || '/images/placeholder.jpg'} className="card-img-top" alt={product.name} />
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="h5 text-primary mb-2">₦{Number(product.price).toFixed(2)}</p>
                    <div className="d-grid">
                      <button className="btn btn-primary">Add to Cart</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5>About NIECOMM</h5>
              <p className="text-muted">Trust-driven marketplace for gadgets.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="social-links">
                <a href="https://github.com/sheisjay001/NIECOMM" aria-label="GitHub"><i className="fab fa-github text-dark" /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" />
    </>
  )
}
