<?php
require_once __DIR__ . '/../includes/config.php';

$data = [
    'Abia' => ['Umuahia','Aba','Ohafia','Arochukwu','Bende','Ukwa','Isuochi','Aba North','Aba South'],
    'Adamawa' => ['Yola','Mubi','Ganye','Numan','Jimeta','Hong','Michika','Maiha','Yola North','Yola South'],
    'Akwa Ibom' => ['Uyo','Eket','Ikot Ekpene','Oron','Abak','Uruan','Mkpat-Enin','Ikot-Abasi','Essien Udim'],
    'Anambra' => ['Awka','Onitsha','Nnewi','Ekwulobia','Ihiala','Otuocha','Ogbaru','Awka South','Awka North'],
    'Bauchi' => ['Bauchi','Azare','Misau','Ningi','Toro','Jama’are','Tafawa Balewa','Darazo','Dass'],
    'Bayelsa' => ['Yenagoa','Brass','Sagbama','Ogbia','Nembe','Ekeremor','Kolokuma','Southern Ijaw'],
    'Benue' => ['Makurdi','Gboko','Otukpo','Katsina-Ala','Guma','Buruku','Logo','Agatu','Konshisha'],
    'Borno' => ['Maiduguri','Biu','Damboa','Gwoza','Askira-Uba','Konduga','Ngala','Monguno','Dikwa'],
    'Cross River' => ['Calabar','Ikom','Ogoja','Obudu','Bekwarra','Akamkpa','Etung','Boki','Calabar South'],
    'Delta' => ['Asaba','Warri','Sapele','Ughelli','Agbor','Oleh','Oghara','Kwale','Bomadi','Ekpan'],
    'Ebonyi' => ['Abakaliki','Afikpo','Ezza','Izzi','Ikwo','Ohaukwu','Onicha','Ohaozara','Ishielu'],
    'Edo' => ['Benin City','Auchi','Ekpoma','Uromi','Igarra','Irrua','Oredo','Esan West','Etsako'],
    'Ekiti' => ['Ado-Ekiti','Ikere-Ekiti','Ijero-Ekiti','Ido-Ekiti','Efon-Alaaye','Ikole-Ekiti','Oye-Ekiti','Ise-Ekiti'],
    'Enugu' => ['Enugu','Nsukka','Awgu','Oji River','Udi','Ezeagu','Igbo-Eze','Nkanu','Enugu East','Enugu North'],
    'Gombe' => ['Gombe','Kumo','Billiri','Dukku','Balanga','Yamaltu/Deba','Akko','Nafada','Kwami'],
    'Imo' => ['Owerri','Orlu','Okigwe','Oguta','Ihitte/Uboma','Mbaitoli','Ngor Okpala','Ohaji/Egbema','Owerri North'],
    'Jigawa' => ['Dutse','Hadejia','Gumel','Kazaure','Ringim','Birnin Kudu','Babura','Sule Tankarkar','Guri'],
    'Kaduna' => ['Kaduna','Zaria','Kafanchan','Soba','Kachia','Kajuru','Jema’a','Giwa','Chikun'],
    'Kano' => ['Kano','Wudil','Rano','Bichi','Gaya','Madobi','Kura','Gwale','Tarauni','Nassarawa'],
    'Katsina' => ['Katsina','Funtua','Daura','Kankara','Musawa','Dutsin-Ma','Bakori','Mani','Malumfashi'],
    'Kebbi' => ['Birnin Kebbi','Argungu','Yauri','Zuru','Gwandu','Jega','Aliero','Bagudo','Dandi'],
    'Kogi' => ['Lokoja','Kabba','Okene','Idah','Dekina','Bassa','Ajaokuta','Mopa','Ogori/Magongo'],
    'Kwara' => ['Ilorin','Offa','Omu-Aran','Patigi','Ilesha','Kaiama','Ekiti Kwara','Jebba','Asa'],
    'Lagos' => ['Ikeja','Lagos Island','Lagos Mainland','Lekki','Victoria Island','Surulere','Ajah','Badagry','Ikorodu'],
    'Nasarawa' => ['Lafia','Keffi','Akwanga','Karu','Doma','Toto','Wamba','Nasarawa','Obi'],
    'Niger' => ['Minna','Bida','Suleja','Kontagora','Mokwa','Lapai','Shiroro','Chanchaga','Borgu'],
    'Ogun' => ['Abeokuta','Ijebu-Ode','Sagamu','Abeokuta North','Abeokuta South','Ewekoro','Yewa','Ilaro','Ota'],
    'Ondo' => ['Akure','Owo','Ondo','Ikare','Ifon','Ilaje','Akoko','Irele','Okitipupa'],
    'Osun' => ['Osogbo','Ile-Ife','Ilesa','Ede','Iwo','Ikirun','Ejigbo','Olorunda','Osogbo South'],
    'Oyo' => ['Ibadan','Oyo','Saki','Ogbomoso','Iseyin','Eruwa','Ibarapa','Ibadan North','Ibadan South'],
    'Plateau' => ['Jos','Pankshin','Barkin Ladi','Bokkos','Shendam','Langtang','Mangu','Wase','Riyom'],
    'Rivers' => ['Port Harcourt','Bonny','Bori','Ahoada','Omoku','Eleme','Obio-Akpor','Ikwerre','Opobo/Nkoro'],
    'Sokoto' => ['Sokoto','Gusau','Wurno','Tambuwal','Illela','Gwadabawa','Rabah','Shagari','Tureta'],
    'Taraba' => ['Jalingo','Wukari','Sardauna','Takum','Bali','Gashaka','Ibi','Karim Lamido','Zing'],
    'Yobe' => ['Damaturu','Potiskum','Gashua','Nguru','Fika','Geidam','Buni Yadi','Jakusko','Yunusari'],
    'Zamfara' => ['Gusau','Kaura Namoda','Anka','Talata Mafara','Birnin Magaji','Maradun','Shinkafi','Gummi','Bungudu'],
    'FCT' => ['Abuja','Gwagwalada','Kuje','Bwari','Abaji','Kwali','AMAC']
];

$insert = $conn->prepare("INSERT INTO cities (state_id, name) VALUES (?, ?)");

foreach ($data as $state => $cities) {
    $res = $conn->prepare("SELECT id FROM states WHERE name = ? LIMIT 1");
    $res->bind_param("s", $state);
    $res->execute();
    $idRes = $res->get_result();
    if (!$idRes || $idRes->num_rows === 0) continue;
    $stateId = (int)$idRes->fetch_assoc()['id'];
    foreach ($cities as $city) {
        $check = $conn->prepare("SELECT id FROM cities WHERE state_id = ? AND name = ? LIMIT 1");
        $check->bind_param("is", $stateId, $city);
        $check->execute();
        $exists = $check->get_result();
        if ($exists && $exists->num_rows > 0) continue;
        $insert->bind_param("is", $stateId, $city);
        $insert->execute();
    }
}

echo "Seeded full Nigeria cities dataset.\n";
