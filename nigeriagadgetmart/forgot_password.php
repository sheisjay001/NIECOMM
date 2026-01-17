<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
$page_title = 'Forgot Password';
$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_verify()) {
        $error = 'Invalid request.';
    } else {
        $email = trim($_POST['email'] ?? '');
        if ($email === '') {
            $error = 'Please enter your email.';
        } else {
            $stmt = $conn->prepare("SELECT id, email FROM users WHERE email = ? LIMIT 1");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res && $res->num_rows) {
                $user = $res->fetch_assoc();
                $_SESSION['reset_user_id'] = (int)$user['id'];
                $_SESSION['reset_email'] = $user['email'];
                header("Location: reset_password.php");
                exit;
            } else {
                $error = 'No account found for that email.';
            }
        }
    }
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Forgot Password</h2>
        <?php if ($error): ?><div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div><?php endif; ?>
        <form class="row g-3 needs-validation" novalidate method="post">
            <?php csrf_input(); ?>
            <div class="col-md-6">
                <input type="email" name="email" class="form-control" placeholder="Enter your account email" required>
            </div>
            <div class="col-12">
                <button class="btn btn-primary" type="submit">Continue</button>
                <a href="login.php" class="btn btn-outline-secondary ms-2">Back to Login</a>
            </div>
        </form>
    </div>
</section>
<?php include 'includes/footer.php'; ?>
