// Session Timeout (30 mins)
const SESSION_TIMEOUT = 30 * 60 * 1000;
let sessionTimer;

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
        logout('Session expired due to inactivity.');
    }, SESSION_TIMEOUT);
}

// Attach listeners for activity
['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetSessionTimer, true);
});

// Initial start
resetSessionTimer();

function logout(msg) {
    localStorage.removeItem('user');
    if(msg) alert(msg); // Fallback if toast not ready or redirecting
    window.location.href = 'login.html';
}

// Toast Notification System
function showToast(message, type = 'info') {
    // Create container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : (type === 'warning' ? 'bg-warning' : 'bg-primary'));
    const textClass = type === 'warning' ? 'text-dark' : 'text-white';

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${textClass} ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Append to container
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    // Initialize and show
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    // Cleanup after hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Main JS for shared logic
function loadNav() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = `
        <nav class="navbar navbar-expand-lg sticky-top bg-white shadow-sm">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center gap-2" href="/">
                    <div class="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <span class="fw-bold text-dark tracking-tight">NIECOMM</span>
                </a>
                
                <div class="d-flex align-items-center gap-3 order-lg-last">
                    <a href="cart.html" class="position-relative text-secondary hover-primary">
                        <i class="fas fa-shopping-cart fa-lg"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" id="cart-count-badge" style="font-size: 0.6rem;">0</span>
                    </a>
                    
                    <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>

                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item" id="nav-home"><a class="nav-link px-3" href="/">Home</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="products.html">Marketplace</a></li>
                        <li class="nav-item"><a class="nav-link px-3" href="vendors.html">Vendors</a></li>
                        <li class="nav-item" id="nav-about"><a class="nav-link px-3" href="about.html">About</a></li>
                        <li class="nav-item" id="nav-contact"><a class="nav-link px-3" href="contact.html">Contact</a></li>
                    </ul>
                    <div id="auth-buttons" class="d-flex align-items-center gap-2 mt-3 mt-lg-0">
                        <!-- Injected via checkAuth -->
                    </div>
                </div>
            </div>
        </nav>

        <!-- Mobile Bottom Navigation -->
        <div class="mobile-bottom-nav">
            <a href="/" class="mobile-nav-item ${window.location.pathname === '/' || window.location.pathname === '/index.html' ? 'active' : ''}">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="products.html" class="mobile-nav-item ${window.location.pathname.includes('products') ? 'active' : ''}">
                <i class="fas fa-store"></i>
                <span>Shop</span>
            </a>
            <a href="cart.html" class="mobile-nav-item ${window.location.pathname.includes('cart') ? 'active' : ''} position-relative">
                <i class="fas fa-shopping-cart"></i>
                <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" id="mobile-cart-badge" style="display: none; width: 10px; height: 10px; margin-left: -10px; margin-top: 5px;"></span>
                <span>Cart</span>
            </a>
            <a href="javascript:void(0)" onclick="checkAuthRedirect()" class="mobile-nav-item ${window.location.pathname.includes('dashboard') ? 'active' : ''}">
                <i class="fas fa-user"></i>
                <span>Account</span>
            </a>
        </div>
        `;
        
        // After injecting, check auth and cart
        checkAuth();
        updateCartCount();
    }
}

function checkAuthRedirect() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    } else if (user.role === 'admin') {
        window.location.href = 'admin_dashboard.html';
    } else if (user.role === 'vendor') {
        window.location.href = 'vendor_dashboard.html';
    } else {
        window.location.href = 'user_dashboard.html';
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

    // Redirect logged-in users away from homepage
    const path = window.location.pathname;
    
    // Homepage redirection
    if (path === '/' || path.endsWith('index.html') || path.endsWith('/')) {
         let dashboardLink = 'user_dashboard.html';
         if (user.role === 'vendor') dashboardLink = 'vendor_dashboard.html';
         if (user.role === 'admin') dashboardLink = 'admin_dashboard.html';
         window.location.href = dashboardLink;
         return user;
    }

    // Role-based Dashboard Protection
    if (path.includes('user_dashboard.html') && user.role !== 'user') {
        if (user.role === 'admin') window.location.href = 'admin_dashboard.html';
        else if (user.role === 'vendor') window.location.href = 'vendor_dashboard.html';
        return user;
    }
    if (path.includes('vendor_dashboard.html') && user.role !== 'vendor') {
        if (user.role === 'admin') window.location.href = 'admin_dashboard.html';
        else window.location.href = 'user_dashboard.html';
        return user;
    }
    if (path.includes('admin_dashboard.html') && user.role !== 'admin') {
        if (user.role === 'vendor') window.location.href = 'vendor_dashboard.html';
        else window.location.href = 'user_dashboard.html';
        return user;
    }

    if (authButtons) {
        let dashboardLink = 'user_dashboard.html';
        let showOrders = true;

        if (user.role === 'vendor') dashboardLink = 'vendor_dashboard.html';
        if (user.role === 'admin') {
            dashboardLink = 'admin_dashboard.html';
            showOrders = false;
        }

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
                    ${showOrders ? '<li><a class="dropdown-item" href="orders.html">My Orders</a></li>' : ''}
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

function checkAuthRedirect() {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        if (userData.role === 'vendor') window.location.href = 'vendor_dashboard.html';
        else if (userData.role === 'admin') window.location.href = 'admin_dashboard.html';
        else window.location.href = 'user_dashboard.html';
    } else {
        window.location.href = 'login.html';
    }
}
