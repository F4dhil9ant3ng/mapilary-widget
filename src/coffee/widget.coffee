class MapilaryWidget

	# Default settings
	@_defaults: {
		allowedTravelModes: 'CAR'
		unitSystem: 'METRIC'
		wsUrl: 'https://ws.mapilary.com:443'
		deliveryServiceUrl: 'https://api.mapilary.com/v1/deliveries/find?trackingNr={trackingNr}'
		findPathUrl: 'http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/'
		tilesUrl: 'http://{s}.tiles.mapbox.com/v3/mapilary.hmal3hg1/{z}/{x}/{y}.png'
		attribution: '&copy; <a href=\"http://www.mapbox.com\">Mapbox</a>'
		center: [51.505, -0.09],
		zoom: 13
		maxZoom: 18,
		trackForm: true
	}

	@_trackFormTpl: '<form class="tracking-form" class="form-inline" role="form"><div><div class="form-group"><input type="text" name="trackingNr" class="trackingNr form-control" title="for demonstration enter DEMO as Tracking Nr." placeholder="Tracking Nr." autofocus></div><button class="btn btn-default btn-track" data-toggle="collapse" data-target=".bs-widget-frame" type="submit">TRACK</button></div></form>'

	@_mapTpl: '<div class="map-container"><div class="info-overlay" style="display:none"><div class="eta"><b>ETA</b> <span class="dynamic"></span></div><div class="info"></div><div class="client-position"><div><span>#<b class="dynamic"></b></span></div><div class="text">Waiting list position</div></div></div><div class="map"></div></div>'

	constructor: (_settings) ->
		@_titles = 0
		@_trackings = {}

		# Merge default settings with settings.
		@_settings = $.extend {}, @constructor._defaults, _settings
		@_$el = $ @_settings.el

	render: () ->
		settings = @_settings
		$el = @_$el

		$widget = @_$el.clone()
		$widget.empty()
		$widget.addClass 'mapilary-widget'
		@_$el = $widget

		if settings.trackForm 
			$widget.append @_renderTrackForm()
		$widget.append @constructor._mapTpl

		@_map = L.map($widget.find('.map')[0]).setView settings.center, settings.zoom
		@_featureGroup = L.featureGroup();
		L.tileLayer(settings.tilesUrl, {
			attribution: settings.attribution,
			maxZoom: settings.maxZoom
		}).addTo @_map
		L.control.locate().addTo @_map
		@_featureGroup.addTo @_map

		if settings.trackingNr
			this.trackDelivery(settings.trackingNr)
				.done () =>
					$el.replaceWith $widget
					@invalidateSize()
			return

		$el.replaceWith $widget
		@invalidateSize()
		this

	invalidateSize: () ->
		mapHeight = @_$el.height() - @_$el.find('.tracking-form').outerHeight(true) - 2
		@_$el.find('.map-container').height mapHeight
		@_map.invalidateSize()

	_renderTrackForm: () ->		
		$el = $ @constructor._trackFormTpl
		$el.find('button:submit').on 'click', (ev) =>
			ev.preventDefault()
			trackingNr = $(ev.target.form[0]).val().toUpperCase()
			@trackDelivery trackingNr
		$el
	
	_socketConnect: (trackingNr) ->
		driver = null
		socket = io.connect @_settings.wsUrl, {resource: 'socket.io'}
		socket.on 'connect', ->
			socket.emit 'subscribe', 'trackingNr:' + trackingNr
		socket.on 'position:update', (coords) =>
			latlng = new L.LatLng coords.latitude, coords.longitude
			if !driver
				driver = L.marker latlng, {
					icon: L.icon {
						iconUrl: 'images/driver-marker.png',
						iconSize: [40, 54],
						iconAnchor: [20, 54]
					}
				}
				@_featureGroup.addLayer driver
				@_map.fitBounds @_featureGroup, {padding: [15, 15]}
			else
				driver.setLatLng(latlng)

	trackDelivery: (trackingNr, callback) ->
		if !trackingNr
			alert('Please enter a tracking number to proceed');
			return
		$el = @_$el
		url = @_settings.deliveryServiceUrl.replace '{trackingNr}', trackingNr
		$.get url, (deliveries) =>
			delivery = deliveries.length && deliveries[0] || null
			if !delivery
				alert 'No delivery found with the tracking number: ' + trackingNr
				return

			if !(delivery.addresses && delivery.addresses.length > 0)
				alert 'Delivery has no drop address.'
				return

			coords = delivery.addresses[0].coords
			delivery.latlng = new L.LatLng coords.latitude, coords.longitude

			$el.addClass 'is-tracking'

			@_map.panTo delivery.latlng

			userMarker = L.marker delivery.latlng, {
				icon: L.icon {
					iconUrl: 'images/user-marker.png'
					iconSize: [40, 54]
					iconAnchor: [20, 54]
				}
			}
			@_featureGroup.addLayer userMarker

			@_socketConnect trackingNr

			# info-overlay stuff
			$overlay = $el.find '.info-overlay'
			$overlay.show()
			@_trackings[trackingNr] = {
				etd: delivery.etd
			}
			if delivery.etd
				eta = new Date(delivery.etd.date)
				$overlay.find('.eta .dynamic').html([eta.getHours(), eta.getMinutes()].join(':'))
				$overlay.find('.client-position .dynamic').html delivery.etd.orderNr


			$overlay.find('.info').html delivery.note

if (typeof module != 'undefined')
	module.exports = MapilaryWidget
else
	this.MapilaryWidget = MapilaryWidget