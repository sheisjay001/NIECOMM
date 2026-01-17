<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/geo.php';
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role === 'vendor') { header("Location: vendor_dashboard.php"); exit; }
if ($role === 'admin') { header("Location: admin_dashboard.php"); exit; }
$page_title = 'My Dashboard';
$uid = (int)$_SESSION['user_id'];
$orders = [];
$orderCount = 0;
$hasOrders = $conn->query("SHOW TABLES LIKE 'orders'");
if ($hasOrders && $hasOrders->num_rows > 0) {
    try {
        $stmt = $conn->prepare("SELECT id, order_number, total_amount, status, payment_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 10");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) { $orders[] = $row; }
        $cntRes = $conn->prepare("SELECT COUNT(*) AS c FROM orders WHERE customer_id = ?");
        $cntRes->bind_param("i", $uid);
        $cntRes->execute();
        $orderCount = (int)$cntRes->get_result()->fetch_assoc()['c'];
    } catch (Throwable $e) {}
}
$cityName = null;
if (!empty($_SESSION['city_id'])) { $cityName = geo_get_city_name($conn, (int)$_SESSION['city_id']); }
$stateName = null;
try {
    if (!empty($_SESSION['state_id'])) {
        $sid = (int)$_SESSION['state_id'];
        $q = $conn->prepare("SELECT name FROM states WHERE id = ? LIMIT 1");
        $q->bind_param("i", $sid);
        $q->execute();
        $r = $q->get_result();
        if ($r && $r->num_rows) $stateName = $r->fetch_assoc()['name'];
    }
} catch (Throwable $e) {}
include __DIR__ . '/includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">My Dashboard</h2>
            <a href="products.php" class="btn btn-outline-primary">Browse Products</a>
        </div>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Account</h5>
                        <p class="mb-1"><strong><?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?></strong></p>
                        <p class="text-muted mb-2"><?php echo htmlspecialchars($_SESSION['email'] ?? ''); ?></p>
                        <p class="text-muted small mb-3">Location: <?php echo htmlspecialchars(($cityName ?: '—') . ', ' . ($stateName ?: '—')); ?></p>
                        <a href="user_profile.php" class="btn btn-outline-primary">Edit Profile</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Orders</h5>
                        <p class="display-6 mb-1"><?php echo $orderCount; ?></p>
                        <p class="text-muted">Total orders placed</p>
                        <a href="orders.php" class="btn btn-outline-primary">View Orders</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">Escrow Status</h5>
                        <p class="text-muted">Funds are held for 3 days to allow returns, then released after delivery confirmation.</p>
                        <a href="checkout.php" class="btn btn-primary">Make a Purchase</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-5">
            <h4 class="mb-3">Recent Orders</h4>
            <?php if (empty($orders)): ?>
                <div class="alert alert-info">No recent orders found.</div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Order Number</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($orders as $o): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($o['order_number']); ?></td>
                                <td>₦<?php echo number_format((float)$o['total_amount'], 2); ?></td>
                                <td><span class="badge bg-secondary"><?php echo htmlspecialchars($o['status']); ?></span></td>
                                <td><span class="badge bg-info text-dark"><?php echo htmlspecialchars($o['payment_status']); ?></span></td>
                                <td><?php echo htmlspecialchars($o['created_at']); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
