<?php
require_once 'includes/config.php';
if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'admin') { header('Location: user_dashboard.php'); exit; }
$page_title = 'Admin Messages';

// Select conversation pair if provided
$u1 = isset($_GET['u1']) ? (int)$_GET['u1'] : 0;
$u2 = isset($_GET['u2']) ? (int)$_GET['u2'] : 0;

// Fetch conversation pairs
$pairs = [];
$sql = "SELECT 
            LEAST(sender_id, receiver_id) AS u1, 
            GREATEST(sender_id, receiver_id) AS u2,
            MAX(created_at) AS last_time,
            COUNT(*) AS total,
            SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread
        FROM messages
        GROUP BY u1, u2
        ORDER BY last_time DESC
        LIMIT 200";
$res = $conn->query($sql);
while ($row = $res && $res->fetch_assoc() ? $res->fetch_assoc() : null) { $pairs[] = $row; }

function uname(mysqli $conn, int $uid): string {
    $q = $conn->prepare("SELECT u.username, vp.business_name, r.name AS role FROM users u LEFT JOIN vendor_profiles vp ON vp.user_id=u.id LEFT JOIN roles r ON r.id=u.role_id WHERE u.id=? LIMIT 1");
    $q->bind_param('i', $uid);
    $q->execute();
    $r = $q->get_result()->fetch_assoc();
    if (!$r) return 'User '.$uid;
    $label = !empty($r['business_name']) ? $r['business_name'] : ($r['username'] ?? ('User '.$uid));
    if (!empty($r['role'])) $label .= ' ('.strtolower($r['role']).')';
    return $label;
}

include 'includes/header.php';

// Load messages for selected pair
$thread = [];
if ($u1 && $u2) {
    $stmt = $conn->prepare("SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY created_at ASC, id ASC");
    $stmt->bind_param('iiii', $u1, $u2, $u2, $u1);
    $stmt->execute();
    $rs = $stmt->get_result();
    while ($m = $rs->fetch_assoc()) { $thread[] = $m; }
}
?>
<section class="py-5">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="mb-0">Messages Oversight</h2>
            <a class="btn btn-outline-secondary" href="admin_dashboard.php">Back to Admin</a>
        </div>
        <div class="row g-4">
            <div class="col-lg-4">
                <div class="list-group">
                    <?php if (empty($pairs)): ?>
                        <div class="alert alert-info">No conversations yet.</div>
                    <?php else: ?>
                        <?php foreach ($pairs as $p): ?>
                            <?php $active = ($u1===(int)$p['u1'] && $u2===(int)$p['u2']); ?>
                            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center <?php echo $active?'active':''; ?>" href="admin_messages.php?u1=<?php echo (int)$p['u1']; ?>&u2=<?php echo (int)$p['u2']; ?>">
                                <span><?php echo htmlspecialchars(uname($conn, (int)$p['u1'])).' ↔ '.htmlspecialchars(uname($conn, (int)$p['u2'])); ?></span>
                                <?php if (!empty($p['unread'])): ?><span class="badge bg-danger rounded-pill"><?php echo (int)$p['unread']; ?></span><?php endif; ?>
                            </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            <div class="col-lg-8">
                <?php if ($u1 && $u2): ?>
                    <div class="card">
                        <div class="card-header">
                            <strong><?php echo htmlspecialchars(uname($conn, $u1)); ?></strong> ↔ <strong><?php echo htmlspecialchars(uname($conn, $u2)); ?></strong>
                        </div>
                        <div class="card-body" style="max-height: 480px; overflow-y: auto;">
                            <?php if (empty($thread)): ?>
                                <p class="text-muted">No messages in this conversation.</p>
                            <?php else: ?>
                                <?php foreach ($thread as $m): ?>
                                    <div class="mb-3">
                                        <div class="small text-muted mb-1">
                                            <i class="fas fa-user me-1"></i>
                                            <?php echo htmlspecialchars(uname($conn, (int)$m['sender_id'])); ?>
                                            <span class="ms-2"><?php echo htmlspecialchars($m['created_at']); ?></span>
                                        </div>
                                        <div class="p-2 rounded bg-light"><?php echo nl2br(htmlspecialchars($m['content'])); ?></div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="alert alert-secondary">Select a conversation from the left to inspect.</div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
<?php include 'includes/footer.php'; ?>
