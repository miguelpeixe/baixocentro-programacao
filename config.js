var programacao = {};

programacao.config = {
	dataSource: 'projects.php',
	singleSource: {
		url: 'projects.php',
		id: 'id',
		get: {
			desc: 'desc'
		}
	},
	dataRef: {
		id: 'id',
		lat: 'lat',
		lng: 'lng'
	},
	map: {
		tiles: 'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
		center: [-23.5369, -46.6478],
		zoom: 14,
		maxZoom: 18
	},
	filters: [
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
			exclude: [
				'01/01',
				'05/02',
				'06/02',
				'07/02',
				'07/03',
				'08/03',
				'12/03',
				'13/02',
				'14/02',
				'23/02'
			]
		},
		{
			name: 'time',
			sourceRef: 'hora',
			type: 'multiple-select',
			title: 'Horários'
		},
		{
			name: 'place',
			sourceRef: 'local',
			type: 'multiple-select',
			title: 'Locais'
		}
	],
	templates: {
		list: '<p class="category"><%= item.cat %></p><h3><%= item.nome %></h3>',
		single: '<p class="cat"><%= item.cat %></p><h2><%= item.nome %></h2><h3><%= item.data %></h3><h3><%= item.hora %></h3><p class="local">Local: <span><%= item.local %></span></p><p><%= item.desc %></p>',
		marker: '<p class="meta"><span class="cat"><%= item.cat %></span></p><h2><%= item.nome %></h2><p class="meta"><span class="data"><%= item.data %></span> <span class="time"><%= item.hora %></span></p>'
	},
	labels: {
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
	},
	nav: [
		{
			title: 'Site oficial',
			url: 'http://baixocentro.org/'
		},
		{
			title: 'Cobertura Colaborativa',
			url: 'http://muro.baixocentro.org/'
		}
	]
}