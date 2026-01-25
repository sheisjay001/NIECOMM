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

// Wishlist Logic
async function toggleWishlist(btn, productId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showToast('Please login to save items', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const icon = btn.querySelector('i');
    const isActive = icon.classList.contains('fas'); // Solid heart means in wishlist

    try {
        if (isActive) {
            const wRes = await fetch(`/api/wishlist?user_id=${user.id}`);
            const wItems = await wRes.json();
            const wishlistItem = wItems.find(i => i.id === productId);
            if (wishlistItem) {
                await fetch(`/api/wishlist/${wishlistItem.wishlist_id}?user_id=${user.id}`, { method: 'DELETE' });
                icon.classList.replace('fas', 'far');
                icon.classList.remove('text-danger');
                showToast('Removed from wishlist');
            }
        } else {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, product_id: productId })
            });
            if (res.ok) {
                icon.classList.replace('far', 'fas');
                icon.classList.add('text-danger');
                showToast('Added to wishlist');
            } else {
                const data = await res.json();
                if(data.error && data.error.includes('Duplicate')) {
                     showToast('Already in wishlist', 'info');
                     icon.classList.replace('far', 'fas');
                     icon.classList.add('text-danger');
                } else {
                    showToast('Failed to add to wishlist', 'error');
                }
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating wishlist', 'error');
    }
}

// Helper to check wishlist status on page load (to be called by pages)
async function updateWishlistIcons() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const res = await fetch(`/api/wishlist?user_id=${user.id}`);
        const items = await res.json();
        const ids = new Set(items.map(i => i.id)); // Product IDs
        
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const pid = parseInt(btn.dataset.productId);
            if (ids.has(pid)) {
                const icon = btn.querySelector('i');
                icon.classList.replace('far', 'fas');
                icon.classList.add('text-danger');
            }
        });
    } catch (e) { console.error(e); }
}

// --- Comparison Feature ---
function toggleCompare(id) {
    let compareList = JSON.parse(localStorage.getItem('compareList')) || [];
    const index = compareList.indexOf(id);
    
    if (index > -1) {
        compareList.splice(index, 1);
        showToast('Removed from comparison');
    } else {
        if (compareList.length >= 3) {
            showToast('You can only compare up to 3 products.', 'warning');
            // Uncheck any checkboxes if present
            const checkbox = document.querySelector(`.compare-check[data-id="${id}"]`);
            if(checkbox) checkbox.checked = false;
            return;
        }
        compareList.push(id);
        showToast('Added to comparison');
    }
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareUI();
}

function updateCompareUI() {
    const compareList = JSON.parse(localStorage.getItem('compareList')) || [];
    const countSpan = document.getElementById('compare-count');
    const bar = document.getElementById('compare-bar');
    
    if (countSpan) countSpan.textContent = compareList.length;
    
    if (bar) {
        if (compareList.length > 0) {
            bar.classList.remove('d-none');
        } else {
            bar.classList.add('d-none');
        }
    }

    // Update checkboxes or buttons if they exist
    document.querySelectorAll('.compare-check').forEach(chk => {
        const id = parseInt(chk.dataset.id);
        chk.checked = compareList.includes(id);
    });
    
    // Update buttons in product details
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        // Assuming compareBtn has a data-id or we know the context
        // This part might be tricky if not generic, but let's assume standard usage
        // Or we just check logic in the page specific script.
        // Better:
    }
}

function clearCompare() {
    localStorage.removeItem('compareList');
    updateCompareUI();
}
// -------------------------

function loadNav() {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const themeIcon = currentTheme === 'dark' ? 'fas fa-sun fa-lg' : 'fas fa-moon fa-lg';

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
                    <button class="btn btn-link text-secondary p-0 border-0" onclick="toggleTheme()" id="theme-toggle" title="Toggle Dark Mode">
                        <i class="${themeIcon} theme-icon-active"></i>
                    </button>
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
        `;
        
        // After injecting, check auth and cart
        checkAuth();
        syncCart(); // New sync call
        updateCartCount();
        updateCompareUI(); // Update compare UI on nav load
    }
}

// Cart Synchronization
async function syncCart() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        // Fetch server cart
        const res = await fetch(`/api/cart/${user.id}`);
        const serverCart = await res.json();
        let localCart = JSON.parse(localStorage.getItem('cart') || '[]');

        if (localCart.length === 0 && serverCart.length > 0) {
            // Restore from server
            localStorage.setItem('cart', JSON.stringify(serverCart));
            updateCartCount();
            // showToast('Cart restored from server', 'info'); // Optional: notify user
        } else if (localCart.length > 0) {
            // Push local to server (Sync)
            await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, items: localCart })
            });
        }
    } catch (e) {
        console.error('Cart sync failed:', e);
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
                <button class="btn btn-link text-dark text-decoration-none dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="https://ui-avatars.com/api/?name=${user.username}&background=random" class="rounded-circle me-1" width="32" height="32">
                    <span class="d-none d-lg-inline">${user.username}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                    <li><h6 class="dropdown-header">Hello, ${user.username}</h6></li>
                    <li><a class="dropdown-item" href="${dashboardLink}"><i class="fas fa-tachometer-alt me-2 text-primary"></i>Dashboard</a></li>
                    ${showOrders ? `<li><a class="dropdown-item" href="${dashboardLink}#orders"><i class="fas fa-box me-2 text-info"></i>My Orders</a></li>` : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Log Out</a></li>
                </ul>
            </div>
        `;
    }
    return user;
}

