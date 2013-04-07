<?php
if(isset($_GET['p'])) {
	// retrieve single project
	$output = array();
} else {
	// retrieve all projects
	$activities = json_decode(file_get_contents('http://www.texugo.com.br/bxc2013/mapa!pins.action'), true);
	$output = $activities['values'];
}

header('Content-type: application/json');
echo json_encode($output);
exit;
?>