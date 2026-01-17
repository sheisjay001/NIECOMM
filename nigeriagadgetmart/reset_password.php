<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
$page_title = 'Reset Password';
$error = null;
$success = null;
$canReset = false;
$targetUserId = null;
if (isset($_SESSION['reset_user_id'])) {
    $canReset = true;
    $targetUserId = (int)$_SESSION['reset_user_id'];
} elseif (isset($_SESSION['user_id'])) {
    $canReset = true;
    $targetUserId = (int)$_SESSION['user_id'];
}
if (!$canReset) {
    header("Location: forgot_password.php");
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_verify()) {
        $error = 'Invalid request.';
    } else {
        $password = $_POST['password'] ?? '';
        $confirm = $_POST['confirm'] ?? '';
        if ($password === '' || $confirm === '') {
            $error = 'Please enter and confirm your new password.';
        } elseif ($password !== $confirm) {
            $error = 'Passwords do not match.';
        } elseif (strlen($password) < 6) {
            $error = 'Password must be at least 6 characters.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $hash, $targetUserId);
            $stmt->execute();
            unset($_SESSION['reset_user_id'], $_SESSION['reset_email']);
            $success = 'Password updated successfully.';
        }
    }
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container" style="max-width: 720px;">
        <div class="card shadow-sm">
            <div class="card-body">
                <h2 class="mb-3">Reset Password</h2>
                <?php if ($error): ?><div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div><?php endif; ?>
                <?php if ($success): ?><div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div><?php endif; ?>
                <form class="row g-3 needs-validation" novalidate method="post">
                    <?php csrf_input(); ?>
                    <div class="col-md-6">
                        <label class="form-label">New Password</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" name="confirm" class="form-control" required>
                    </div>
                    <div class="col-12 d-flex justify-content-between">
                        <a href="login.php" class="btn btn-outline-secondary">Back to Login</a>
                        <button class="btn btn-primary" type="submit">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>
<?php include 'includes/footer.php'; ?>
