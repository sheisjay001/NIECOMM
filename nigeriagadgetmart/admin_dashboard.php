<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
require_once 'includes/geo.php';
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'admin') {
    header("Location: user_dashboard.php");
    exit;
}
$page_title = 'Admin Dashboard';
$actionMessage = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_verify()) {
    $type = $_POST['type'] ?? '';
    if ($type === 'verify_vendor') {
        $vid = intval($_POST['verification_id'] ?? 0);
        $decision = $_POST['decision'] ?? '';
        if ($vid > 0 && ($decision === 'approve' || $decision === 'reject')) {
            $stmt = $conn->prepare("SELECT user_id FROM vendor_verifications WHERE id = ? LIMIT 1");
            $stmt->bind_param("i", $vid);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res && $res->num_rows) {
                $userId = intval($res->fetch_assoc()['user_id']);
                $newStatus = $decision === 'approve' ? 'approved' : 'rejected';
                $u = $conn->prepare("UPDATE vendor_verifications SET status = ? WHERE id = ?");
                $u->bind_param("si", $newStatus, $vid);
                $u->execute();
                $v = $conn->prepare("UPDATE users SET is_verified = ? WHERE id = ?");
                $flag = $decision === 'approve' ? 1 : 0;
                $v->bind_param("ii", $flag, $userId);
                $v->execute();
                $actionMessage = $decision === 'approve' ? 'Vendor approved.' : 'Vendor rejected.';
            }
        }
    } elseif ($type === 'order_action') {
        $oid = intval($_POST['order_id'] ?? 0);
        $op = $_POST['op'] ?? '';
        if ($oid > 0 && in_array($op, ['release','refund','delivered'], true)) {
            if ($op === 'release') {
                $stmt = $conn->prepare("UPDATE orders SET payment_status = 'released', status = 'completed' WHERE id = ?");
                $stmt->bind_param("i", $oid);
                $stmt->execute();
                $actionMessage = 'Funds released.';
            } elseif ($op === 'refund') {
                $stmt = $conn->prepare("UPDATE orders SET payment_status = 'refunded', status = 'refunded' WHERE id = ?");
                $stmt->bind_param("i", $oid);
                $stmt->execute();
                $actionMessage = 'Order refunded.';
            } elseif ($op === 'delivered') {
                $stmt = $conn->prepare("UPDATE orders SET status = 'delivered' WHERE id = ?");
                $stmt->bind_param("i", $oid);
                $stmt->execute();
                $actionMessage = 'Order marked delivered.';
            }
        }
    }
}
$stats = [
    'users' => 0,
    'vendors' => 0,
    'products' => 0,
    'orders' => 0
];
try {
    $resU = $conn->query("SELECT COUNT(*) AS c FROM users");
    $stats['users'] = $resU ? intval($resU->fetch_assoc()['c']) : 0;
    $resV = $conn->query("SELECT COUNT(*) AS c FROM vendor_profiles");
    $stats['vendors'] = $resV ? intval($resV->fetch_assoc()['c']) : 0;
    $resP = $conn->query("SELECT COUNT(*) AS c FROM products");
    $stats['products'] = $resP ? intval($resP->fetch_assoc()['c']) : 0;
    $resO = $conn->query("SELECT COUNT(*) AS c FROM orders");
    $stats['orders'] = $resO ? intval($resO->fetch_assoc()['c']) : 0;
} catch (Throwable $e) {}
$adminCityName = null;
$adminStateName = null;
if (!empty($_SESSION['city_id'])) {
    $adminCityName = geo_get_city_name($conn, (int)$_SESSION['city_id']);
}
try {
    if (!empty($_SESSION['state_id'])) {
        $sid = (int)$_SESSION['state_id'];
        $q = $conn->prepare("SELECT name FROM states WHERE id = ? LIMIT 1");
        $q->bind_param("i", $sid);
        $q->execute();
        $r = $q->get_result();
        if ($r && $r->num_rows) $adminStateName = $r->fetch_assoc()['name'];
    }
} catch (Throwable $e) {}
$pendingVerifications = [];
try {
    $hasVV = $conn->query("SHOW TABLES LIKE 'vendor_verifications'");
    if ($hasVV && $hasVV->num_rows > 0) {
        $sql = "SELECT vv.id, vv.user_id, vv.cac_photo, vv.shop_photo, vv.goods_photo, vv.created_at, u.username, u.email FROM vendor_verifications vv JOIN users u ON vv.user_id = u.id WHERE vv.status = 'submitted' ORDER BY vv.created_at DESC LIMIT 20";
        $result = $conn->query($sql);
        while ($row = $result->fetch_assoc()) { $pendingVerifications[] = $row; }
    }
} catch (Throwable $e) {}
$recentOrders = [];
try {
    $hasO = $conn->query("SHOW TABLES LIKE 'orders'");
    if ($hasO && $hasO->num_rows > 0) {
        $sql = "SELECT id, order_number, customer_id, total_amount, status, payment_status, created_at FROM orders ORDER BY id DESC LIMIT 10";
        $result = $conn->query($sql);
        while ($row = $result->fetch_assoc()) { $recentOrders[] = $row; }
    }
} catch (Throwable $e) {}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-1">Admin Control Panel</h2>
        <p class="text-muted small mb-3">Location: <?php echo htmlspecialchars(($adminCityName ?: '—') . ', ' . ($adminStateName ?: '—')); ?></p>
        <?php if ($actionMessage): ?><div class="alert alert-info"><?php echo htmlspecialchars($actionMessage); ?></div><?php endif; ?>
        <div class="row g-3 mt-2">
            <div class="col-md-3">
                <div class="card shadow-sm h-100"><div class="card-body"><h5 class="card-title">Users</h5><p class="display-6"><?php echo $stats['users']; ?></p><p class="text-muted">Registered accounts</p></div></div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm h-100"><div class="card-body"><h5 class="card-title">Vendors</h5><p class="display-6"><?php echo $stats['vendors']; ?></p><p class="text-muted">Approved vendor profiles</p></div></div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm h-100"><div class="card-body"><h5 class="card-title">Products</h5><p class="display-6"><?php echo $stats['products']; ?></p><p class="text-muted">Active listings</p></div></div>
            </div>
            <div class="col-md-3">
                <div class="card shadow-sm h-100"><div class="card-body"><h5 class="card-title">Orders</h5><p class="display-6"><?php echo $stats['orders']; ?></p><p class="text-muted">Total orders</p></div></div>
            </div>
        </div>
        <div class="mt-4 d-flex gap-2">
            <a class="btn btn-primary" href="products.php">Manage Products</a>
            <a class="btn btn-outline-primary" href="vendors.php">View Vendors</a>
            <a class="btn btn-outline-secondary" href="orders.php">Manage Orders</a>
            <a class="btn btn-outline-secondary" href="admin_messages.php">View Messages</a>
        </div>
        <div class="mt-5">
            <h4 class="mb-3">Pending Vendor Verifications</h4>
            <?php if (empty($pendingVerifications)): ?>
                <div class="alert alert-success">No pending verifications.</div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>Vendor</th><th>Email</th><th>Uploads</th><th>Submitted</th><th>Action</th></tr></thead>
                        <tbody>
                            <?php foreach ($pendingVerifications as $v): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($v['username']); ?></td>
                                <td><?php echo htmlspecialchars($v['email']); ?></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <?php if ($v['cac_photo']): ?><a href="<?php echo htmlspecialchars($v['cac_photo']); ?>" target="_blank" class="btn btn-sm btn-outline-secondary">CAC</a><?php endif; ?>
                                        <?php if ($v['shop_photo']): ?><a href="<?php echo htmlspecialchars($v['shop_photo']); ?>" target="_blank" class="btn btn-sm btn-outline-secondary">Shop</a><?php endif; ?>
                                        <?php if ($v['goods_photo']): ?><a href="<?php echo htmlspecialchars($v['goods_photo']); ?>" target="_blank" class="btn btn-sm btn-outline-secondary">Goods</a><?php endif; ?>
                                    </div>
                                </td>
                                <td><?php echo htmlspecialchars($v['created_at']); ?></td>
                                <td>
                                    <form method="post" class="d-inline">
                                        <?php csrf_input(); ?>
                                        <input type="hidden" name="type" value="verify_vendor">
                                        <input type="hidden" name="verification_id" value="<?php echo (int)$v['id']; ?>">
                                        <input type="hidden" name="decision" value="approve">
                                        <button class="btn btn-sm btn-success" type="submit">Approve</button>
                                    </form>
                                    <form method="post" class="d-inline ms-2">
                                        <?php csrf_input(); ?>
                                        <input type="hidden" name="type" value="verify_vendor">
                                        <input type="hidden" name="verification_id" value="<?php echo (int)$v['id']; ?>">
                                        <input type="hidden" name="decision" value="reject">
                                        <button class="btn btn-sm btn-danger" type="submit">Reject</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
        <div class="mt-5">
            <h4 class="mb-3">Recent Orders</h4>
            <?php if (empty($recentOrders)): ?>
                <div class="alert alert-info">No orders found.</div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
                        <tbody>
                            <?php foreach ($recentOrders as $o): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($o['order_number']); ?></td>
                                <td>₦<?php echo number_format((float)$o['total_amount'], 2); ?></td>
                                <td><span class="badge bg-secondary"><?php echo htmlspecialchars($o['status']); ?></span></td>
                                <td><span class="badge bg-info text-dark"><?php echo htmlspecialchars($o['payment_status']); ?></span></td>
                                <td><?php echo htmlspecialchars($o['created_at']); ?></td>
                                <td>
                                    <form method="post" class="d-inline">
                                        <?php csrf_input(); ?>
                                        <input type="hidden" name="type" value="order_action">
                                        <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                        <input type="hidden" name="op" value="delivered">
                                        <button class="btn btn-sm btn-outline-secondary" type="submit">Mark Delivered</button>
                                    </form>
                                    <form method="post" class="d-inline ms-2">
                                        <?php csrf_input(); ?>
                                        <input type="hidden" name="type" value="order_action">
                                        <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                        <input type="hidden" name="op" value="release">
                                        <button class="btn btn-sm btn-success" type="submit">Release Funds</button>
                                    </form>
                                    <form method="post" class="d-inline ms-2">
                                        <?php csrf_input(); ?>
                                        <input type="hidden" name="type" value="order_action">
                                        <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                        <input type="hidden" name="op" value="refund">
                                        <button class="btn btn-sm btn-danger" type="submit">Refund</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
