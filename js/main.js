var map, markersGroup, activities, filteredActivities, filteringOptions, categories, dates, hours;

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
		loadActivities();

		$('input#search').bind('keydown keyup keypress', function(e) {
			filteringOptions.search = $(this).val();
			filterActivities(filteringOptions);
			if(e.keyCode == 13)
				return false;
		});

		$('select#category').live('change', function() {
			filteringOptions.category = $(this).val();
			filterActivities(filteringOptions);
		});

		$('select#date').live('change', function() {
			filteringOptions.date = $(this).val();
			filterActivities(filteringOptions);
		});

		$('select#time').live('change', function() {
			filteringOptions.hour = $(this).val();
			filterActivities(filteringOptions);
		});

		$('.open-activity').live('click', function() {
			var id = $(this).data('activity');
			if(id) {
				openActivity(id);
				return false;
			}
		});
	});

	function buildMap() {
		map = L.map('map').setView([-23.5369, -46.6478], 15);
		L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
			maxZoom: 18
		}).addTo(map);
		markersGroup = L.layerGroup().addTo(map);
	}

	function loadActivities() {
		$.getJSON('activities.php', function(data) {
			activities = filteredActivities = data;
			buildMarkers(activities);
			buildList(activities);
			populateFilters();
		});
	}

	function filterActivities(options) {
		// search
		filteredActivities = _.filter(activities, function(a) { return a.nome.toLowerCase().indexOf(options.search.toLowerCase()) != -1; });

		// category
		if(options.category && options.category.length) {
			var catFilteredActivities = [];
			_.each(options.category, function(category, i) {
				catFilteredActivities.push(_.filter(filteredActivities, function(a) { return a.cat.indexOf(category) != -1; }));
			});
			filteredActivities = _.flatten(catFilteredActivities);
		}

		// date
		if(options.date && options.date.length) {
			var dateFilteredActivities = [];
			_.each(options.date, function(date, i) {
				dateFilteredActivities.push(_.filter(filteredActivities, function(a) { return a.data.indexOf(date) != -1; }));
			});
			filteredActivities = _.flatten(dateFilteredActivities);
		}

		// hour
		if(options.hour && options.hour.length) {
			var hourFilteredActivities = [];
			_.each(options.hour, function(hour, i) {
				hourFilteredActivities.push(_.filter(filteredActivities, function(a) { return a.hora.indexOf(hour) != -1; }));
			});
			filteredActivities = _.flatten(hourFilteredActivities);
		}

		// prevent duplicates
		var unique = {};
		_.each(filteredActivities, function(activity, i) {
			unique[activity.id] = activity;
		});
		filteredActivities = [];
		for(key in unique) {
			filteredActivities.push(unique[key]);
		}


		buildMarkers(filteredActivities);
		buildList(filteredActivities);
	}

	function buildMarkers(activities) {
		markersGroup.clearLayers();
		_.each(activities, function(activity, i) {
			if(activity.lat && activity.lng) {
				markersGroup.addLayer(L.marker([activity.lat, activity.lng]).bindPopup('<h2>' + activity.nome + '</h2>'));
			}
		});
	}

	function populateFilters() {
		/*
		 * Categories
		 */
		_.each(activities, function(activity, i) {
			var category = activity.cat;
			if(!_.contains(categories, category))
				categories.push(category);
		});
		var template = '<select id="category" data-placeholder="Categorias" class="chzn-select" multiple><% _.each(categories, function(category, i) { %><option value="<%= category %>"><%= category %></option><% }); %></select>';
		$('#filters .categories').append($(_.template(template, categories)));

		/*
		 * Dates
		 */
		_.each(activities, function(activity, i) {
			var activityDates = activity.data;
			var activityDates = activityDates.split(',');
			_.each(activityDates, function(date, i) {
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
		_.each(activities, function(activity, i) {
			var hour = activity.hora;
			if(hour) {
				if(!_.contains(hours, hour))
					hours.push(hour);
			}
		});
		var template = '<select id="time" data-placeholder="Horários" class="chzn-select" multiple><% _.each(hours, function(hour, i) { %><option value="<%= hour %>"><%= hour %></option><% }); %></select>';
		$('#filters .time').append(_.template(template, hours));
	}

	function buildList(activities) {
		var template = '<ul><% _.each(activities, function(activity, i) { %><li class="open-activity" data-activity="<%= activity.id %>"><p class="category"><%= activity.cat %></p><h3><%= activity.nome %></h3></li><% }); %></ul>';
		$('#list').empty().html(_.template(template, activities));
	}

	function openActivity(activityID) {
		var activity = _.find(activities, function(a) { return a.id == activityID; });
		var template = '<h2><%= activity.nome %></h2>';
		$('#activity-page').empty().show().html(_.template(template, activity));
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