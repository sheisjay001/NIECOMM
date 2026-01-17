<?php
function csrf_token() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf_token'];
}
function csrf_input() {
    $t = csrf_token();
    echo '<input type="hidden" name="csrf_token" value="'.htmlspecialchars($t).'">';
}
function csrf_verify() {
    $t = $_POST['csrf_token'] ?? '';
    return is_string($t) && isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $t);
}
?>
