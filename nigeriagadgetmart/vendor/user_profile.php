<?php
require_once __DIR__ . '/../includes/config.php';
if (!isset($_SESSION['user_id'])) { header("Location: ../login.php"); exit; }
$role = strtolower($_SESSION['role'] ?? '');
if ($role !== 'vendor') { header("Location: ../user_dashboard.php"); exit; }
header("Location: ../user_profile.php");
exit;
