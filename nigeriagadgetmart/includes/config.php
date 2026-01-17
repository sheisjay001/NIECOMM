<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
define('DB_SERVER', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'test');

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: no-referrer-when-downgrade");
header("Permissions-Policy: geolocation=(self), microphone=(), camera=()");
header("Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src 'self' https:; frame-ancestors 'self'; upgrade-insecure-requests");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 8);
mysqli_report(MYSQLI_REPORT_OFF);
$connected = @mysqli_real_connect($conn, DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME, (int)DB_PORT, null, 0);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
if (!$connected) {
    header('Content-Type: text/html; charset=utf-8');
    http_response_code(200);
    echo "<!doctype html><html><head><meta charset='utf-8'><title>Database Offline</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#f8f9fa;color:#111827;display:flex;align-items:center;justify-content:center;height:100vh;margin:0} .card{background:#fff;padding:24px;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);max-width:520px} h1{font-size:22px;margin:0 0 8px} p{margin:8px 0} .btn{display:inline-block;margin-top:12px;padding:10px 14px;background:#F68B1E;color:#fff;text-decoration:none;border-radius:8px}</style></head><body><div class='card'><h1>Database Connection Unavailable</h1><p>The site is running, but the local MySQL database is not reachable.</p><p>Start MySQL in XAMPP and then refresh this page.</p><p><strong>Expected settings</strong>: host 127.0.0.1, port 3306, user root, database test.</p><a class='btn' href='/setup_database.php'>Open Database Setup</a></div></body></html>";
    exit;
}
if (!$conn->set_charset("utf8mb4")) {
    http_response_code(500);
    echo "Error loading character set.";
    exit;
}
date_default_timezone_set('Africa/Lagos');
?>
