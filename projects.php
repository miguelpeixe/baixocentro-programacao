<?php
if(isset($_GET['id'])) {
	// retrieve single project
	$data = file_get_contents('http://www.texugo.com.br/bxc2013/mapa!projeto.action?codProjeto=' . $_GET['id']);
	if(!$data) {
		output(false);
		exit();
	}
	$project = json_decode($data, true);
	$output = $project['values'];
	$output['data'] = fixDate($output['data']);
	output($output);
	exit();
} else {
	// retrieve all projects
	$data = file_get_contents('http://www.texugo.com.br/bxc2013/mapa!pins.action');
	if(!$data) {
		output(false);
		exit();
	}
	$projects = json_decode($data, true);
	$output = $projects['values'];
	// fix date
	foreach($output as &$item) {
		error_log($item['data']);
		$item['data'] = fixDate($item['data']);
	}
	output($output);
	exit();
}

function fixDate($date) {

	// clear years (and buggy years)
	$date = str_replace('/2013', '', $date);
	$date = str_replace('/2012/2013', '', $date);
	$date = str_replace('/2018', '', $date);
	$date = str_replace('/2024', '', $date);
	$date = str_replace('/2012', '', $date);

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

function output($data) {
	header('Content-type: application/json');
	if($data) {
		/* Browser caching */
		$expires = 60 * 30; // 30 minutes of browser cache
		header('Pragma: public');
		header('Cache-Control: maxage=' . $expires);
		header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');
		/* --------------- */
	}
	$json = json_encode($data);
	echo isset($_GET['callback']) ? "{$_GET['callback']}($json)" : $json;
	exit;
}
?>
