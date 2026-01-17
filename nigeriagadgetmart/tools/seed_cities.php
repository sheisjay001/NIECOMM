<?php
require_once __DIR__ . '/../includes/config.php';

$countRes = $conn->query("SELECT COUNT(*) AS c FROM cities");
$count = $countRes ? (int)$countRes->fetch_assoc()['c'] : 0;
if ($count > 0) {
    echo "Cities already populated: $count\n";
    exit(0);
}

$map = [
    'Lagos' => ['Ikeja', 'Lekki', 'Surulere', 'Yaba'],
    'FCT' => ['Abuja', 'Garki', 'Wuse', 'Maitama'],
    'Kano' => ['Kano', 'Nassarawa', 'Tarauni'],
    'Rivers' => ['Port Harcourt', 'Obio-Akpor'],
    'Oyo' => ['Ibadan', 'Ogbomosho'],
    'Kaduna' => ['Kaduna', 'Zaria'],
];

$stmt = $conn->prepare("INSERT INTO cities (state_id, name) VALUES (?, ?)");
foreach ($map as $stateName => $cities) {
    $stateRes = $conn->query("SELECT id FROM states WHERE name = '" . $conn->real_escape_string($stateName) . "' LIMIT 1");
    if ($stateRes && $stateRes->num_rows > 0) {
        $stateId = (int)$stateRes->fetch_assoc()['id'];
        foreach ($cities as $city) {
            $name = $city;
            $stmt->bind_param("is", $stateId, $name);
            $stmt->execute();
        }
    }
}

echo "Seeded cities for top states.\n";
