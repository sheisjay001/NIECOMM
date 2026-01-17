<?php
$CITY_COORDS = [
    'Lagos' => [6.5244, 3.3792],
    'Ikeja' => [6.6018, 3.3515],
    'Lekki' => [6.4596, 3.6021],
    'Victoria Island' => [6.4269, 3.4189],
    'Ajah' => [6.4698, 3.6021],
    'Ikorodu' => [6.6194, 3.5105],
    'Badagry' => [6.4150, 2.8880],
    'Surulere' => [6.5000, 3.3500],
    'Yaba' => [6.5174, 3.3781],
    'Abuja' => [9.0765, 7.3986],
    'FCT' => [9.0765, 7.3986],
    'Kano' => [12.0022, 8.5919],
    'Katsina' => [12.9855, 7.6176],
    'Kaduna' => [10.5060, 7.4383],
    'Zaria' => [11.1113, 7.7227],
    'Sokoto' => [13.0600, 5.2400],
    'Birnin Kebbi' => [12.4539, 4.1970],
    'Gusau' => [12.1628, 6.6613],
    'Dutse' => [11.7080, 9.3396],
    'Maiduguri' => [11.8333, 13.1500],
    'Damaturu' => [11.7470, 11.9608],
    'Gombe' => [10.2897, 11.1711],
    'Yola' => [9.2000, 12.4833],
    'Bauchi' => [10.3150, 9.8442],
    'Jos' => [9.8965, 8.8583],
    'Ilorin' => [8.5000, 4.5500],
    'Lokoja' => [7.8023, 6.7333],
    'Minna' => [9.6139, 6.5569],
    'Lafia' => [8.4930, 8.5150],
    'Makurdi' => [7.7333, 8.5333],
    'Akure' => [7.2570, 5.2058],
    'Ado-Ekiti' => [7.6233, 5.2209],
    'Oshogbo' => [7.7827, 4.5421],
    'Ibadan' => [7.3775, 3.9470],
    'Ogbomosho' => [8.1333, 4.2667],
    'Ogbomoso' => [8.1333, 4.2667],
    'Abeokuta' => [7.1475, 3.3619],
    'Benin' => [6.3350, 5.6037],
    'Asaba' => [6.1980, 6.7510],
    'Warri' => [5.5167, 5.7500],
    'Port Harcourt' => [4.8156, 7.0498],
    'Obio-Akpor' => [4.8599, 7.0054],
    'Bonny' => [4.4526, 7.1660],
    'Uyo' => [5.0500, 7.9333],
    'Eket' => [4.6400, 7.9300],
    'Ikot Ekpene' => [5.1819, 7.7148],
    'Calabar' => [4.9500, 8.3333],
    'Owerri' => [5.4833, 7.0333],
    'Onitsha' => [6.1500, 6.7833],
    'Aba' => [5.1066, 7.3667],
    'Umuahia' => [5.5333, 7.4833],
    'Ohafia' => [5.6145, 7.8119],
    'Abakaliki' => [6.3167, 8.1167],
    'Awka' => [6.2100, 7.0800],
    'Nnewi' => [6.0167, 6.9167],
    'Zaria' => [11.1113, 7.7227],
    'Kafanchan' => [9.5869, 8.3833],
    'Kaduna' => [10.5060, 7.4383],
    'Katsina' => [12.9855, 7.6176],
    'Ilorin' => [8.5000, 4.5500],
    'Makurdi' => [7.7333, 8.5333],
    'Benin City' => [6.3350, 5.6037],
    'Asaba' => [6.1980, 6.7510],
    'Warri' => [5.5167, 5.7500]
];

function geo_get_city_name(mysqli $conn, $city_id) {
    if (!$city_id) return null;
    $stmt = $conn->prepare("SELECT name FROM cities WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $city_id);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows) {
        return $res->fetch_assoc()['name'];
    }
    return null;
}

function geo_get_coords_for_city(mysqli $conn, $city_id) {
    global $CITY_COORDS;
    $name = geo_get_city_name($conn, $city_id);
    if ($name && isset($CITY_COORDS[$name])) return $CITY_COORDS[$name];
    return null;
}

function geo_haversine_km($lat1, $lon1, $lat2, $lon2) {
    $R = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return round($R * $c, 1);
}

function geo_pickup_speed_label($km) {
    if ($km <= 10) return 'Pickup today';
    if ($km <= 30) return 'Pickup in 1–2 days';
    return 'Pickup in 2–3 days';
}
