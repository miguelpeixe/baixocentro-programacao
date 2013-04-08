(function($) {

	var app = programacao;
	var config = app.config;

	app._data = {};
	app.filteringVals = {};

	app.start = function(containerID) {
		app.containerID = containerID;
		_start(containerID);
	};

	app.openItem = function(id) {

		$('#single-page .content').empty();
		$('#single-page').show();

		var item = _.find(app.data, function(item) { return item.id == id; });
		if(item) {
		
			var lat = item[config.dataRef.lat];
			var lng = item[config.dataRef.lng];
			var map = app.map;
			if(lat && lng)
				map.setView([lat, lng], config.map.maxZoom);
			else
				map.setView(config.map.center, config.map.zoom);

			if(config.singleSource && config.singleSource.url) {
				var singleSource = config.singleSource;
				var parameters = {};
				parameters[singleSource.id] = id;
				$('#single-page .content').html('<p class="loading">' + config.labels.loading.item + '</p>');
				$.getJSON(singleSource.url, parameters, function(data) {
					for(key in singleSource.get) {
						item[key] = data[key];
					}
					display(item);
				});
			} else {
				display(item);
			}
		}
		$('#single-page .close').click(function() {
			app.closeItem();
			return false;
		});

		$('#single-page .view-map').click(function() {
			viewMap();
			return false;
		});

		function display(item) {
			var template = _.template(config.templates.single);
			$('#single-page .content').html(template({item: item}));
			$('#single-page').removeClass('toggled');
			fragment.set({'p': item.id});
		}

		function viewMap() {
			var $page = $('#single-page');
			if(!$page.hasClass('toggled'))
				$('#single-page').addClass('toggled');
			else
				$('#single-page').removeClass('toggled');
		}

	}

	app.closeItem = function() {
		fragment.rm('p');
		$('#single-page').hide();
		app.map.setView(config.map.center, config.map.zoom);
	}

	app.filter = function(options) {

		var filteredData = app.data;

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

		if(config.map)
			_markers(filteredData);

		_itemListUpdate(filteredData);
	}

	var _start = function() {
		var $loading = $('<div id="loading">' + config.labels.loading.first + '</div>');
		var $header = $('<div id="header" />');
		$header.append($('<h1>' + config.labels.title + '</h1>' + '<h2>' + config.labels.subtitle + '</h2>'));
		if(config.nav) {
			$nav = $('<div class="nav" />');
			_.each(config.nav, function(item, i) {
				$nav.append('<a href="' + item.url + '" target="_blank" rel="external">' + item.title + '</a>');
			});
			$header.append($nav);
		}
		$(document).ready(function() {

			app.$ = $('#' + app.containerID);
			app.$.append($loading);
			app.$.append($header);

			if(config.map)
				_map();
			if(config.dataSource)
				_data();

		});
	}

	var _map = function() {
		var $map = $('<div class="map-container"><div id="map"></div></div>');
		app.$.append($map);
		var map = app.map = L.map('map');
		if(!fragment.get('p'))
			map.setView(config.map.center, config.map.zoom);
		L.tileLayer(config.map.tiles, {
			maxZoom: config.map.maxZoom
		}).addTo(map);
		map.markersGroup = L.layerGroup().addTo(map);
	}

	var _data = function() {
		$.getJSON(config.dataSource, function(data) {
			var $content = $('<div id="content"><div class="inner"></div></div>');
			app.$.append($content);
			app.map.invalidateSize(true); //reset map size
			app.data = data; // store data
			if(config.map)
				_markers(data);
			if(config.filters)
				_filters();
			_itemList(data);
			_readFragments();
			$('#loading').hide();
		});
	}

	var _markers = function(items) {
		var map = app.map;
		map.markersGroup.clearLayers();
		_.each(items, function(item, i) {
			var lat = item[config.dataRef.lat];
			var lng = item[config.dataRef.lng];
			if(lat && lng) {
				var template = _.template(config.templates.marker);
				var marker = L.marker([lat, lng]).bindPopup(template({item: item}));
				marker.on('mouseover', function(e) {
					e.target.openPopup();
				});
				marker.on('mouseout', function(e) {
					e.target.closePopup();
				});
				marker.on('click', function(e) {
					app.openItem(item[config.dataRef.id]);
					return false;
				});
				map.markersGroup.addLayer(marker);
			}
		});
	}

	var _filters = function() {

		var $filters = $('<div id="filters" class="clearfix"><p class="clear-search">' + config.labels.clear_search + '</p><h3>' + config.labels.filters + '</h3><div class="filters-container"></div></div>');
		app.$.find('#content .inner').append($filters);
		var $filtersContainer = app.$.find('#filters .filters-container');
		var filters = config.filters;
		var filtering = app.filteringVals;
		var data = app.data;

		var _storeFilter = function(group, val, filter) {
			if(filter.exclude && filter.exclude.length) {
				if(_.find(filter.exclude, function(exclude) { return exclude == val; }))
					return group;
			}
			if(!_.contains(group, val))
				group.push(val);
			return group;
		}

		_.each(filters, function(filter, i) {

			$filtersContainer.append('<div class="' + filter.name + ' filter"></div>');

			if(filter.type == 'text') {
				$filtersContainer.find('.filter.' + filter.name).html('<input type="text" placeholder="' + filter.title + '" id="' + filter.name + '" />');

				/* bind events */

				$('input#' + filter.name).bind('keyup', function(e) {
					filtering[filter.name] = $(this).val();
					app.filter(filtering);
					if(e.keyCode == 13)
						return false;
				});

			} else if(filter.type == 'multiple-select') {

				// populate filter
				var filterVals = app._data[filter.name] = [];
				_.each(data, function(item, i) {
					var filterVal = item[filter.sourceRef];
					if(filter.name == 'date' || filter.name == 'time') {
						filterVal = filterVal.split(',');
						_.each(filterVal, function(v, i) {
							filterVals = _storeFilter(filterVals, v, filter);
						});
					} else {
						filterVals = _storeFilter(filterVals, filterVal, filter);
					}
					filterVals = _.sortBy(filterVals, function(val) { return val; });
				});
				var template = _.template('<select id="' + filter.name + '" data-placeholder="' + filter.title + '" class="chzn-select" multiple><% _.each(vals, function(val, i) { %><option value="<%= val %>"><%= val %></option><% }); %></select>');
				$filtersContainer.find('.filter.' + filter.name).html(template({vals: filterVals}));

				/* bind events */

				$('select#' + filter.name).change(function() {
					filtering[filter.name] = $(this).val();
					app.filter(filtering);
				});
			}
		});
		$('.chzn-select').chosen();

		/* bind events */
		$filtersContainer.find('.clear-search').click(function() {
			_.each(config.filters, function(filter, i) {
				if(filter.type == 'text')
					$('input#' + filter.name).val('');
				else if(filter.type == 'multiple-select')
					$('input#' + filter.name).val('').trigger('liszt:updated');
			});
			app.filter();
			return false;
		});
	}

	var _itemList = function(items) {
		var $itemList = '<h3>' + config.labels.results + '</h3><div id="list"></div>';
		app.$.find('#content .inner').append($itemList);

		_itemListUpdate(items);

		var $singlePage = '<div id="single-page"><div class="actions"><p class="close">' + config.labels.close + '</p><p class="view-map">' + config.labels.view_map + '</p></div><div class="content"></div></div>';
		app.$.append($singlePage);
	}

	var _itemListUpdate = function(items) {
		var template = _.template('<ul><% _.each(items, function(item, i) { %><li class="open-item" data-itemid="<%= item.id %>">' + config.templates.list + '</li><% }); %></ul>');
		$('#list').html(template({items: items}));

		$('#list').find('.open-item').click(function() {
			var id = $(this).data('itemid');
			if(id) {
				app.openItem(id);
				return false;
			}
		});

		var _updateHeight = function() {
			var top = $('#content .inner').height() + 20;
			app.$.find('#list').css({top: top});
		}

		_updateHeight();

	}

	var _fragment = function() {
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

	var fragment = _fragment();

	var _readFragments = function() {

		if(config.filters) {
			var filtering = app.filteringVals;
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
		}

		if(fragment.get('p')) {
			app.openItem(fragment.get('p'));
		}

		app.filter(filtering);
	}

})(jQuery);