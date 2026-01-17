// Main JavaScript for NIECOMM

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
        });
    });

    // Mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', () => {
            navbarCollapse.classList.toggle('show');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    const elements = document.querySelectorAll('.animate-on-scroll, [data-anim]');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const type = el.getAttribute('data-anim');
                    if (type) el.classList.add('anim-' + type);
                    el.classList.add('in-view');
                    io.unobserve(el);
                }
            });
        }, { rootMargin: '0px 0px -20% 0px' });
        elements.forEach(el => io.observe(el));
    } else {
        const animateFallback = () => {
            elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.8) {
                    element.classList.add('in-view');
                }
            });
        };
        window.addEventListener('scroll', animateFallback);
        animateFallback();
    }
});

// Theme toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('theme-toggle');
    const body = document.body;
    const saved = localStorage.getItem('theme');
    if (saved) {
        body.setAttribute('data-theme', saved);
        const icon = toggle ? toggle.querySelector('i') : null;
        if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (toggle) {
        toggle.addEventListener('click', function() {
            const current = body.getAttribute('data-theme') || 'light';
            const next = current === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            const icon = toggle.querySelector('i');
            if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.querySelector('.cart-count');
    if (cartBadge) {
        cartBadge.textContent = cartCount;
    }
}

function addToCart(productId, quantity = 1) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            quantity: quantity
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    
    // Show success message
    showToast('Item added to cart!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Item removed from cart', 'info');
}

// Toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 150);
    }, 3000);
}