function logout(msg) {
    localStorage.removeItem('user');
    // Don't clear cart on logout for now, or maybe we should?
    // localStorage.removeItem('cart'); 
    
    if (msg) showToast(msg, 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Global Toast Notification
function showToast(message, type = 'success') {
    // Create toast container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Icons mapping
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    const icon = icons[type] || icons.info;

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : (type === 'warning' ? 'warning' : 'success')} border-0 shadow-lg`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
                <i class="${icon} fa-lg"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Limit to 5 toasts
    if (toastContainer.childElementCount >= 5) {
        toastContainer.firstChild.remove();
    }

    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Shopping Cart Logic
function addToCart(productId, quantity = 1) {
    // Basic animation
    const badge = document.getElementById('cart-count-badge');
    if(badge) {
        badge.classList.remove('badge-pulse');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('badge-pulse');
        setTimeout(() => badge.classList.remove('badge-pulse'), 2000);
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += parseInt(quantity);
    } else {
        cart.push({ id: productId, quantity: parseInt(quantity) });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    syncCart(); // Sync after adding
    showToast('Product added to cart');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    const badges = [
        document.getElementById('cart-count-badge'),
        document.getElementById('mobile-cart-badge')
    ];

    badges.forEach(badge => {
        if (badge) {
            badge.textContent = count;
            if(count > 0) badge.style.display = 'block';
            else badge.style.display = 'none';
        }
    });
}

// Helper: Get User Location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                // Reload products if on products page
                if (typeof loadProducts === 'function') {
                   // loadProducts(); // Optional: Auto-reload
                }
            },
            (error) => {
                console.log('Geolocation denied or failed');
            }
        );
    }
}

// Load States Helper
async function loadStates() {
    const select = document.getElementById('state-filter');
    if (!select) return;

    try {
        const res = await fetch('/api/states');
        const states = await res.json();
        
        select.innerHTML = '<option value="">All States</option>';
        states.forEach(state => {
            select.innerHTML += `<option value="${state.id}">${state.name}</option>`;
        });
        
        // Setup cascading dropdowns
        const lgaSelect = document.getElementById('lga-filter');
        const citySelect = document.getElementById('city-filter');

        select.addEventListener('change', async () => {
             const stateId = select.value;
             if(stateId) {
                 // Load LGAs
                 const lRes = await fetch(`/api/states/${stateId}/lgas`);
                 const lgas = await lRes.json();
                 lgaSelect.innerHTML = '<option value="">All LGAs</option>' + lgas.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
                 lgaSelect.disabled = false;

                 // Load Cities
                 const cRes = await fetch(`/api/states/${stateId}/cities`);
                 const cities = await cRes.json();
                 citySelect.innerHTML = '<option value="">All Cities</option>' + cities.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                 citySelect.disabled = false;
             } else {
                 lgaSelect.innerHTML = '<option value="">All LGAs</option>';
                 lgaSelect.disabled = true;
                 citySelect.innerHTML = '<option value="">All Cities</option>';
                 citySelect.disabled = true;
             }
        });

    } catch (err) {
        console.error(err);
    }
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
    const icons = document.querySelectorAll('.theme-icon-active');
    icons.forEach(icon => {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
    
    // Legacy support for ID specific
    const navIcon = document.querySelector('#theme-toggle i');
    if (navIcon && !navIcon.classList.contains('theme-icon-active')) {
        navIcon.className = theme === 'dark' ? 'fas fa-sun fa-lg' : 'fas fa-moon fa-lg';
    }
}

// Apply Theme on Load
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
// We need to wait for DOM to update icons if called immediately, but scripts usually run after DOM parsing if at bottom.
// However, main.js might be included in head.
// Let's add a listener
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcons(savedTheme);
});
