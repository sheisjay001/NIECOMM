<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
$page_title = 'Login';
$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_verify()) {
        $error = 'Invalid request.';
    } else {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    if ($email === '' || $password === '') {
        $error = 'Please enter email and password.';
    } else {
        $stmt = $conn->prepare("SELECT u.id, u.username, u.email, u.password, u.city_id, u.state_id, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $res->num_rows) {
            $user = $res->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = (int)$user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['city_id'] = $user['city_id'] ?? null;
                $_SESSION['state_id'] = $user['state_id'] ?? null;
                if (strtolower($user['role']) === 'admin') {
                    header("Location: admin_dashboard.php");
                } else {
                    header("Location: user_dashboard.php");
                }
                exit;
            } else {
                $error = 'Invalid credentials.';
            }
        } else {
            $error = 'Account not found.';
        }
    }
    }
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <h2 class="mb-4">Login</h2>
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        <form class="row g-3 needs-validation" novalidate method="post">
            <?php csrf_input(); ?>
            <div class="col-md-6">
                <input type="email" name="email" class="form-control" placeholder="Email" required>
            </div>
            <div class="col-md-6">
                <input type="password" name="password" class="form-control" placeholder="Password" required>
            </div>
            <div class="col-12">
                <button class="btn btn-primary" type="submit">Login</button>
            </div>
        </form>
        <div class="mt-3">
            <a href="register.php" class="btn btn-outline-secondary">Create an account</a>
            <a href="forgot_password.php" class="btn btn-link">Forgot password?</a>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
