<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/geo.php';
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'vendor') { header("Location: user_dashboard.php"); exit; }
$page_title = 'Vendor Dashboard';
$uid = (int)$_SESSION['user_id'];
$isVerified = 0;
$vendorCityName = null;
$vendorStateName = null;
try {
    $stmt = $conn->prepare("SELECT is_verified, city_id, state_id FROM users WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows) {
        $row = $res->fetch_assoc();
        $isVerified = (int)($row['is_verified'] ?? 0);
        $cid = $row['city_id'] ?? null;
        $sid = $row['state_id'] ?? null;
        if ($cid) {
            $vendorCityName = geo_get_city_name($conn, (int)$cid);
        }
        if ($sid) {
            $qs = $conn->prepare("SELECT name FROM states WHERE id = ? LIMIT 1");
            $qs->bind_param("i", $sid);
            $qs->execute();
            $rs = $qs->get_result();
            if ($rs && $rs->num_rows) {
                $vendorStateName = $rs->fetch_assoc()['name'];
            }
        }
    }
} catch(Throwable $e) {}
$verStatus = 'none';
$lastSubmit = null;
try {
    $hasVV = $conn->query("SHOW TABLES LIKE 'vendor_verifications'");
    if ($hasVV && $hasVV->num_rows > 0) {
        $stmt2 = $conn->prepare("SELECT status, created_at FROM vendor_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmt2->bind_param("i", $uid);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        if ($res2 && $res2->num_rows) {
            $v = $res2->fetch_assoc();
            $verStatus = $v['status'];
            $lastSubmit = $v['created_at'];
        }
    }
} catch(Throwable $e) {}
$productCount = 0;
try {
    $hasP = $conn->query("SHOW TABLES LIKE 'products'");
    if ($hasP && $hasP->num_rows > 0) {
        $stmt3 = $conn->prepare("SELECT COUNT(*) AS c FROM products WHERE vendor_id = ?");
        $stmt3->bind_param("i", $uid);
        $stmt3->execute();
        $res3 = $stmt3->get_result();
        $productCount = $res3 ? (int)$res3->fetch_assoc()['c'] : 0;
    }
} catch(Throwable $e) {}
$ordersCount = 0;
try {
    $hasOI = $conn->query("SHOW TABLES LIKE 'order_items'");
    if ($hasOI && $hasOI->num_rows > 0) {
        $stmt4 = $conn->prepare("SELECT COUNT(DISTINCT oi.order_id) AS c FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.vendor_id = ?");
        $stmt4->bind_param("i", $uid);
        $stmt4->execute();
        $res4 = $stmt4->get_result();
        $ordersCount = $res4 ? (int)$res4->fetch_assoc()['c'] : 0;
    }
} catch(Throwable $e) {}
include __DIR__ . '/includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-1">
            <h2 class="mb-0">Vendor Dashboard</h2>
            <div>
                <?php if ($isVerified): ?>
                    <span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Verified</span>
                <?php else: ?>
                    <span class="badge bg-warning text-dark"><i class="fas fa-exclamation-circle me-1"></i> Not Verified</span>
                <?php endif; ?>
            </div>
        </div>
        <p class="text-muted small mb-4">Location: <?php echo htmlspecialchars(($vendorCityName ?: '—') . ', ' . ($vendorStateName ?: '—')); ?></p>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Verification</h5>
                        <p class="mb-2">Status: <strong class="<?php echo $verStatus === 'approved' ? 'text-success' : ($verStatus === 'submitted' ? 'text-warning' : 'text-muted'); ?>">
                            <?php echo htmlspecialchars(ucfirst($verStatus)); ?>
                        </strong></p>
                        <?php if ($lastSubmit): ?>
                            <p class="text-muted small mb-2">Last submitted: <?php echo htmlspecialchars($lastSubmit); ?></p>
                        <?php endif; ?>
                        <a href="vendor/verify.php" class="btn btn-primary">Submit/Update Verification</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Products</h5>
                        <p class="display-6 mb-1"><?php echo $productCount; ?></p>
                        <p class="text-muted">Active listings</p>
                        <a href="products.php" class="btn btn-outline-primary">Manage Listings</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Orders</h5>
                        <p class="display-6 mb-1"><?php echo $ordersCount; ?></p>
                        <p class="text-muted">Total orders across your products</p>
                        <a href="vendor/orders.php" class="btn btn-outline-primary">View Orders</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
