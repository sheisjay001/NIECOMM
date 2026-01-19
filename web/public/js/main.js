// Main JS for shared logic

// Load Navigation Dynamically (to avoid repeating HTML)
function loadNav() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        // Simplified for this static demo, usually this would be a fetch or include
        // For now, let's just inject the HTML structure if it's missing, 
        // OR better, rely on the page already having it. 
        // The previous files have the nav, but let's standardize.
        // Actually, to keep it simple and robust, I'll assume the nav is IN the HTML file
        // or I can inject it here. Let's inject it to be DRY.
        
        navPlaceholder.innerHTML = `
        <nav class="navbar navbar-expand-lg sticky-top bg-white">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center gap-2" href="/">
                    <div class="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <span class="fw-bold text-dark tracking-tight">NIECOMM</span>
                </a>
                <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-4 me-auto mb-2 mb-lg-0">
                        <li class="nav-item"><a class="nav-link px-3" href="/">Home</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="products.html">Marketplace</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="vendors.html">Vendors</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="about.html">About</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="contact.html">Contact</a></li>
                    </ul>
                    <div class="d-flex align-items-center gap-3">
                         <a href="cart.html" class="position-relative text-secondary hover-primary me-3">
                            <i class="fas fa-shopping-cart fa-lg"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" id="cart-count-badge" style="font-size: 0.6rem;">0</span>
                        </a>

                        <div id="auth-buttons" class="d-flex align-items-center gap-2">
                            <!-- Injected via checkAuth -->
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        `;
        
        // After injecting, check auth and cart
        checkAuth();
        updateCartCount();
    }
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    const authButtons = document.getElementById('auth-buttons');
    
    if (!userStr) {
        if (authButtons) {
            authButtons.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary btn-sm px-3 rounded-pill">Log In</a>
                <a href="register.html" class="btn btn-primary btn-sm px-3 rounded-pill">Sign Up</a>
            `;
        }
        return null;
    }

    const user = JSON.parse(userStr);
    if (authButtons) {
        const dashboardLink = user.role === 'vendor' ? 'vendor_dashboard.html' : 'user_dashboard.html';
        authButtons.innerHTML = `
            <div class="dropdown">
                <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown">
                    <div class="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold border" style="width: 38px; height: 38px;">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <span class="ms-2 text-dark d-none d-md-block">${user.username}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2">
                    <li><a class="dropdown-item" href="${dashboardLink}">Dashboard</a></li>
                    <li><a class="dropdown-item" href="orders.html">My Orders</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </div>
        `;
    }
    return user;
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Cart Functions
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(p => p.id === product.id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Added to cart!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = count;
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // If nav-placeholder exists, loadNav calls checkAuth and updateCartCount
    if (!document.getElementById('nav-placeholder')) {
        checkAuth();
        updateCartCount();
    }
});
