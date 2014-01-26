define ['leaflet', 'leaflet.locatecontrol', 'leaflet.awesome-markers', 'leaflet.plotter'], (L) ->

    class window.MapilaryWidget

        _titles: 0
        _map: null
        _featureGroup: null

        # Default settings
        _settings: {
            deliveryApikey: ''
            findPathApikey: ''
            region: 'sk/bratislava'
            allowedTravelModes: 'CAR'
            unitSystem: 'METRIC'
            wsUrl: 'https://ws.mapilary.com'
            deliveryServiceUrl: 'https://api.mapilary.com/v1/deliveries?'
            findPathUrl: 'http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/'
            tilesUrl: 'https://ssl_tiles.cloudmade.com/dfc00e1faff14a268dbebec543abfc29/997/256/{z}/{x}/{y}.png'
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
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
            url = @_settings.findPathUrl + @_settings.region
            params = {
                allowedTravelModes: @_settings.allowedTravelModes
                unitSystem: @_settings.unitSystem
                apiKey: @_settings.findPathApikey
                origin: origin
                destination: destination
            }
            $.get url, params, (matrix) =>
                steps = []
                if (matrix.paths && matrix.paths.length > 0 && matrix.paths[0].steps)
                    $.each matrix.paths[0].steps, (idx, step) ->
                        steps.push(step.startLocation.split(','))
                    plottedPolyline = L.Polyline.Plotter(steps, {
                        weight: 5
                    })
                    @_map.addLayer plottedPolyline
                return

        _socketConnect: (trackingNr, destination) ->
            driver = null
            socket = io.connect(@_settings.wsUrl, {resource: 'socket.io', query: 'apikey=' + @_settings.deliveryApikey})
            socket.on 'connect', ->
                socket.emit 'subscribe', 'trackingNr:' + trackingNr
            socket.on 'position:update', (data) =>
                coords = data.position.coords
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
            params = {
                trackingNr: trackingNr,
                apikey: @_settings.deliveryApikey
            }
            $.get @_settings.deliveryServiceUrl, params, (deliveries) =>
                delivery = deliveries[0]
                if delivery && delivery.deliveryAddresses && delivery.deliveryAddresses.length > 0
                    coords = delivery.deliveryAddresses[0].coords
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
