<?php
require_once 'includes/config.php';
require_once 'includes/geo.php';
$page_title = 'Vendors';
$customerCityName = null;
$customerStateName = null;
if (!empty($_SESSION['city_id'])) {
    $customerCityName = geo_get_city_name($conn, (int)$_SESSION['city_id']);
}
try {
    if (!empty($_SESSION['state_id'])) {
        $sid = (int)$_SESSION['state_id'];
        $q = $conn->prepare("SELECT name FROM states WHERE id = ? LIMIT 1");
        $q->bind_param("i", $sid);
        $q->execute();
        $r = $q->get_result();
        if ($r && $r->num_rows) $customerStateName = $r->fetch_assoc()['name'];
    }
} catch (Throwable $e) {}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-1">
            <h2 class="mb-0">Vendors</h2>
            <a href="index.php" class="btn btn-accent">Home</a>
        </div>
        <p class="text-muted small mb-4">Your location: <?php echo htmlspecialchars(($customerCityName ?: '—') . ', ' . ($customerStateName ?: '—')); ?></p>
        <div class="row g-4">
            <?php
            $hasVendors = $conn->query("SHOW TABLES LIKE 'vendor_profiles'");
            if ($hasVendors && $hasVendors->num_rows > 0) {
                $sql = "SELECT vp.*, u.is_verified, u.city_id, u.state_id FROM vendor_profiles vp LEFT JOIN users u ON vp.user_id = u.id ORDER BY vp.created_at DESC LIMIT 24";
                $result = $conn->query($sql);
                if ($result && $result->num_rows > 0) {
                    while($vendor = $result->fetch_assoc()) {
                        echo '<div class="col-md-6 col-lg-4">';
                        echo '<div class="card h-100 shadow-sm hover-lift animate-pop-in">';
                        echo '<div class="card-body">';
                        echo '<h5 class="card-title d-flex align-items-center gap-2">' . htmlspecialchars($vendor['business_name']) . '';
                        if (!empty($vendor['is_verified'])) {
                            echo ' <span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Verified</span>';
                        }
                        echo '</h5>';
                        if (!empty($vendor['business_address'])) {
                            echo '<p class="text-muted small mb-2"><i class="fas fa-store me-1"></i> Physical shop</p>';
                        }
                        if (isset($vendor['business_description'])) {
                            echo '<p class="mb-2">' . htmlspecialchars($vendor['business_description']) . '</p>';
                        }
                        echo '<ul class="list-unstyled small text-muted mb-0">';
                        if (!empty($vendor['city_id'])) {
                            $vCity = geo_get_city_name($conn, (int)$vendor['city_id']);
                            $vState = null;
                            if (!empty($vendor['state_id'])) {
                                $sid = (int)$vendor['state_id'];
                                $qs = $conn->prepare("SELECT name FROM states WHERE id = ? LIMIT 1");
                                $qs->bind_param("i", $sid);
                                $qs->execute();
                                $rs = $qs->get_result();
                                if ($rs && $rs->num_rows) $vState = $rs->fetch_assoc()['name'];
                            }
                            echo '<li>• Location: ' . htmlspecialchars(($vCity ?: '—') . ', ' . ($vState ?: '—')) . '</li>';
                        }
                        echo '<li>• Returns: 7 days</li>';
                        echo '</ul>';
                        echo '</div>';
                        echo '</div>';
                        echo '</div>';
                    }
                } else {
                    echo '<div class="col-12"><div class="alert alert-info">No vendors found.</div></div>';
                }
            } else {
                echo '<div class="col-12"><div class="alert alert-warning">Vendor profiles table not found. <a href="setup_database.php">Run setup</a> to create required tables.</div></div>';
            }
            ?>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
