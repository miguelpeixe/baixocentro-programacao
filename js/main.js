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

		fragment.set({'p': id});

		var $page = $('#single-page');

		$page.find('.content').empty();
		$page.removeClass('toggled');
		$page.show();

		var item = _.find(app.data, function(item) { return item.id == id; });
		if(item) {
			var lat = item[config.dataRef.lat];
			var lng = item[config.dataRef.lng];
			var map = app.map;
			if(lat && lng)
				map.setView([lat, lng], config.map.maxZoom);
			else
				map.setView(config.map.center, config.map.zoom);

			if(config.itemSource && config.itemSource.url) {
				var itemSource = config.itemSource;
				var parameters = {};
				parameters[itemSource.idKey] = id;
				$page.find('.content').html('<p class="loading">' + config.labels.loading.item + '</p>');
				$.getJSON(itemSource.url, parameters, function(data) {
					for(key in itemSource.get) {
						item[key] = data[key];
					}
					display(item);
				});
			} else {
				display(item);
			}
		}

		var display = function(item) {
			var template = _.template(config.templates.single);
			$page.find('.content').html(template({item: item}));
		}

	}

	app.closeItem = function() {
		fragment.rm('p');
		$('#single-page').hide();
		app.map.setView(config.map.center, config.map.zoom);
	}

	app.filter = function(options) {

		var filteredData = app.data;

		_.each(config.filters, function(filter, i) {
			if(options instanceof Object) {
				var filtering = options[filter.name];
				if(filtering) {
					var fragmentData = {};
					if(typeof filtering === 'string') {
						filteredData = _.filter(filteredData, function(item) { if(item[filter.sourceRef]) return item[filter.sourceRef].toLowerCase().indexOf(filtering.toLowerCase()) != -1; });
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
			} else {
				fragment.rm(filter.name);
			}
		});

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

			if(config.dataSource)
				_data();
			if(config.map)
				_map();

		});
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

	var _map = function() {
		var $map = $('<div class="map-container"><div id="map"></div></div>');
		app.$.append($map);
		var map = app.map = L.map('map');
		if(!fragment.get('p'))
			map.setView(config.map.center, config.map.zoom);
		L.tileLayer(config.map.tiles, {
			maxZoom: config.map.maxZoom
		}).addTo(map);
		map.markersGroup = new L.MarkerClusterGroup()
		map.markersGroup.addTo(map);
		
		// create and store marker icons
		if(config.map.markers && config.map.markers.icons.length) {
			app._data.icons = [];
			var LeafIcon = L.Icon.extend({});
			_.each(config.map.markers.icons, function(icon, i) {
				app._data.icons.push(new LeafIcon(icon));
			});
		}
	}

	var _markers = function(items) {
		var map = app.map;
		map.markersGroup.clearLayers();
		_.each(items, function(item, i) {
			var lat = item[config.dataRef.lat];
			var lng = item[config.dataRef.lng];
			if(lat && lng) {
				var options = {};
				// mouseover template
				var template = _.template(config.templates.marker);
				// marker icon
				if(app._data.icons && app._data.icons.length) {
					var icons = app._data.icons;
					if(config.map.markers.type == 'random') {
						options.icon = icons[_.random(0, icons.length-1)];
					}
				}
				// create
				var marker = L.marker([lat, lng], options).bindPopup(template({item: item}));
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

			} else if(filter.type == 'multiple-select' || filter.type == 'select') {

				// populate filter
				var filterVals = app._data[filter.name] = [];
				if(filter.values) {
					filterVals = filter.values;
				} else {
					_.each(data, function(item, i) {
						var filterVal = item[filter.sourceRef];
						if(filter.split) {
							filterVal = filterVal.split(filter.split);
						}
						if(filterVal instanceof Array) {
							_.each(filterVal, function(v, i) {
								filterVals = _storeFilter(filterVals, v, filter);
							});
						} else {
							filterVals = _storeFilter(filterVals, filterVal, filter);
						}
						filterVals = _.sortBy(filterVals, function(val) { return val; });
					});
				}
				var multipleAttr = '';
				if(filter.type == 'multiple-select')
					multipleAttr = 'multiple';
				var template = _.template('<select id="' + filter.name + '" data-placeholder="' + filter.title + '" class="chzn-select" ' + multipleAttr + '><% _.each(vals, function(val, i) { %><option></option><option value="<%= val %>"><%= val %></option><% }); %></select>');
				$filtersContainer.find('.filter.' + filter.name).html(template({vals: filterVals}));

				app.$.find('select#' + filter.name).change(function() {
					filtering[filter.name] = $(this).val();
					app.filter(filtering);
				});
			}
		});

		$('.chzn-select').chosen({
			allow_single_deselect: true
		});

		app.$.find('.clear-search').click(function() {
			filtering = {};
			_.each(config.filters, function(filter, i) {
				var $field = app.$.find('.filter #' + filter.name);
				$field.val('');
				if(filter.type == 'multiple-select')
					$field.val([]);
				if(filter.type == 'multiple-select' || filter.type == 'select')
					$field.trigger("liszt:updated");
			});
			app.filter();
			return false;
		});
	}

	var _itemList = function(items) {
		var $itemList = '<h3>' + config.labels.results + '</h3><div id="list"></div>';
		app.$.find('#content .inner').append($itemList);

		_itemListUpdate(items);

		var $page = $('<div id="single-page"><div class="actions"><p class="close">' + config.labels.close + '</p><p class="view-map">' + config.labels.view_map + '</p></div><div class="content"></div></div>');
		app.$.append($page);

		var viewMap = function() {
			if(!$page.hasClass('toggled'))
				$page.addClass('toggled');
			else
				$page.removeClass('toggled');
		}

		$page.find('.close').click(function() {
			app.closeItem();
			return false;
		});

		$page.find('.view-map').click(function() {
			viewMap();
			return false;
		});
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