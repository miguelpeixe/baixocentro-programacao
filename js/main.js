var map, markersGroup, projects, filteredProjects, filteringOptions, categories, dates, hours;

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

		$('input#search').bind('keydown keyup keypress', function() {
			filteringOptions.search = $(this).val();
			filterProjects(filteringOptions);
			if(e.keyCode == 13)
				return false;
		});

		$('select#category').live('change', function() {
			filteringOptions.category = $(this).val();
			filterProjects(filteringOptions);
		});

		$('select#date').live('change', function() {
			filteringOptions.date = $(this).val();
			filterProjects(filteringOptions);
		});

		$('select#time').live('change', function() {
			filteringOptions.hour = $(this).val();
			filterProjects(filteringOptions);
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

		$('.clear-search').live('click', function() {
			$('input#search').val('');
			$('select#category').val('').trigger("liszt:updated");
			$('select#date').val('').trigger("liszt:updated");
			$('select#time').val('').trigger("liszt:updated");
			filteringOptions = {
				search: '',
				category: '',
				date: '',
				hour: ''
			};
			filterProjects(filteringOptions);
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
			projects = filteredProjects = data;
			buildMarkers(projects);
			buildList(projects);
			populateFilters();
			readFragments();
		});
	}

	function filterProjects(options) {
		// search
		filteredProjects = _.filter(projects, function(a) { return a.nome.toLowerCase().indexOf(options.search.toLowerCase()) != -1; });

		fragment.set({s: options.search});

		// category
		if(options.category && options.category.length) {
			var catfilteredProjects = [];
			_.each(options.category, function(category, i) {
				catfilteredProjects.push(_.filter(filteredProjects, function(a) { return a.cat.indexOf(category) != -1; }));
			});
			filteredProjects = _.flatten(catfilteredProjects);
			fragment.set({cat: options.category.join('|')});
		} else {
			fragment.rm('cat');
		}

		// date
		if(options.date && options.date.length) {
			var datefilteredProjects = [];
			_.each(options.date, function(date, i) {
				datefilteredProjects.push(_.filter(filteredProjects, function(a) { return a.data.indexOf(date) != -1; }));
			});
			filteredProjects = _.flatten(datefilteredProjects);
			fragment.set({date: options.date.join('|')});
		} else {
			fragment.rm('date');
		}

		// hour
		if(options.hour && options.hour.length) {
			var hourfilteredProjects = [];
			_.each(options.hour, function(hour, i) {
				hourfilteredProjects.push(_.filter(filteredProjects, function(a) { return a.hora.indexOf(hour) != -1; }));
			});
			filteredProjects = _.flatten(hourfilteredProjects);
			fragment.set({time: options.hour.join('|')});
		} else {
			fragment.rm('time');
		}

		// prevent duplicates
		var unique = {};
		_.each(filteredProjects, function(project, i) {
			unique[project.id] = project;
		});
		filteredProjects = [];
		for(key in unique) {
			filteredProjects.push(unique[key]);
		}


		buildMarkers(filteredProjects);
		buildList(filteredProjects);
	}

	function buildMarkers(projects) {
		markersGroup.clearLayers();
		_.each(projects, function(project, i) {
			if(project.lat && project.lng) {
				var marker = L.marker([project.lat, project.lng]).bindPopup('<h2>' + project.nome + '</h2>');
				marker.on('mouseover', function(e) {
					e.target.openPopup();
				});
				marker.on('mouseout', function(e) {
					e.target.closePopup();
				});
				marker.on('click', function(e) {
					openProject(project.id);
					return false;
				});
				markersGroup.addLayer(marker);
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
		fragment.set({'p': p.id});
	}

	function closeProject() {
		$('#project-page').hide();
		map.setView([-23.5369, -46.6478], 15);
		fragment.rm('p');
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

	var Fragment = function() {
		var f = {};
		var _set = function(query) {
			var hash = [];
			_.each(query, function(v, k) {
				hash.push(k + '=' + v);
			});
			document.location.hash = hash.join('&');
		};
		f.set = function(options) {
			_set(_.extend(f.get(), options));
		};
		f.get = function(key, defaultVal) {
			var vars = document.location.hash.substring(1).split('&');
			var hash = {};
			_.each(vars, function(v) {
				var pair = v.split("=");
				if (!pair[0] || !pair[1]) return;
				hash[pair[0]] = unescape(pair[1]);
				if (key && key == pair[0]) {
					defaultVal = hash[pair[0]];
				}
			});
			return key ? defaultVal : hash;
		};
		f.rm = function(key) {
			var hash = f.get();
			hash[key] && delete hash[key];
			_set(hash);
		};
		return f;
	};

	var fragment = Fragment();

	function readFragments() {
		if(fragment.get('p')) {
			openProject(fragment.get('p'));
		}
		if(fragment.get('s')) {
			$('input#search').val(fragment.get('s')).change();
			filteringOptions.search = fragment.get('s');
		}
		if(fragment.get('cat')) {
			$('select#category').val(fragment.get('cat').split('|')).trigger('liszt:updated');
			filteringOptions.category = fragment.get('cat').split('|');
		}
		if(fragment.get('date')) {
			$('select#date').val(fragment.get('date').split('|')).trigger('liszt:updated');
			filteringOptions.date = fragment.get('date').split('|');
		}
		if(fragment.get('time')) {
			$('select#time').val(fragment.get('time').split('|')).trigger('liszt:updated');
			filteringOptions.hour = fragment.get('time').split('|');
		}

		filterProjects(filteringOptions);
	}

})(jQuery);