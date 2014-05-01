define ['leaflet', 'leaflet.locatecontrol', 'leaflet.awesome-markers', 'leaflet.plotter'], (L) ->

    class window.MapilaryWidget

        _titles: 0
        _map: null
        _featureGroup: null

        # Default settings
        _settings: {
            findPathApikey: ''
            allowedTravelModes: 'CAR'
            unitSystem: 'METRIC'
            wsUrl: 'https://ws.mapilary.com'
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
            map = null
            featureGroup = null
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
                    plottedPolyline = L.Polyline.Plotter(steps, {
                        weight: 5
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
                    truck = L.AwesomeMarkers.icon {
                        icon: 'truck'
                        markerColor: 'darkgreen'
                        prefix: 'fa'
                    }
                    driver = L.marker latlng, {
                        icon: truck
                    }
                    @_featureGroup.addLayer(driver)
                    if (@_settings.showPath)
                        origin = coords.latitude + ',' + coords.longitude
                        @_renderPath origin, destination
                else
                    driver.setLatLng(latlng)
                @_map.fitBounds @_featureGroup, {padding: [50, 50]}
                return

        trackDelivery: (trackingNr) ->
            url = @_settings.deliveryServiceUrl.replace('{trackingNr}', trackingNr)
            $.get url, (deliveries) =>
                delivery = deliveries[0]
                if delivery && delivery.addresses && delivery.addresses.length > 0
                    coords = delivery.addresses[0].coords
                    latlng = new L.LatLng(coords.latitude, coords.longitude)
                    @_map.panTo(latlng)
                    mapilaryIcon = L.icon {
                        iconUrl: 'images/mapilarymarker.png'
                        iconSize:     [34, 45]
                        # iconAnchor:   [22, 94]
                        # popupAnchor:  [-3, -76]
                    }
                    marker = L.marker latlng, {icon: mapilaryIcon}
                    destination = coords.latitude + ',' + coords.longitude
                    @_featureGroup.addLayer(marker);
                    @_socketConnect(trackingNr, destination)
