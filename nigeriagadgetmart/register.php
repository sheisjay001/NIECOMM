<?php
require_once 'includes/config.php';
require_once 'includes/csrf.php';
$page_title = 'Register';
$errors = [];
$success = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_verify()) {
        $errors[] = 'Invalid request.';
    } else {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    $role_name = strtolower(trim($_POST['role'] ?? ''));
    $name = trim($_POST['name'] ?? '');
    if ($email === '' || $password === '' || $confirm === '' || $role_name === '') $errors[] = 'Please fill all required fields.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email address.';
    if ($password !== $confirm) $errors[] = 'Passwords do not match.';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
    if (!in_array($role_name, ['customer','vendor'])) $errors[] = 'Invalid role selected.';
    if (empty($errors)) {
        $check = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $check->bind_param("s", $email);
        $check->execute();
        $cr = $check->get_result();
        if ($cr && $cr->num_rows) $errors[] = 'Email already exists.';
    }
    $role_id = null;
    if (empty($errors)) {
        $rs = $conn->prepare("SELECT id FROM roles WHERE name = ? LIMIT 1");
        $rs->bind_param("s", $role_name);
        $rs->execute();
        $rr = $rs->get_result();
        if ($rr && $rr->num_rows) {
            $role_id = intval($rr->fetch_assoc()['id']);
        } else {
            $role_id = $role_name === 'vendor' ? 2 : 3;
        }
        $raw_username = $name !== '' ? $name : explode('@', $email)[0];
        $username = preg_replace('/[^a-zA-Z0-9_]+/', '_', strtolower($raw_username));
        if ($username === '') $username = 'user_' . substr(md5($email), 0, 6);
        $exists = $conn->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
        $exists->bind_param("s", $username);
        $exists->execute();
        $er = $exists->get_result();
        if ($er && $er->num_rows) $username .= '_' . substr(md5(uniqid('', true)), 0, 4);
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $username, $email, $hash, $role_id);
        try {
            $stmt->execute();
            $success = true;
        } catch (Throwable $e) {
            $errors[] = 'Registration failed. Try again.';
        }
    }
    }
}
include 'includes/header.php';
?>
<section class="py-5">
    <div class="container">
        <div class="mx-auto" style="max-width: 640px;">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h2 class="mb-3">Create your account</h2>
                    <?php if (!empty($errors)): ?>
                        <div class="alert alert-danger">
                            <?php foreach ($errors as $e) echo "<div>".htmlspecialchars($e)."</div>"; ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($success): ?>
                        <div class="alert alert-success">Account created. You can now log in.</div>
                    <?php endif; ?>
                    <form class="row g-3 needs-validation" novalidate method="post">
                        <?php csrf_input(); ?>
                        <div class="col-12">
                            <input type="email" name="email" class="form-control" placeholder="Email" required>
                        </div>
                        <div class="col-12">
                            <select name="role" class="form-select" required>
                                <option value="" selected disabled>Sign up as</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <input type="password" name="password" class="form-control" placeholder="Password" required>
                        </div>
                        <div class="col-12">
                            <input type="password" name="confirm" class="form-control" placeholder="Confirm Password" required>
                        </div>
                        <div class="col-12">
                            <input type="text" name="name" class="form-control" placeholder="Optional: Display name">
                        </div>
                        <div class="col-12 d-flex justify-content-between">
                            <a href="login.php" class="btn btn-outline-secondary">Already have an account?</a>
                            <button class="btn btn-primary" type="submit">Sign up</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
<?php include 'includes/footer.php'; ?>
