<?php

$activities = json_decode(file_get_contents('http://www.texugo.com.br/bxc2013/mapa!pins.action'), true);
$activities = $activities['values'];
header('Content-type: application/json');
echo json_encode($activities);
exit;
?>