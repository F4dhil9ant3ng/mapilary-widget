define [
	'leaflet',
	'leaflet.locatecontrol',
	'leaflet.awesome-markers'
	# 'jquery',
	# 'moment',
], (L) ->

	class MapilaryWidget

		_titles: 0
		_map: null
		_featureGroup: null
		_trackings: {}

		# Default settings
		_settings: {
			findPathApikey: ''
			allowedTravelModes: 'CAR'
			unitSystem: 'METRIC'
			wsUrl: 'https://ws.mapilary.com:443'
			deliveryServiceUrl: 'https://api.mapilary.com/v1/deliveries/find?trackingNr={trackingNr}'
			findPathUrl: 'http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/'
			tilesUrl: 'http://{s}.tiles.mapbox.com/v3/mapilary.hmal3hg1/{z}/{x}/{y}.png'
			attribution: '&copy; <a href=\"http://www.mapbox.com\">Mapbox</a>'
			view: [51.505, -0.09],
			zoom: 13
			maxZoom: 18,
			showPath: true
		}

		constructor: (@el, @options) ->
			# Merge default settings with options.
			settings = $.extend @_settings, options
			@_map = L.map(el).setView(settings.view, settings.zoom)
			# map = L.map('map').setView([51.505, -0.09], 13)
			@_featureGroup = L.featureGroup();
			L.tileLayer(settings.tilesUrl, {
				attribution: settings.attribution,
				maxZoom: settings.maxZoom
			}).addTo(@_map)
			L.control.locate().addTo(@_map)
			@_featureGroup.addTo(@_map)

		_renderPath: (origin, destination) ->
			url = @_settings.findPathUrl
			params = {
				allowedTravelModes: @_settings.allowedTravelModes
				unitSystem: @_settings.unitSystem
				apiKey: @_settings.findPathApikey
				origin: origin
				destination: destination
			}
			$.get url, params, (matrix) =>
				steps = []
				if (matrix.status == 'OK')
					$.each matrix.paths[0].legs[0].steps, (idx, step) ->
						steps.push(step.location)
					plottedPolyline = L.polyline(steps, {
						color: 'red'
					})
					@_map.addLayer plottedPolyline
				return

		_socketConnect: (trackingNr, destination) ->
			driver = null
			socket = io.connect(@_settings.wsUrl, {resource: 'socket.io'})
			socket.on 'connect', ->
				socket.emit 'subscribe', 'trackingNr:' + trackingNr
			socket.on 'position:update', (coords) =>
				latlng = new L.LatLng(coords.latitude, coords.longitude)
				if !driver
					driver = L.marker latlng, {
						icon: L.icon {
							iconUrl: 'images/driver-marker.png',
							iconSize: [40, 54],
							iconAnchor: [20, 54]
						}
					}
					@_featureGroup.addLayer(driver)
					if (@_settings.showPath)
						origin = coords.latitude + ',' + coords.longitude
						@_renderPath origin, destination
				else
					driver.setLatLng(latlng)
				@_map.fitBounds @_featureGroup, {padding: [15, 15]}
				return

		trackDelivery: (trackingNr) ->
			if !trackingNr
				alert('Please enter a tracking number to proceed');
				return
			url = @_settings.deliveryServiceUrl.replace('{trackingNr}', trackingNr)
			$.get url, (deliveries) =>
				if !deliveries.length
					alert('No delivery found with the tracking number: '+ trackingNr)
					return
				delivery = deliveries[0]
				if delivery && delivery.addresses && delivery.addresses.length > 0

					$('body').addClass('is-tracking');

					coords = delivery.addresses[0].coords
					latlng = new L.LatLng(coords.latitude, coords.longitude)
					@_map.panTo(latlng)

					destination = coords.latitude + ',' + coords.longitude

					userMarker = L.marker latlng, {
						icon: L.icon {
							iconUrl: 'images/user-marker.png'
							iconSize: [40, 54]
							iconAnchor: [20, 54]
						}
					}
					@_featureGroup.addLayer(userMarker);

					@_socketConnect(trackingNr, destination)

					# info-overlay stuff
					$infoOverlay = $('#info-overlay');
					$infoOverlay.addClass('show');
					@_trackings[trackingNr] = {
						etd: delivery.etd
					}
					if delivery.etd
						eta = moment(delivery.etd.date).format('HH:mm');
						$infoOverlay.find('.eta .dynamic').html(eta);
						$infoOverlay.find('.client-position .dynamic').html(delivery.etd.orderNr);


					$infoOverlay.find('.info').html(delivery.note);