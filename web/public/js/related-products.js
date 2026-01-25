async function loadRelatedProducts(productId) {
    try {
        const section = document.getElementById('related-products-section');
        const container = document.getElementById('related-products-container');
        
        // Show section and render skeleton
        section.style.display = 'block';
        container.innerHTML = `
            <div class="col-6 col-md-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="skeleton skeleton-rect w-100" style="height: 150px;"></div>
                    <div class="card-body p-2">
                        <div class="skeleton skeleton-text mb-2"></div>
                        <div class="skeleton skeleton-text w-50"></div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="skeleton skeleton-rect w-100" style="height: 150px;"></div>
                    <div class="card-body p-2">
                        <div class="skeleton skeleton-text mb-2"></div>
                        <div class="skeleton skeleton-text w-50"></div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3 d-none d-md-block">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="skeleton skeleton-rect w-100" style="height: 150px;"></div>
                    <div class="card-body p-2">
                        <div class="skeleton skeleton-text mb-2"></div>
                        <div class="skeleton skeleton-text w-50"></div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-3 d-none d-md-block">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="skeleton skeleton-rect w-100" style="height: 150px;"></div>
                    <div class="card-body p-2">
                        <div class="skeleton skeleton-text mb-2"></div>
                        <div class="skeleton skeleton-text w-50"></div>
                    </div>
                </div>
            </div>
        `;

        const res = await fetch(`/api/products/${productId}/related`);
        const products = await res.json();
        
        if (products.length > 0) {
            container.innerHTML = products.map(p => `
                <div class="col-6 col-md-3">
                    <div class="card h-100 border-0 shadow-sm hover-shadow">
                        <div class="position-relative" style="cursor: pointer;" onclick="trackProductClick(${p.vendor_id}, ${p.id}); window.location.href='product_details.html?id=${p.id}'">
                            <img src="${p.image || 'https://via.placeholder.com/300'}" class="card-img-top" alt="${p.name}" style="aspect-ratio: 1/1; object-fit: cover;">
                        </div>
                        <div class="card-body p-2">
                            <h6 class="card-title text-truncate small mb-1" style="cursor: pointer;" onclick="window.location.href='product_details.html?id=${p.id}'">${p.name}</h6>
                            <p class="card-text text-primary fw-bold small">₦${Number(p.price).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            section.style.display = 'none';
        }
    } catch (err) {
        console.error('Related products error:', err);
        document.getElementById('related-products-section').style.display = 'none';
    }
}
