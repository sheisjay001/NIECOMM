<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
$page_title = 'Profile';
$msg = null;
// Ensure required columns exist for profile fields
try {
    $cols = [];
    $cRes = $conn->query("SHOW COLUMNS FROM users");
    if ($cRes) {
        while ($c = $cRes->fetch_assoc()) $cols[] = strtolower($c['Field']);
    }
    if (!in_array('phone', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL");
    }
    if (!in_array('state_id', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN state_id INT NULL");
    }
    if (!in_array('city_id', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN city_id INT NULL");
    }
} catch (Throwable $e) {}
// Load current profile values
$current = ['username' => $_SESSION['username'] ?? '', 'phone' => '', 'state_id' => $_SESSION['state_id'] ?? null, 'city_id' => $_SESSION['city_id'] ?? null];
try {
    $q = $conn->prepare("SELECT username, phone, state_id, city_id FROM users WHERE id = ? LIMIT 1");
    $q->bind_param("i", $_SESSION['user_id']);
    $q->execute();
    $r = $q->get_result();
    if ($r && $r->num_rows) {
        $row = $r->fetch_assoc();
        $current['username'] = $row['username'] ?? $current['username'];
        $current['phone'] = $row['phone'] ?? '';
        $current['state_id'] = $row['state_id'] ?? $current['state_id'];
        $current['city_id'] = $row['city_id'] ?? $current['city_id'];
    }
} catch (Throwable $e) {}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && csrf_verify()) {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $state_id = intval($_POST['state'] ?? 0);
    $city_id = intval($_POST['city'] ?? 0);
    $username = $name !== '' ? preg_replace('/[^a-zA-Z0-9_]+/', '_', strtolower($name)) : null;
    try {
        $stmt = $conn->prepare("UPDATE users SET username = COALESCE(?, username), phone = ?, state_id = NULLIF(?, 0), city_id = NULLIF(?, 0) WHERE id = ?");
        $stmt->bind_param("ssiii", $username, $phone, $state_id, $city_id, $_SESSION['user_id']);
        $stmt->execute();
        $_SESSION['username'] = $username ?: $_SESSION['username'];
        $_SESSION['state_id'] = $state_id ?: $_SESSION['state_id'];
        $_SESSION['city_id'] = $city_id ?: $_SESSION['city_id'];
        $current['username'] = $_SESSION['username'];
        $current['phone'] = $phone;
        $current['state_id'] = $_SESSION['state_id'];
        $current['city_id'] = $_SESSION['city_id'];
        $msg = 'Profile updated';
    } catch (Throwable $e) {
        $msg = 'Update failed';
    }
}
$states = [];
$res = $conn->query("SELECT id, name FROM states ORDER BY name");
if ($res && $res->num_rows) {
    while ($row = $res->fetch_assoc()) $states[] = $row;
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="mx-auto" style="max-width: 720px;">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h2 class="mb-3">Edit Profile</h2>
                    <?php if ($msg): ?><div class="alert alert-info"><?php echo htmlspecialchars($msg); ?></div><?php endif; ?>
                    <form class="row g-3 needs-validation" novalidate method="post">
                        <?php csrf_input(); ?>
                        <div class="col-md-6">
                            <label class="form-label">Display Name</label>
                            <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($current['username'] ?? ''); ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone</label>
                            <input type="text" name="phone" class="form-control" value="<?php echo htmlspecialchars($current['phone'] ?? ''); ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">State</label>
                            <select name="state" class="form-select">
                                <option value="" selected disabled>Select State</option>
                                <?php foreach ($states as $s): ?>
                                    <option value="<?php echo htmlspecialchars($s['id']); ?>" <?php echo ((int)$current['state_id'] === (int)$s['id']) ? 'selected' : ''; ?>><?php echo htmlspecialchars($s['name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">City</label>
                            <select name="city" class="form-select" data-current-city="<?php echo htmlspecialchars((string)($current['city_id'] ?? '')); ?>">
                                <option value="" selected disabled>Select City</option>
                            </select>
                        </div>
                        <div class="col-12 d-flex justify-content-end">
                            <button class="btn btn-primary" type="submit">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