// Load cities via AJAX when state changes
document.addEventListener('DOMContentLoaded', function() {
    const stateSelect = document.querySelector('select[name="state"]');
    const citySelect = document.querySelector('select[name="city"]');
    
    if (stateSelect && citySelect) {
        const loadCities = (stateId) => {
            if (!stateId) {
                citySelect.innerHTML = '<option value="" selected disabled>Select City</option>';
                return;
            }
            citySelect.disabled = true;
            citySelect.innerHTML = '<option value="">Loading cities...</option>';
            const params = new URLSearchParams();
            params.set('state_id', stateId);
            params.set('_', Date.now().toString());
            fetch('ajax/get_cities.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache'
                },
                body: params.toString()
            })
            .then(r => {
                if (!r.ok) throw new Error('Bad response');
                return r.json();
            })
            .then(data => {
                citySelect.innerHTML = '<option value="" selected disabled>Select City</option>';
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.id;
                        option.textContent = city.name;
                        citySelect.appendChild(option);
                    });
                    const currentCity = citySelect.getAttribute('data-current-city');
                    if (currentCity) {
                        const toSelect = citySelect.querySelector(`option[value="${currentCity}"]`);
                        if (toSelect) toSelect.selected = true;
                    }
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No cities found for selected state';
                    citySelect.appendChild(option);
                }
                citySelect.disabled = false;
            })
            .catch(() => {
                citySelect.disabled = false;
                citySelect.innerHTML = '<option value="">Error loading cities</option>';
            });
        };
        stateSelect.addEventListener('change', function() {
            const stateId = this.value;
            try {
                const onboardingData = JSON.parse(localStorage.getItem('onboarding') || '{}');
                onboardingData.state_id = stateId || null;
                const opt = this.options[this.selectedIndex];
                onboardingData.state_name = opt ? opt.text : null;
                localStorage.setItem('onboarding', JSON.stringify(onboardingData));
            } catch (e) {}
            
            loadCities(stateId);
        });
        if (stateSelect.value) {
            loadCities(stateSelect.value);
        }
        citySelect.addEventListener('change', function() {
            try {
                const onboardingData = JSON.parse(localStorage.getItem('onboarding') || '{}');
                onboardingData.city_id = this.value || null;
                const opt = this.options[this.selectedIndex];
                onboardingData.city_name = opt ? opt.text : null;
                localStorage.setItem('onboarding', JSON.stringify(onboardingData));
            } catch (e) {}
        });
    }
});

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-info">Your cart is empty.</div></div>';
        return;
    }
    cart.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        col.innerHTML = `
            <div class="card h-100 shadow-sm hover-lift animate-pop-in">
                <div class="card-body">
                    <h5 class="card-title">Product #${item.id}</h5>
                    <p class="text-muted">Quantity: ${item.quantity}</p>
                    <div class="d-grid">
                        <button class="btn btn-danger remove-item" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
    container.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            removeFromCart(id);
            const parent = this.closest('.col-md-6');
            updateCartCount();
            if (container) location.reload();
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const onb = document.getElementById('onboarding');
    if (!onb) return;
    let step = 1;
    const total = 5;
    const progress = onb.querySelector('.onb-progress-bar');
    const steps = onb.querySelectorAll('.onb-step');
    const confetti = document.getElementById('onb-confetti');
    const ctx = confetti ? confetti.getContext('2d') : null;
    const data = JSON.parse(localStorage.getItem('onboarding') || '{}');
    const showStep = (n) => {
        steps.forEach(s => s.classList.add('d-none'));
        const current = onb.querySelector('.onb-step[data-step="'+n+'"]');
        if (current) current.classList.remove('d-none');
        const pct = Math.round(((n-1)/ (total-1)) * 100);
        if (progress) progress.style.width = pct + '%';
    };
    const next = () => {
        step = Math.min(step + 1, total);
        if (step === total) {
            const cityOut = document.getElementById('onb-city-out');
            if (cityOut && data.city_name) cityOut.textContent = data.city_name;
            runConfetti();
            localStorage.setItem('onboardingComplete', '1');
        }
        showStep(step);
    };
    const prev = () => {
        step = Math.max(step - 1, 1);
        showStep(step);
    };
    onb.addEventListener('click', function(e) {
        const t = e.target;
        if (t.classList.contains('onb-next')) next();
        if (t.classList.contains('onb-prev')) prev();
        if (t.classList.contains('onb-choice')) {
            const name = t.getAttribute('data-name');
            const value = t.getAttribute('data-value');
            data[name] = value;
            localStorage.setItem('onboarding', JSON.stringify(data));
        }
    });
    const nameInput = document.getElementById('onb-name');
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            data.name = this.value;
            localStorage.setItem('onboarding', JSON.stringify(data));
        });
    }
    const useLocBtn = document.getElementById('onb-use-location');
    if (useLocBtn && navigator.geolocation) {
        useLocBtn.addEventListener('click', function() {
            navigator.geolocation.getCurrentPosition(function(pos) {
                data.use_location = true;
                data.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                localStorage.setItem('onboarding', JSON.stringify(data));
                showToast('Location captured', 'success');
            }, function() {
                showToast('Unable to access location', 'warning');
            }, { enableHighAccuracy: true, timeout: 8000 });
        });
    }
    const runConfetti = () => {
        if (!ctx || !confetti) return;
        confetti.classList.remove('d-none');
        const particles = Array.from({length: 60}).map(() => ({
            x: Math.random()*confetti.width,
            y: -Math.random()*50,
            r: 2 + Math.random()*3,
            c: ['#10b981','#f59e0b','#ef4444','#3b82f6'][Math.floor(Math.random()*4)],
            vy: 2 + Math.random()*3,
            vx: -1 + Math.random()*2
        }));
        let frames = 0;
        const draw = () => {
            ctx.clearRect(0,0,confetti.width,confetti.height);
            particles.forEach(p => {
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
                ctx.fill();
                p.y += p.vy;
                p.x += p.vx;
            });
            frames++;
            if (frames < 120) requestAnimationFrame(draw);
            else confetti.classList.add('d-none');
        };
        requestAnimationFrame(draw);
        setTimeout(() => { window.location.href = 'index.php'; }, 1500);
    };
    showStep(step);
});
