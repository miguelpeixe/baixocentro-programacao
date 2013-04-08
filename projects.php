<?php
if(isset($_GET['p'])) {
	// retrieve single project
	$output = array();
} else {
	// retrieve all projects
	$activities = json_decode(file_get_contents('http://www.texugo.com.br/bxc2013/mapa!pins.action'), true);
	$output = $activities['values'];
	// fix date
	foreach($output as &$item) {
		error_log($item['data']);
		$item['data'] = fixDate($item['data']);
	}
}

function fixDate($date) {

	// clear years (and buggy years)
	$date = str_replace('/2013', '', $date);
	$date = str_replace('/2012/2013', '', $date);
	$date = str_replace('/2018', '', $date);
	$date = str_replace('/2024', '', $date);
	$date = str_replace('/2012', '', $date);

	error_log($date);

	// add 0 prefix to 1 length day/month
	$separatedVals = explode('/', $date);
	if($separatedVals) {
		if(strlen($separatedVals[0]) === 1)
			$separatedVals[0] = '0' . $separatedVals[0];
		if(strlen($separatedVals[1]) === 1)
			$separatedVals[1] = '0' . $separatedVals[1];
		$date = implode('/', $separatedVals);
	}

	return $date;
}

header('Content-type: application/json');
echo json_encode($output);
exit;
?>