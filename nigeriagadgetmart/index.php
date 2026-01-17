<?php
require_once 'includes/config.php';
require_once 'includes/geo.php';
$page_title = 'Home';
$heroStateId = $_SESSION['state_id'] ?? null;
$heroCityId = $_SESSION['city_id'] ?? null;
?>

<?php include 'includes/header.php'; ?>

<!-- Hero Section -->
<section class="hero animate-on-scroll" data-anim="fade-up">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 text-start">
                <span class="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill">
                    <i class="fas fa-check-circle me-2"></i>Verified Vendors Only
                </span>
                <h1 class="display-3 fw-bold mb-4 text-white">The Trusted Marketplace for Gadgets in Nigeria</h1>
                <p class="lead mb-5 text-secondary text-light opacity-75">
                    Buy and sell authentic electronics with confidence. 
                    Escrow protection, verified merchants, and nationwide delivery.
                </p>
                <div class="d-flex gap-3">
                    <a href="products.php" class="btn btn-primary btn-lg px-4">Shop Now</a>
                    <a href="register.php?role=vendor" class="btn btn-outline-light btn-lg px-4">Become a Vendor</a>
                </div>
                
                <div class="mt-5 d-flex align-items-center gap-4 text-white opacity-75">
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-shield-alt fa-lg"></i>
                        <span>Secure Payments</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <i class="fas fa-truck fa-lg"></i>
                        <span>Fast Delivery</span>
                    </div>
                </div>
            </div>
            <div class="col-lg-5 offset-lg-1 d-none d-lg-block">
                <div class="card bg-white bg-opacity-10 border-0 p-4 backdrop-blur shadow-lg" style="backdrop-filter: blur(10px);">
                    <h4 class="text-white mb-4">Find Gadgets Near You</h4>
                    <form action="products.php" method="get" class="row g-3">
                        <div class="col-12">
                            <label class="form-label text-white small">State</label>
                            <select class="form-select border-0 py-3" name="state" required>
                                <option value="" selected disabled>Select State</option>
                                <?php
                                $hasStates = $conn->query("SHOW TABLES LIKE 'states'");
                                if ($hasStates && $hasStates->num_rows > 0) {
                                    $sql = "SELECT * FROM states ORDER BY name";
                                    $result = $conn->query($sql);
                                    while($row = $result->fetch_assoc()) {
                                        $selected = ($heroStateId && (int)$heroStateId === (int)$row['id']) ? ' selected' : '';
                                        echo "<option value='" . $row['id'] . "'" . $selected . ">" . $row['name'] . "</option>";
                                    }
                                } else {
                                    echo "<option value='' disabled>No states available</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label text-white small">City</label>
                            <select class="form-select border-0 py-3" name="city" required data-current-city="<?php echo htmlspecialchars((string)($heroCityId ?? '')); ?>">
                                <option value="" selected disabled>Select City</option>
                                <!-- Cities will be loaded via AJAX -->
                            </select>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary w-100 py-3 fw-bold">Search Marketplace</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Value Proposition -->
<section class="py-5 bg-white">
    <div class="container py-5">
        <div class="row g-4">
            <div class="col-md-4">
                <div class="feature-box text-center p-4">
                    <div class="feature-icon mx-auto bg-blue-50 text-primary rounded-circle mb-4" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #eff6ff;">
                        <i class="fas fa-check-double"></i>
                    </div>
                    <h3 class="h4 mb-3">Verified Vendors</h3>
                    <p class="text-muted">Every vendor is vetted and verified with physical address checks to ensure you only deal with legitimate businesses.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-box text-center p-4">
                    <div class="feature-icon mx-auto bg-green-50 text-success rounded-circle mb-4" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #f0fdf4;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3 class="h4 mb-3">Escrow Protection</h3>
                    <p class="text-muted">Your money is held safely until you receive and confirm your item is exactly as described.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-box text-center p-4">
                    <div class="feature-icon mx-auto bg-purple-50 text-info rounded-circle mb-4" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #f5f3ff;">
                        <i class="fas fa-shipping-fast"></i>
                    </div>
                    <h3 class="h4 mb-3">Nationwide Delivery</h3>
                    <p class="text-muted">Get your gadgets delivered anywhere in Nigeria with our trusted logistics partners.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Featured Categories -->
<section class="py-5 bg-light">
    <div class="container">
        <div class="d-flex justify-content-between align-items-end mb-5">
            <div>
                <h2 class="mb-2">Shop by Category</h2>
                <p class="text-muted mb-0">Browse our most popular electronic categories</p>
            </div>
            <a href="products.php" class="btn btn-outline-primary">View All Categories</a>
        </div>
        <div class="row g-4" data-anim="fade-up">
            <?php
            $hasCategories = $conn->query("SHOW TABLES LIKE 'categories'");
            if ($hasCategories && $hasCategories->num_rows > 0) {
                $sql = "SELECT * FROM categories ORDER BY name LIMIT 6";
                $result = $conn->query($sql);
                while($category = $result->fetch_assoc()) {
                    echo '<div class="col-md-4 col-lg-2 animate-on-scroll">';
                    echo '<a href="products.php?category=' . $category['id'] . '" class="text-decoration-none">';
                    echo '<div class="card h-100 border-0 shadow-sm text-center p-4 hover-lift">';
                    echo '<div class="mb-3 text-primary"><i class="fas fa-mobile-alt fa-2x"></i></div>';
                    echo '<h6 class="card-title text-dark mb-0">' . htmlspecialchars($category['name']) . '</h6>';
                    echo '</div>';
                    echo '</a>';
                    echo '</div>';
                }
            } else {
                echo '<div class="col-12"><div class="alert alert-info">No categories available.</div></div>';
            }
            ?>
        </div>
    </div>
</section>

<!-- Featured Products -->
<section class="py-5 animate-on-scroll">
    <div class="container">
        <div class="d-flex justify-content-between align-items-end mb-5">
            <div>
                <h2 class="mb-2">Fresh Arrivals</h2>
                <p class="text-muted mb-0">The latest gadgets from verified local vendors</p>
            </div>
            <a href="products.php" class="btn btn-primary">View All Products</a>
        </div>
        
        <div class="row g-4" data-anim="fade-up">
            <?php
            $hasProducts = $conn->query("SHOW TABLES LIKE 'products'");
            $hasVendors = $conn->query("SHOW TABLES LIKE 'vendor_profiles'");
            if ($hasProducts && $hasProducts->num_rows > 0) {
                $sql = "SELECT p.*, v.is_verified, v.city_id AS vendor_city_id, v.state_id AS vendor_state_id"
                    . ($hasVendors && $hasVendors->num_rows > 0 ? ", u.business_name" : "")
                    . " FROM products p JOIN users v ON p.vendor_id = v.id";
                if ($hasVendors && $hasVendors->num_rows > 0) {
                    $sql .= " LEFT JOIN vendor_profiles u ON p.vendor_id = u.user_id";
                }
                $sql .= " WHERE p.is_active = 1 AND p.stock_quantity > 0 ORDER BY p.created_at DESC LIMIT 8";
                $result = $conn->query($sql);
                while($product = $result->fetch_assoc()) {
                    echo '<div class="col-md-6 col-lg-3 animate-on-scroll">';
                    echo '<div class="card h-100 shadow-sm hover-tilt" data-anim="zoom-in">';
                    echo '<img src="' . htmlspecialchars($product['image1'] ?? 'images/placeholder.jpg') . '" class="card-img-top" alt="' . htmlspecialchars($product['name']) . '">';
                    echo '<div class="card-body">';
                    echo '<h5 class="card-title">' . htmlspecialchars($product['name']) . '</h5>';
                    if (isset($product['business_name'])) {
                        echo '<p class="text-muted small mb-1">' . htmlspecialchars($product['business_name']) . '</p>';
                    }
                    echo '<div class="meta mb-2">';
                    if (!empty($product['is_verified'])) {
                        echo '<span class="trust-badge"><span class="icon"><i class="fas fa-check"></i></span> Verified</span>';
                    }
                    echo '</div>';
                    echo '<p class="h5 text-primary mb-2">₦' . number_format($product['price'], 2) . '</p>';
                    $distanceInfo = '';
                    $userCityId = $_SESSION['city_id'] ?? null;
                    $vendorCityId = $product['vendor_city_id'] ?? null;
                    $userCoords = geo_get_coords_for_city($conn, $userCityId);
                    $vendorCoords = geo_get_coords_for_city($conn, $vendorCityId);
                    if ($userCoords && $vendorCoords) {
                        $km = geo_haversine_km($userCoords[0], $userCoords[1], $vendorCoords[0], $vendorCoords[1]);
                        $speed = geo_pickup_speed_label($km);
                        $distanceInfo = '<li>• Distance ~ ' . $km . ' km • ' . $speed . '</li>';
                    } else {
                        $distanceInfo = '<li>• Local delivery available</li>';
                    }
                    echo '<div class="d-flex gap-2 flex-wrap mb-3">';
                    echo $distanceInfo;
                    echo '<span class="trust-badge"><span class="icon"><i class="fas fa-undo"></i></span> Returns: 7 days</span>';
                    echo '</div>';
                    echo '<div class="d-grid">';
                    echo '<button class="btn btn-primary add-to-cart" data-product-id="' . $product['id'] . '">Add to Cart</button>';
                    echo '</div>';
                    echo '</div>';
                    echo '</div>';
                    echo '</div>';
                }
            } else {
                echo '<div class="col-12"><div class="alert alert-warning">Products table not found. <a href="setup_database.php">Run setup</a> to create required tables.</div></div>';
            }
            ?>
        </div>
    </div>
</section>

<!-- How It Works -->
<section class="py-5" data-anim="fade-up">
    <div class="container">
        <h2 class="text-center mb-5">How It Works</h2>
        <div class="row g-4">
            <div class="col-md-4 text-center" data-anim="zoom-in">
                <div class="p-4 rounded-circle bg-light d-inline-block mb-3">
                    <i class="fas fa-map-marker-alt fa-2x text-primary"></i>
                </div>
                <h4>1. Select Your Location</h4>
                <p>Choose your state and city to find gadgets available in your area.</p>
            </div>
            <div class="col-md-4 text-center" data-anim="zoom-in">
                <div class="p-4 rounded-circle bg-light d-inline-block mb-3">
                    <i class="fas fa-search fa-2x text-primary"></i>
                </div>
                <h4>2. Find Gadgets</h4>
                <p>Browse through a variety of electronics from local vendors near you.</p>
            </div>
            <div class="col-md-4 text-center" data-anim="zoom-in">
                <div class="p-4 rounded-circle bg-light d-inline-block mb-3">
                    <i class="fas fa-shipping-fast fa-2x text-primary"></i>
                </div>
                <h4>3. Fast Local Delivery</h4>
                <p>Get your items delivered quickly with lower shipping costs.</p>
            </div>
        </div>
    </div>
</section>

<!-- Vendor Registration CTA -->
<section class="py-5 bg-primary text-white">
    <div class="container text-center">
        <h2>Are you a gadget vendor?</h2>
        <p class="lead mb-4">Join our platform to reach more customers in your city and grow your business</p>
        <a href="vendor/register.php" class="btn btn-light btn-lg">Become a Vendor</a>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
