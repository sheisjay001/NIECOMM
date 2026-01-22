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
                        <li class="nav-item" id="nav-home"><a class="nav-link px-3" href="/">Home</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="products.html">Marketplace</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="vendors.html">Vendors</a></li>
                        <li class="nav-item" id="nav-about"><a class="nav-link px-3" href="about.html">About</a></li>
                        <li class="nav-item" id="nav-contact"><a class="nav-link px-3" href="contact.html">Contact</a></li>
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
    
    // Nav items visibility
    const navHome = document.getElementById('nav-home');
    const navAbout = document.getElementById('nav-about');
    const navContact = document.getElementById('nav-contact');

    if (!userStr) {
        // Not logged in: Show Home, About, Contact
        if (navHome) navHome.style.display = '';
        if (navAbout) navAbout.style.display = '';
        if (navContact) navContact.style.display = '';

        if (authButtons) {
            authButtons.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary btn-sm px-3 rounded-pill">Log In</a>
                <a href="register.html" class="btn btn-primary btn-sm px-3 rounded-pill">Sign Up</a>
            `;
        }
        return null;
    }

    // Logged in: Hide Home, About, Contact
    if (navHome) navHome.style.display = 'none';
    if (navAbout) navAbout.style.display = 'none';
    if (navContact) navContact.style.display = 'none';

    const user = JSON.parse(userStr);
    if (authButtons) {
        let dashboardLink = 'user_dashboard.html';
        if (user.role === 'vendor') dashboardLink = 'vendor_dashboard.html';
        if (user.role === 'admin') dashboardLink = 'admin_dashboard.html';

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

// Toast Notification System
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#34C759' : (type === 'error' ? '#FF3B30' : '#0071E3');
    const icon = type === 'success' ? '<i class="fas fa-check-circle me-2"></i>' : (type === 'error' ? '<i class="fas fa-exclamation-circle me-2"></i>' : '<i class="fas fa-info-circle me-2"></i>');
    
    toast.className = 'toast-notification shadow-lg';
    toast.style.cssText = `
        background-color: ${bgColor};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        min-width: 300px;
    `;
    toast.innerHTML = `${icon} ${message}`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Cart Functions
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(p => p.id === product.id);
    const qtyToAdd = product.quantity || 1;
    
    if (existing) {
        existing.quantity += qtyToAdd;
    } else {
        cart.push({ ...product, quantity: qtyToAdd });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Product added to cart successfully!', 'success');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count-badge');
    if (badge) badge.textContent = count;
    
    // Update Mobile Badge
    const mobileBadge = document.getElementById('mobile-cart-badge');
    if (mobileBadge) {
        if (count > 0) {
            mobileBadge.style.display = 'block';
        } else {
            mobileBadge.style.display = 'none';
        }
    }
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // If nav-placeholder exists, loadNav (which calls checkAuth and updateCartCount)
    if (document.getElementById('nav-placeholder')) {
        loadNav();
    } else {
        // Otherwise just check auth and cart
        checkAuth();
        updateCartCount();
    }
});
