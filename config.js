var programacao = {};

/*
 * Data settings
 */
var config = {
	dataSource: 'projects.php',
	dataRef: {
		id: 'id',
		lat: 'lat',
		lng: 'lng'
	},
};

/*
 * Map settings
 */
config.map = {
	tiles: 'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
	center: [-23.5369, -46.6478],
	zoom: 14,
	maxZoom: 18
}

/*
 * Map markers settings
 */
config.map.markers = {
	type: 'random',
	icons: [
		{
			iconUrl: 'icons/blue.png',
			iconSize: [32,32],
			iconAnchor: [16,16],
			popupAnchor: [0,-5]
		},
		{
			iconUrl: 'icons/pink.png',
			iconSize: [32,32],
			iconAnchor: [16,16],
			popupAnchor: [0,-5]
		},
		{
			iconUrl: 'icons/yellow.png',
			iconSize: [32,32],
			iconAnchor: [16,16],
			popupAnchor: [0,-5]
		},
		{
			iconUrl: 'icons/green.png',
			iconSize: [32,32],
			iconAnchor: [16,16],
			popupAnchor: [0,-5]
		}
	]
};

/*
 * Item data source
 *
 * Data to load when viewing single item section
 * Sends ID value (dataRef.id) to custom idKey parameter
 */
config.itemSource = {
	url: 'projects.php',
	idKey: 'id', // id parameter to query item
	get: { // values to get from the source
		desc: 'desc'
	}
}

/*
 * Filters settings
 */
config.filters = [
	{
		name: 's',
		sourceRef: 'nome',
		type: 'text',
		title: 'Buscar por nome'
	},
	{
		name: 'cat',
		sourceRef: 'cat',
		type: 'multiple-select',
		title: 'Categorias'
	},
	{
		name: 'date',
		sourceRef: 'data',
		type: 'multiple-select',
		title: 'Datas',
		split: ',',
		values: [
			'05/04',
			'06/04',
			'07/04',
			'08/04',
			'09/04',
			'10/04',
			'11/04',
			'12/04',
			'13/04',
			'14/04'
		]
	},
	{
		name: 'time',
		sourceRef: 'hora',
		type: 'multiple-select',
		split: ',',
		title: 'Horários'
	},
	{
		name: 'place',
		sourceRef: 'local',
		type: 'multiple-select',
		title: 'Locais'
	}
];

/*
 * App templates
 */
config.templates = {
	list: '<p class="category"><%= item.cat %></p><h3><%= item.nome %></h3>',
	single: '<p class="cat"><%= item.cat %></p><h2><%= item.nome %></h2><h3><%= item.data %></h3><h3><%= item.hora %></h3><p class="local">Local: <span><%= item.local %></span></p><p><%= item.desc %></p>',
	marker: '<p class="meta"><span class="cat"><%= item.cat %></span></p><h2><%= item.nome %></h2><p class="meta"><span class="data"><%= item.data %></span> <span class="time"><%= item.hora %></span></p>'
};

/*
 * App labels
 */
config.labels = {
	title: 'BaixoCentro',
	subtitle: '//Programação2013',
	filters: 'Filtros',
	results: 'Resultados',
	clear_search: 'Limpar busca',
	close: 'Fechar',
	view_map: 'Ver mapa',
	loading: {
		first: 'Carregando projetos...',
		item: 'Carregando...'
	}
};

/*
 * App navigation
 */
config.nav = [
	{
		title: 'Site oficial',
		url: 'http://baixocentro.org/'
	},
	{
		title: 'Cobertura Colaborativa',
		url: 'http://muro.baixocentro.org/'
	}
];

// store config
programacao.config = config;