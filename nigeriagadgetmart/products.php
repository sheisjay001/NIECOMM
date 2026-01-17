<?php
require_once 'includes/config.php';
require_once 'includes/geo.php';
$page_title = 'Products';
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">Products</h2>
            <a href="index.php" class="btn btn-accent">Home</a>
        </div>
        <div class="row g-4">
            <?php
            $hasProducts = $conn->query("SHOW TABLES LIKE 'products'");
            $hasVendors = $conn->query("SHOW TABLES LIKE 'vendor_profiles'");
            if ($hasProducts && $hasProducts->num_rows > 0) {
                $categoryFilter = isset($_GET['category']) ? (int)$_GET['category'] : null;
                $stateFilter = isset($_GET['state']) ? (int)$_GET['state'] : 0;
                $cityFilter = isset($_GET['city']) ? (int)$_GET['city'] : 0;
                $q = trim($_GET['q'] ?? '');
                $page = max(1, intval($_GET['page'] ?? 1));
                $perPage = 12;
                $offset = ($page - 1) * $perPage;
                $sql = "SELECT p.*, v.is_verified, v.city_id AS vendor_city_id, v.state_id AS vendor_state_id"
                    . ($hasVendors && $hasVendors->num_rows > 0 ? ", u.business_name" : "")
                    . " FROM products p JOIN users v ON p.vendor_id = v.id";
                if ($hasVendors && $hasVendors->num_rows > 0) {
                    $sql .= " LEFT JOIN vendor_profiles u ON p.vendor_id = u.user_id";
                }
                $sql .= " WHERE p.is_active = 1 AND p.stock_quantity > 0";
                if ($categoryFilter) $sql .= " AND p.category_id = " . $categoryFilter;
                if ($cityFilter) {
                    $sql .= " AND v.city_id = " . $cityFilter;
                } elseif ($stateFilter) {
                    $sql .= " AND v.state_id = " . $stateFilter;
                }
                if ($q !== '') {
                    $qSafe = $conn->real_escape_string($q);
                    $sql .= " AND (p.name LIKE '%$qSafe%' OR p.description LIKE '%$qSafe%')";
                }
                $sql .= " ORDER BY p.created_at DESC LIMIT $perPage OFFSET $offset";
                $result = $conn->query($sql);
                if ($result && $result->num_rows > 0) {
                    while($product = $result->fetch_assoc()) {
                        echo '<div class="col-md-6 col-lg-3" data-anim="fade-up">';
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
                        $userCityId = $_SESSION['city_id'] ?? null;
                        $vendorCityId = $product['vendor_city_id'] ?? null;
                        $userCoords = geo_get_coords_for_city($conn, $userCityId);
                        $vendorCoords = geo_get_coords_for_city($conn, $vendorCityId);
                        $distanceInfo = '';
                        if ($userCoords && $vendorCoords) {
                            $km = geo_haversine_km($userCoords[0], $userCoords[1], $vendorCoords[0], $vendorCoords[1]);
                            $speed = geo_pickup_speed_label($km);
                            $distanceInfo = '<span class="trust-badge"><span class="icon"><i class="fas fa-location-arrow"></i></span> ~ ' . $km . ' km • ' . $speed . '</span>';
                        } else {
                            $distanceInfo = '<span class="trust-badge"><span class="icon"><i class="fas fa-truck"></i></span> Local delivery available</span>';
                        }
                        echo '<div class="d-flex gap-2 flex-wrap mb-3">';
                        echo $distanceInfo;
                        echo '<span class="trust-badge"><span class="icon"><i class="fas fa-undo"></i></span> Returns: 7 days</span>';
                        echo '</div>';
                        echo '<div class="d-grid">';
                        echo '<button class="btn btn-primary add-to-cart" data-product-id="' . $product['id'] . '">Add to Cart</button>';
                        echo '<a class="btn btn-outline-secondary mt-2" href="messages.php?user=' . (int)$product['vendor_id'] . '&product=' . (int)$product['id'] . '"><i class="fas fa-comments me-1"></i> Message Vendor</a>';
                        echo '</div>';
                        echo '</div>';
                        echo '</div>';
                        echo '</div>';
                    }
                    echo '<div class="col-12 d-flex justify-content-center mt-3">';
                    $prevLink = $page > 1 ? ('?page='.($page-1).($categoryFilter?'&category='.$categoryFilter:'').($stateFilter?'&state='.$stateFilter:'').($cityFilter?'&city='.$cityFilter:'').($q!==''?'&q='.urlencode($q):'')) : null;
                    $nextLink = ($result->num_rows === $perPage) ? ('?page='.($page+1).($categoryFilter?'&category='.$categoryFilter:'').($stateFilter?'&state='.$stateFilter:'').($cityFilter?'&city='.$cityFilter:'').($q!==''?'&q='.urlencode($q):'')) : null;
                    if ($prevLink) echo '<a class="btn btn-outline-primary me-2" href="'.$prevLink.'">Previous</a>';
                    if ($nextLink) echo '<a class="btn btn-outline-primary" href="'.$nextLink.'">Next</a>';
                    echo '</div>';
                } else {
                    echo '<div class="col-12"><div class="alert alert-info">No products available.</div></div>';
                }
            } else {
                echo '<div class="col-12"><div class="alert alert-warning">Products table not found. <a href="setup_database.php">Run setup</a> to create required tables.</div></div>';
            }
            ?>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
