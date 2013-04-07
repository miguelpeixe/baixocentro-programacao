var map, markersGroup, projects, filteredprojects, filteringOptions, categories, dates, hours;

(function($) {

	filteringOptions = {
		search: '',
		category: '',
		date: '',
		hour: ''
	};

	categories = [];
	dates = [];
	hours = [];

	$(document).ready(function() {
		buildMap();
		loadprojects();

		$('input#search').bind('keydown keyup keypress', function(e) {
			filteringOptions.search = $(this).val();
			filterprojects(filteringOptions);
			if(e.keyCode == 13)
				return false;
		});

		$('select#category').live('change', function() {
			filteringOptions.category = $(this).val();
			filterprojects(filteringOptions);
		});

		$('select#date').live('change', function() {
			filteringOptions.date = $(this).val();
			filterprojects(filteringOptions);
		});

		$('select#time').live('change', function() {
			filteringOptions.hour = $(this).val();
			filterprojects(filteringOptions);
		});

		$('.open-project').live('click', function() {
			var id = $(this).data('project');
			if(id) {
				openProject(id);
				return false;
			}
		});

		$('#project-page .close').live('click', function() {
			closeProject();
			return false;
		});

		$('#project-page .view-map').live('click', function() {
			viewMap();
			return false;
		});

	});

	function buildMap() {
		map = L.map('map').setView([-23.5369, -46.6478], 15);
		L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
			maxZoom: 18
		}).addTo(map);
		markersGroup = L.layerGroup().addTo(map);
	}

	function loadprojects() {
		$.getJSON('projects.php', function(data) {
			map.invalidateSize(true);
			projects = filteredprojects = data;
			buildMarkers(projects);
			buildList(projects);
			populateFilters();
		});
	}

	function filterprojects(options) {
		// search
		filteredprojects = _.filter(projects, function(a) { return a.nome.toLowerCase().indexOf(options.search.toLowerCase()) != -1; });

		// category
		if(options.category && options.category.length) {
			var catFilteredprojects = [];
			_.each(options.category, function(category, i) {
				catFilteredprojects.push(_.filter(filteredprojects, function(a) { return a.cat.indexOf(category) != -1; }));
			});
			filteredprojects = _.flatten(catFilteredprojects);
		}

		// date
		if(options.date && options.date.length) {
			var dateFilteredprojects = [];
			_.each(options.date, function(date, i) {
				dateFilteredprojects.push(_.filter(filteredprojects, function(a) { return a.data.indexOf(date) != -1; }));
			});
			filteredprojects = _.flatten(dateFilteredprojects);
		}

		// hour
		if(options.hour && options.hour.length) {
			var hourFilteredprojects = [];
			_.each(options.hour, function(hour, i) {
				hourFilteredprojects.push(_.filter(filteredprojects, function(a) { return a.hora.indexOf(hour) != -1; }));
			});
			filteredprojects = _.flatten(hourFilteredprojects);
		}

		// prevent duplicates
		var unique = {};
		_.each(filteredprojects, function(project, i) {
			unique[project.id] = project;
		});
		filteredprojects = [];
		for(key in unique) {
			filteredprojects.push(unique[key]);
		}


		buildMarkers(filteredprojects);
		buildList(filteredprojects);
	}

	function buildMarkers(projects) {
		markersGroup.clearLayers();
		_.each(projects, function(project, i) {
			if(project.lat && project.lng) {
				markersGroup.addLayer(L.marker([project.lat, project.lng]).bindPopup('<h2>' + project.nome + '</h2>'));
			}
		});
	}

	function populateFilters() {
		/*
		 * Categories
		 */
		_.each(projects, function(project, i) {
			var category = project.cat;
			if(!_.contains(categories, category))
				categories.push(category);
		});
		var template = '<select id="category" data-placeholder="Categorias" class="chzn-select" multiple><% _.each(categories, function(category, i) { %><option value="<%= category %>"><%= category %></option><% }); %></select>';
		$('#filters .categories').append($(_.template(template, categories)));

		/*
		 * Dates
		 */
		_.each(projects, function(project, i) {
			var projectDates = project.data;
			var projectDates = projectDates.split(',');
			_.each(projectDates, function(date, i) {
				if(date) {
					date = fixDate(date);
					if(!_.contains(dates, date))
						dates.push(date);
				}
			});
		});
		var template = '<select id="date" data-placeholder="Datas" class="chzn-select" multiple><% _.each(dates, function(date, i) { %><option value="<%= date %>"><%= date %></option><% }); %></select>';
		$('#filters .date').append(_.template(template, dates));

		/*
		 * Hours
		 */
		_.each(projects, function(project, i) {
			var hour = project.hora;
			if(hour) {
				if(!_.contains(hours, hour))
					hours.push(hour);
			}
		});
		var template = '<select id="time" data-placeholder="Horários" class="chzn-select" multiple><% _.each(hours, function(hour, i) { %><option value="<%= hour %>"><%= hour %></option><% }); %></select>';
		$('#filters .time').append(_.template(template, hours));

		$('.chzn-select').chosen();
	}

	function buildList(p) {
		var template = _.template('<ul><% _.each(projects, function(project, i) { %><li class="open-project" data-project="<%= project.id %>"><p class="category"><%= project.cat %></p><h3><%= project.nome %></h3></li><% }); %></ul>');
		$('#list').html(template({projects: p}));
	}

	function openProject(projectID) {
		var p = _.find(projects, function(a) { return a.id == projectID; });
		var template = _.template('<p class="cat"><%= project.cat %></p><h2><%= project.nome %></h2><h3><%= project.data %></h3><h3><%= project.hora %></h3><p class="local">Local: <span><%= project.local %></span></p>');
		if(p.lat && p.lng)
			map.setView([p.lat, p.lng], 18);
		$('#project-page .content').html(template({project: p}));
		$('#project-page').show();
	}

	function closeProject() {
		$('#project-page').hide();
		map.setView([-23.5369, -46.6478], 15);
	}

	function viewMap() {
		var $projectPage = $('#project-page');
		if(!$projectPage.hasClass('toggled'))
			$('#project-page').addClass('toggled');
		else
			$('#project-page').removeClass('toggled');
	}

	function fixDate(date) {

		// clear years (and buggy years)
		date = date.replace('/2013', '');
		date = date.replace('/2012/2013', '');
		date = date.replace('/2018', '');
		date = date.replace('/2024', '');
		date = date.replace('/2012', '');

		// add 0 prefix to 1 length day/month
		var separatedVals = date.split('/');
		if(separatedVals) {
			if(separatedVals[0].length === 1)
				separatedVals[0] = '0' + separatedVals[0];
			if(separatedVals[1].length === 1)
				separatedVals[1] = '0' + separatedVals[1];
			date = separatedVals.join('/');
		}

		return date;
	}

})(jQuery);