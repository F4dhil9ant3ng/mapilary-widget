define ['jquery', 'leaflet', 'socketio', 'leaflet.locatecontrol'], ($, L, io) ->

    class window.MapilaryWidget

        _titles: 0
        _map: null
        _featureGroup: null

        # Default settings
        _settings: {
            apikey: ''
            apiUrl: 'https://api.mapilary.com/v1/deliveries?'
            wsUrl: 'https://ws.mapilary.com'
            tilesUrl: 'https://ssl_tiles.cloudmade.com/dfc00e1faff14a268dbebec543abfc29/997/256/{z}/{x}/{y}.png'
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
            view: [51.505, -0.09],
            zoom: 13
            maxZoom: 18
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

        _socketConnect: (trackingNr) ->
            driver = null
            socket = io.connect(@_settings.wsUrl, {resource: 'socket.io', query: 'apikey=' + @_settings.apikey})
            socket.on 'connect', ->
                socket.emit 'subscribe', 'trackingNr:' + trackingNr
            socket.on 'position:update', (data) =>
                coords = data.position.coords
                latlng = new L.LatLng(coords.latitude, coords.longitude)
                if !driver
                    driver = new L.CircleMarker(latlng, {
                        radius: 8,
                        fillColor: "blue",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 1,
                    })
                    @_featureGroup.addLayer(driver)
                else
                    driver.setLatLng(latlng)
                @_map.fitBounds(@_featureGroup);
                return

        renderDelivery: (trackingNr) ->
            params = {
                trackingNr: trackingNr,
                apikey: @_settings.apikey
            }
            $.get @_settings.apiUrl, params, (deliveries) =>
                driver = null
                delivery = deliveries[0]
                if delivery && delivery.deliveryAddresses && delivery.deliveryAddresses.length > 0
                    coords = delivery.deliveryAddresses[0].coords
                    latlng = new L.LatLng(coords.latitude, coords.longitude)
                    @_map.panTo(latlng)
                    circle = new L.CircleMarker(latlng, {
                        radius: 8,
                        fillColor: "green",
                        color: "#000",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1,
                    })
                    @_featureGroup.addLayer(circle);
                    @_socketConnect(trackingNr)
