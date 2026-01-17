<?php
require_once __DIR__ . '/../includes/config.php';
if (!isset($_SESSION['user_id'])) { header("Location: ../login.php"); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'vendor') { header("Location: ../user_dashboard.php"); exit; }
$page_title = 'Customer Orders';
$uid = (int)$_SESSION['user_id'];
$orders = [];
$hasOI = $conn->query("SHOW TABLES LIKE 'order_items'");
if ($hasOI && $hasOI->num_rows > 0) {
    $sql = "SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at
            FROM orders o
            WHERE EXISTS (
                SELECT 1 FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = o.id AND p.vendor_id = ?
            )
            ORDER BY o.id DESC LIMIT 50";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $uid);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) { $orders[] = $row; }
}
include __DIR__ . '/../includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="mb-0">Orders from Customers</h2>
            <a href="../vendor_dashboard.php" class="btn btn-outline-primary">Back to Dashboard</a>
        </div>
        <?php if (empty($orders)): ?>
            <div class="alert alert-info">No orders yet.</div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Order</th>
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
</section>
<?php include __DIR__ . '/../includes/footer.php'; ?>
