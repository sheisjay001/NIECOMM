<?php
require_once 'includes/config.php';
$page_title = 'Messages';
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$me = (int)$_SESSION['user_id'];
// Ensure messages table exists
$conn->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT NULL,
    order_id INT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Optional bootstrap: start conversation via query params
$partnerId = isset($_GET['user']) ? (int)$_GET['user'] : 0;
$productId = isset($_GET['product']) ? (int)$_GET['product'] : null;

// Handle new message post
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['content'], $_POST['partner_id'])) {
    $partnerId = (int)$_POST['partner_id'];
    $productId = isset($_POST['product_id']) ? (int)$_POST['product_id'] : null;
    $content = trim($_POST['content']);
    if ($partnerId > 0 && $content !== '') {
        $stmt = $conn->prepare("INSERT INTO messages (sender_id, receiver_id, product_id, content) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('iiis', $me, $partnerId, $productId, $content);
        $stmt->execute();
        header("Location: messages.php?user=".$partnerId.($productId?("&product=".$productId):""));
        exit;
    }
}

include 'includes/header.php';

// Fetch conversation list
$conversations = [];
$sql = "SELECT 
            IF(sender_id = ?, receiver_id, sender_id) AS partner_id,
            MAX(created_at) AS last_time,
            SUM(CASE WHEN receiver_id = ? AND read_at IS NULL THEN 1 ELSE 0 END) AS unread_count
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY partner_id
        ORDER BY last_time DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('iiii', $me, $me, $me, $me);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $conversations[] = $row;
}

// Helper: display name
function display_name(mysqli $conn, int $userId): string {
    $q = $conn->prepare("SELECT u.username, u.role_id, vp.business_name FROM users u LEFT JOIN vendor_profiles vp ON vp.user_id = u.id WHERE u.id = ? LIMIT 1");
    $q->bind_param('i', $userId);
    $q->execute();
    $r = $q->get_result()->fetch_assoc();
    if (!$r) return 'User '.$userId;
    if (!empty($r['business_name'])) return $r['business_name'];
    return $r['username'] ?? ('User '.$userId);
}

// Load messages for selected partner
$chat = [];
if ($partnerId > 0) {
    $stmt = $conn->prepare("SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC, id ASC");
    $stmt->bind_param('iiii', $me, $partnerId, $partnerId, $me);
    $stmt->execute();
    $chatRes = $stmt->get_result();
    while ($m = $chatRes->fetch_assoc()) { $chat[] = $m; }
    // Mark received messages as read
    $upd = $conn->prepare("UPDATE messages SET read_at = NOW() WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL");
    $upd->bind_param('ii', $me, $partnerId);
    $upd->execute();
}
?>
<section class="py-5">
    <div class="container">
        <div class="row g-4">
            <div class="col-lg-4">
                <h2 class="mb-3">Messages</h2>
                <div class="list-group">
                    <?php if (empty($conversations)): ?>
                        <div class="alert alert-info">No conversations yet.</div>
                    <?php else: ?>
                        <?php foreach ($conversations as $c): ?>
                            <?php $pid = (int)$c['partner_id']; $active = ($pid === $partnerId); ?>
                            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center <?php echo $active?'active':''; ?>" href="messages.php?user=<?php echo $pid; ?>">
                                <span><?php echo htmlspecialchars(display_name($conn, $pid)); ?></span>
                                <?php if (!empty($c['unread_count'])): ?>
                                    <span class="badge bg-danger rounded-pill"><?php echo (int)$c['unread_count']; ?></span>
                                <?php endif; ?>
                            </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            <div class="col-lg-8">
                <?php if ($partnerId > 0): ?>
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <strong><?php echo htmlspecialchars(display_name($conn, $partnerId)); ?></strong>
                            <?php if ($productId): ?>
                                <a class="btn btn-sm btn-outline-secondary" href="products.php">View Product</a>
                            <?php endif; ?>
                        </div>
                        <div class="card-body" style="max-height: 420px; overflow-y: auto;">
                            <?php if (empty($chat)): ?>
                                <p class="text-muted">Start the conversation.</p>
                            <?php else: ?>
                                <?php foreach ($chat as $m): ?>
                                    <?php $mine = ($m['sender_id'] == $me); ?>
                                    <div class="d-flex <?php echo $mine?'justify-content-end':'justify-content-start'; ?> mb-3">
                                        <div class="p-2 rounded <?php echo $mine?'bg-primary text-white':'bg-light'; ?>" style="max-width: 70%;">
                                            <div><?php echo nl2br(htmlspecialchars($m['content'])); ?></div>
                                            <div class="small opacity-75 mt-1"><?php echo htmlspecialchars($m['created_at']); ?></div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        <div class="card-footer">
                            <form method="post" class="d-flex gap-2">
                                <input type="hidden" name="partner_id" value="<?php echo (int)$partnerId; ?>">
                                <?php if ($productId): ?>
                                    <input type="hidden" name="product_id" value="<?php echo (int)$productId; ?>">
                                <?php endif; ?>
                                <input type="text" name="content" class="form-control" placeholder="Type a message..." required>
                                <button class="btn btn-primary" type="submit">Send</button>
                            </form>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="alert alert-secondary">Select a conversation on the left or start one from a product card.</div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
<?php include 'includes/footer.php'; ?>
