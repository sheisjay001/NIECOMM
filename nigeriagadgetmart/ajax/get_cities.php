<?php
require_once __DIR__ . '/../includes/config.php';
header('Content-Type: application/json');
$state_id = intval($_POST['state_id'] ?? 0);
if ($state_id <= 0) {
    echo json_encode([]);
    exit;
}
$stmt = $conn->prepare("SELECT id, name FROM cities WHERE state_id = ? ORDER BY name");
$stmt->bind_param("i", $state_id);
$stmt->execute();
$res = $stmt->get_result();
$out = [];
while ($row = $res->fetch_assoc()) {
    $out[] = ['id' => intval($row['id']), 'name' => $row['name']];
}
echo json_encode($out);
