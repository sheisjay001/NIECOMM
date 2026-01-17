<?php
require_once __DIR__ . '/../includes/config.php';
header('Content-Type: text/html; charset=utf-8');
$created = false;
$updated = false;
$email = 'admin@nie-comm.local';
$username = 'admin';
$generatedPassword = null;
try {
    $hasRoles = $conn->query("SHOW TABLES LIKE 'roles'");
    if (!$hasRoles || $hasRoles->num_rows === 0) {
        $conn->query("CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(32) UNIQUE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        $conn->query("INSERT IGNORE INTO roles (name) VALUES ('admin'), ('vendor'), ('customer')");
    } else {
        $conn->query("INSERT IGNORE INTO roles (name) VALUES ('admin')");
    }
    $rid = null;
    $rs = $conn->prepare("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
    $rs->execute();
    $rres = $rs->get_result();
    if ($rres && $rres->num_rows) $rid = (int)$rres->fetch_assoc()['id'];
    if (!$rid) throw new Exception('Admin role id missing');
    $cols = [];
    $cRes = $conn->query("SHOW COLUMNS FROM users");
    if ($cRes) while ($c = $cRes->fetch_assoc()) $cols[] = strtolower($c['Field']);
    if (!in_array('role_id', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN role_id INT NULL");
    }
    if (!in_array('is_verified', $cols)) {
        $conn->query("ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0");
    }
    $exists = null;
    $q = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1");
    $q->bind_param("ss", $email, $username);
    $q->execute();
    $qr = $q->get_result();
    if ($qr && $qr->num_rows) {
        $uid = (int)$qr->fetch_assoc()['id'];
        $generatedPassword = 'Admin-' . substr(bin2hex(random_bytes(6)), 0, 12);
        $hash = password_hash($generatedPassword, PASSWORD_DEFAULT);
        $u = $conn->prepare("UPDATE users SET role_id = ?, email = ?, username = ?, password = ? WHERE id = ?");
        $u->bind_param("isssi", $rid, $email, $username, $hash, $uid);
        $u->execute();
        $updated = true;
    } else {
        $generatedPassword = 'Admin-' . substr(bin2hex(random_bytes(6)), 0, 12);
        $hash = password_hash($generatedPassword, PASSWORD_DEFAULT);
        $ins = $conn->prepare("INSERT INTO users (username, email, password, role_id, is_verified) VALUES (?, ?, ?, ?, 1)");
        $ins->bind_param("sssi", $username, $email, $hash, $rid);
        $ins->execute();
        $created = true;
    }
} catch (Throwable $e) {
    echo "<h2>Failed to seed admin</h2><p>" . htmlspecialchars($e->getMessage()) . "</p>";
    exit;
}
echo "<!doctype html><html><head><meta charset='utf-8'><title>Admin Seed</title><style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 20px} .card{border:1px solid #e5e7eb;border-radius:12px;padding:20px} .muted{color:#64748B}</style></head><body>";
echo "<h2>Admin Account " . ($created ? "Created" : "Updated") . "</h2>";
echo "<div class='card'><p><strong>Email:</strong> {$email}</p>";
echo "<p><strong>Username:</strong> {$username}</p>";
echo "<p><strong>Temporary Password:</strong> {$generatedPassword}</p>";
echo "<p class='muted'>Use this to log in, then change the password from Profile.</p>";
echo "<p><a href='../login.php'>Go to Login</a></p></div>";
echo "</body></html>";
