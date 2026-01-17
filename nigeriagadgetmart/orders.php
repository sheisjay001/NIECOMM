<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/csrf.php';
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role === 'vendor') { header("Location: vendor/orders.php"); exit; }
$page_title = 'Orders';
$uid = (int)$_SESSION['user_id'];
$actionMessage = null;
if ($role === 'admin' && $_SERVER['REQUEST_METHOD'] === 'POST' && csrf_verify()) {
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
$orders = [];
if ($role === 'admin') {
    $hasO = $conn->query("SHOW TABLES LIKE 'orders'");
    if ($hasO && $hasO->num_rows > 0) {
        $sql = "SELECT id, order_number, customer_id, total_amount, status, payment_status, created_at FROM orders ORDER BY id DESC LIMIT 100";
        $result = $conn->query($sql);
        while ($row = $result->fetch_assoc()) { $orders[] = $row; }
    }
} else {
    $hasO = $conn->query("SHOW TABLES LIKE 'orders'");
    if ($hasO && $hasO->num_rows > 0) {
        $stmt = $conn->prepare("SELECT id, order_number, total_amount, status, payment_status, created_at FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 100");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) { $orders[] = $row; }
    }
}
include __DIR__ . '/includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0"><?php echo $role === 'admin' ? 'All Orders' : 'My Orders'; ?></h2>
            <?php if ($role !== 'admin'): ?>
                <a href="products.php" class="btn btn-outline-primary">Continue Shopping</a>
            <?php endif; ?>
        </div>
        <?php if ($actionMessage): ?><div class="alert alert-info"><?php echo htmlspecialchars($actionMessage); ?></div><?php endif; ?>
        <?php if (empty($orders)): ?>
            <div class="alert alert-info"><?php echo $role === 'admin' ? 'No orders found.' : 'You have no orders yet.'; ?></div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <?php if ($role === 'admin'): ?><th>Customer</th><?php endif; ?>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                            <?php if ($role === 'admin'): ?><th>Actions</th><?php endif; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($orders as $o): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($o['order_number']); ?></td>
                            <?php if ($role === 'admin'): ?><td><?php echo (int)$o['customer_id']; ?></td><?php endif; ?>
                            <td>₦<?php echo number_format((float)$o['total_amount'], 2); ?></td>
                            <td><span class="badge bg-secondary"><?php echo htmlspecialchars($o['status']); ?></span></td>
                            <td><span class="badge bg-info text-dark"><?php echo htmlspecialchars($o['payment_status']); ?></span></td>
                            <td><?php echo htmlspecialchars($o['created_at']); ?></td>
                            <?php if ($role === 'admin'): ?>
                            <td>
                                <form method="post" class="d-inline">
                                    <?php csrf_input(); ?>
                                    <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                    <input type="hidden" name="op" value="delivered">
                                    <button class="btn btn-sm btn-outline-secondary" type="submit">Mark Delivered</button>
                                </form>
                                <form method="post" class="d-inline ms-2">
                                    <?php csrf_input(); ?>
                                    <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                    <input type="hidden" name="op" value="release">
                                    <button class="btn btn-sm btn-success" type="submit">Release Funds</button>
                                </form>
                                <form method="post" class="d-inline ms-2">
                                    <?php csrf_input(); ?>
                                    <input type="hidden" name="order_id" value="<?php echo (int)$o['id']; ?>">
                                    <input type="hidden" name="op" value="refund">
                                    <button class="btn btn-sm btn-danger" type="submit">Refund</button>
                                </form>
                            </td>
                            <?php endif; ?>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
