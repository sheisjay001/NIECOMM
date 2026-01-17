<?php
require_once __DIR__ . '/../includes/config.php';
if (!isset($_SESSION['user_id'])) {
    header("Location: ../login.php");
    exit;
}
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'vendor') {
    header("Location: ../index.php");
    exit;
}
$message = null;
$status = null;
$conn->query("CREATE TABLE IF NOT EXISTS vendor_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cac_photo VARCHAR(255) DEFAULT NULL,
    shop_photo VARCHAR(255) DEFAULT NULL,
    goods_photo VARCHAR(255) DEFAULT NULL,
    status ENUM('none','submitted','approved','rejected') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
$res = $conn->prepare("SELECT status, cac_photo, shop_photo, goods_photo FROM vendor_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1");
$uid = $_SESSION['user_id'];
$res->bind_param("i", $uid);
$res->execute();
$ver = $res->get_result();
if ($ver && $ver->num_rows) {
    $row = $ver->fetch_assoc();
    $status = $row['status'];
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $baseDir = __DIR__ . '/../uploads/vendor_verifications/' . $uid;
    if (!is_dir($baseDir)) {
        @mkdir($baseDir, 0775, true);
    }
    $paths = ['cac_photo' => null, 'shop_photo' => null, 'goods_photo' => null];
    $allowed = ['image/jpeg','image/png','image/webp'];
    foreach ($paths as $k => $_) {
        if (!empty($_FILES[$k]['name']) && $_FILES[$k]['error'] === UPLOAD_ERR_OK) {
            $type = mime_content_type($_FILES[$k]['tmp_name']);
            if (!in_array($type, $allowed)) {
                $message = 'Only JPG/PNG/WEBP files are allowed.';
                break;
            }
            $ext = pathinfo($_FILES[$k]['name'], PATHINFO_EXTENSION);
            $filename = $k . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
            $dest = $baseDir . '/' . $filename;
            if (move_uploaded_file($_FILES[$k]['tmp_name'], $dest)) {
                $paths[$k] = 'uploads/vendor_verifications/' . $uid . '/' . $filename;
            }
        }
    }
    if (!$message) {
        $stmt = $conn->prepare("INSERT INTO vendor_verifications (user_id, cac_photo, shop_photo, goods_photo, status) VALUES (?, ?, ?, ?, 'submitted')");
        $stmt->bind_param("isss", $uid, $paths['cac_photo'], $paths['shop_photo'], $paths['goods_photo']);
        $stmt->execute();
        $message = 'Verification submitted. We will review and update your status.';
        $status = 'submitted';
    }
}
$page_title = 'Vendor Verification';
include __DIR__ . '/../includes/header.php';
?>
<section class="py-5">
    <div class="container" style="max-width: 860px;">
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h3 class="mb-0">Vendor Verification</h3>
                    <?php if ($status === 'approved'): ?>
                        <span class="badge bg-success">Approved</span>
                    <?php elseif ($status === 'submitted'): ?>
                        <span class="badge bg-warning text-dark">Pending Review</span>
                    <?php elseif ($status === 'rejected'): ?>
                        <span class="badge bg-danger">Rejected</span>
                    <?php endif; ?>
                </div>
                <p class="text-muted mb-4">Upload proof to verify your business: CAC document photo, a photo of your shop, and a photo clearly showing your goods in the shop.</p>
                <?php if ($message): ?>
                    <div class="alert alert-info"><?php echo htmlspecialchars($message); ?></div>
                <?php endif; ?>
                <form class="row g-3" method="post" enctype="multipart/form-data">
                    <div class="col-md-4">
                        <label class="form-label">CAC Document Photo</label>
                        <input type="file" name="cac_photo" class="form-control" accept="image/*" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Shop Exterior/Interior</label>
                        <input type="file" name="shop_photo" class="form-control" accept="image/*" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Goods Visible In Shop</label>
                        <input type="file" name="goods_photo" class="form-control" accept="image/*" required>
                    </div>
                    <div class="col-12 d-flex justify-content-end">
                        <button class="btn btn-primary" type="submit">Submit Verification</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>
<?php include __DIR__ . '/../includes/footer.php'; ?>
