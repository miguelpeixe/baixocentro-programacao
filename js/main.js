(function($) {

	var config = programacao.config;

	programacao._data = {};
	programacao.filteringVals = {};

	programacao.open = function(id) {
		var item = _.find(programacao.data, function(item) { return item.id == id; });
		if(item) {
			var lat = item[config.dataRef.lat];
			var lng = item[config.dataRef.lng];
			if(lat && lng)
				programacao.map.setView([lat, lng], config.map.maxZoom);
			else
				programacao.map.setView(config.map.center, config.map.zoom)

			var template = _.template(config.templates.single);
			$('#single-page .content').html(template({item: item}));
			$('#single-page').removeClass('toggled');
			$('#single-page').show();
			fragment.set({'p': item.id});
		}
	}

	programacao.close = function() {
		fragment.rm('p');
		$('#single-page').hide();
		programacao.map.setView(config.map.center, config.map.zoom);
	}

	programacao.filter = function(options) {

		var filteredData = programacao.data;

		if(options instanceof Object) {
			_.each(config.filters, function(filter, i) {
				var filtering = options[filter.name];
				if(filtering) {
					var fragmentData = {};
					if(typeof filtering === 'string') {
						filteredData = _.filter(filteredData, function(item) { return item[filter.sourceRef].toLowerCase().indexOf(filtering.toLowerCase()) != -1; });
						fragmentData[filter.name] = filtering;
					} else if(filtering instanceof Array) {
						var optionsFiltered = [];
						_.each(filtering, function(option, i) {
							optionsFiltered.push(_.filter(filteredData, function(item) { if(item[filter.sourceRef]) return item[filter.sourceRef].indexOf(option) != -1; }));
						});
						filteredData = _.flatten(optionsFiltered);
						fragmentData[filter.name] = filtering.join('|');
					}
					fragment.set(fragmentData);
				} else {
					fragment.rm(filter.name);
				}
			});
		}

		// prevent duplicates
		var unique = {};
		_.each(filteredData, function(item, i) {
			unique[item.id] = item;
		});
		filteredData = [];
		for(key in unique) {
			filteredData.push(unique[key]);
		}

		_buildMarkers(filteredData);
		_buildItemList(filteredData);
	}

	$(document).ready(function() {
		_buildMap();
		_loadData();

		$('.open-item').live('click', function() {
			var id = $(this).data('itemid');
			if(id) {
				programacao.open(id);
				return false;
			}
		});

		$('#single-page .close').live('click', function() {
			programacao.close();
			return false;
		});

		$('#single-page .view-map').live('click', function() {
			viewMap();
			return false;
		});

		$('.clear-search').live('click', function() {
			_.each(config.filters, function(filter, i) {
				if(filter.type == 'text')
					$('input#' + filter.name).val('');
				else if(filter.type == 'multiple-select')
					$('input#' + filter.name).val('').trigger('liszt:updated');
			});
			programacao.filter();
			return false;
		});

	});

	function _loadData() {
		$.getJSON(programacao.config.dataSource, function(data) {
			programacao.map.invalidateSize(true); //reset map size
			programacao.data = data; // store data
			_buildMarkers(data);
			_buildItemList(data);
			_buildFilters();
			_readFragments();
			$('#loading').hide();
		});
	}

	function _buildMap() {
		var map = programacao.map = L.map('map');
		if(!fragment.get('p'))
			map.setView(config.map.center, config.map.zoom);
		L.tileLayer(config.map.tiles, {
			maxZoom: config.map.maxZoom
		}).addTo(map);
		map.markersGroup = L.layerGroup().addTo(map);
	}

	function _buildMarkers(items) {
		var map = programacao.map;
		map.markersGroup.clearLayers();
		_.each(items, function(item, i) {
			var lat = item[programacao.config.dataRef.lat];
			var lng = item[programacao.config.dataRef.lng];
			if(lat && lng) {
				var template = _.template(programacao.config.templates.marker);
				var marker = L.marker([lat, lng]).bindPopup(template({item: item}));
				marker.on('mouseover', function(e) {
					e.target.openPopup();
				});
				marker.on('mouseout', function(e) {
					e.target.closePopup();
				});
				marker.on('click', function(e) {
					programacao.open(item[programacao.config.dataRef.id]);
					return false;
				});
				map.markersGroup.addLayer(marker);
			}
		});
	}

	function _buildFilters() {
		var $filtersContainer = $(config.containers.filters);
		var filters = config.filters;
		var filtering = programacao.filteringVals;
		var data = programacao.data;
		_.each(filters, function(filter, i) {

			$filtersContainer.append('<div class="' + filter.name + ' filter"></div>');

			if(filter.type == 'text') {
				$filtersContainer.find('.filter.' + filter.name).html('<input type="text" placeholder="' + filter.title + '" id="' + filter.name + '" />');

				/* bind events */

				$('input#' + filter.name).bind('keyup', function(e) {
					filtering[filter.name] = $(this).val();
					programacao.filter(filtering);
					if(e.keyCode == 13)
						return false;
				});

			} else if(filter.type == 'multiple-select') {

				// populate filter
				var filterVals = programacao._data[filter.name] = [];
				_.each(data, function(item, i) {
					var filterVal = item[filter.sourceRef];
					if(filter.name == 'date' || filter.name == 'time') {
						filterVal = filterVal.split(',');
						_.each(filterVal, function(v, i) {
							if(!_.contains(filterVals, v))
								filterVals.push(v);
						});
					} else {
						if(!_.contains(filterVals, filterVal))
							filterVals.push(filterVal);
					}
				});
				var template = _.template('<select id="' + filter.name + '" data-placeholder="' + filter.title + '" class="chzn-select" multiple><% _.each(vals, function(val, i) { %><option value="<%= val %>"><%= val %></option><% }); %></select>');
				$filtersContainer.find('.filter.' + filter.name).html(template({vals: filterVals}));

				/* bind events */

				$('select#' + filter.name).live('change', function() {
					filtering[filter.name] = $(this).val();
					programacao.filter(filtering);
				});
			}
		});
		$('.chzn-select').chosen();
	}

	function _buildItemList(items) {
		var template = _.template('<ul><% _.each(items, function(item, i) { %><li class="open-item" data-itemid="<%= item.id %>">' + config.templates.list + '</li><% }); %></ul>');
		$('#list').html(template({items: items}));
	}

	function viewMap() {
		var $page = $('#single-page');
		if(!$page.hasClass('toggled'))
			$('#single-page').addClass('toggled');
		else
			$('#single-page').removeClass('toggled');
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

	function _readFragments() {

		var filtering = programacao.filteringVals;

		_.each(config.filters, function(filter, i) {
			if(fragment.get(filter.name)) {
				var val = fragment.get(filter.name);
				if(val.indexOf('|') != -1)
					val = val.split('|');

				var $input = $('.filter #' + filter.name);

				$input.val(val);
				if($input.is('select'))
					$input.trigger('liszt:updated');

				filtering[filter.name] = val;
			}
		});
		if(fragment.get('p')) {
			programacao.open(fragment.get('p'));
		}

		programacao.filter(filtering);
	}

	var fragment = Fragment();

})(jQuery);