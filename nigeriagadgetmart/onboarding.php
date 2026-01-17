<?php
require_once 'includes/config.php';
$page_title = 'Sign Up';
$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    $phone = trim($_POST['phone'] ?? '');
    $state_id = intval($_POST['state'] ?? 0);
    $city_id = intval($_POST['city'] ?? 0);
    if ($username === '' || $email === '' || $password === '' || $confirm === '' || $state_id === 0) $errors[] = 'Please fill all required fields.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email address.';
    if ($password !== $confirm) $errors[] = 'Passwords do not match.';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
    if (empty($errors)) {
        $check = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1");
        $check->bind_param("ss", $email, $username);
        $check->execute();
        $cr = $check->get_result();
        if ($cr && $cr->num_rows) $errors[] = 'Email or username already exists.';
    }
    $role_id = null;
    if (empty($errors)) {
        $rs = $conn->query("SELECT id FROM roles WHERE name='customer' LIMIT 1");
        $role_id = ($rs && $rs->num_rows) ? intval($rs->fetch_assoc()['id']) : 3;
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (username, email, password, role_id, phone, state_id, city_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $cityParam = $city_id > 0 ? $city_id : null;
        $stmt->bind_param("sssissi", $username, $email, $hash, $role_id, $phone, $state_id, $cityParam);
        try {
            $stmt->execute();
            header("Location: login.php");
            exit;
        } catch (Throwable $e) {
            $errors[] = 'Registration failed. Try again.';
        }
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
                    <h2 class="mb-3">Create your account</h2>
                    <?php if (!empty($errors)): ?>
                        <div class="alert alert-danger">
                            <?php foreach ($errors as $e) echo "<div>".htmlspecialchars($e)."</div>"; ?>
                        </div>
                    <?php endif; ?>
                    <form class="row g-3 needs-validation" novalidate method="post">
                        <div class="col-md-6">
                            <label class="form-label">Username</label>
                            <input type="text" name="username" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Confirm Password</label>
                            <input type="password" name="confirm" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Phone</label>
                            <input type="text" name="phone" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">State</label>
                            <select name="state" class="form-select" required>
                                <option value="" selected disabled>Select State</option>
                                <?php foreach ($states as $s): ?>
                                    <option value="<?php echo htmlspecialchars($s['id']); ?>"><?php echo htmlspecialchars($s['name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">City</label>
                            <select name="city" class="form-select" disabled>
                                <option value="" selected disabled>Select City</option>
                            </select>
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
