"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// var $  = require('jquery')
// var L  = require('leaflet')
// var io = require('socket.io-client')
// require('../vendor/L.Control.Locate.browserify')

function codeAddress(address) {
    var $def = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                var loc = results[0].geometry.location;
                return $def.resolve({
                    latitude: loc.lat(),
                    longitude: loc.lng()
                });
            } else {
                return $def.reject("No results found");
            }
        } else {
            return $def.reject("Geocoder failed due to: " + status);
        }
    });
    return $def.promise();
}

function calcETA(start, end) {
    var $def = $.Deferred();
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            var totalDistance = result.routes[0].legs[0].distance.text;
            var totalDuration = result.routes[0].legs[0].duration.text;
            // var totalDistance = 0
            // var totalDuration = 0
            // var legs = result.routes[0].legs
            // for(var i=0; i<legs.length; ++i) {
            //     totalDistance += legs[i].distance.value
            //     totalDuration += legs[i].duration.value
            // }
            $def.resolve({
                totalDistance: totalDistance,
                totalDuration: totalDuration
            });
        }
    });
    return $def.promise();
}

var MapilaryWidget = (function () {
    function MapilaryWidget(_settings) {
        _classCallCheck(this, MapilaryWidget);

        // this._titles = 0
        // this._trackings = {}
        this._rooms = [];

        //# Merge default settings with settings.
        this._settings = $.extend({}, this.constructor._defaults, _settings);
        this._$el = $(this._settings.el);
    }

    _createClass(MapilaryWidget, {
        render: {
            value: function render() {
                var _this = this;

                var settings = this._settings;
                var $el = this._$el;

                var $widget = this._$el.clone();
                $widget.empty();
                $widget.addClass("mapilary-widget");
                this._$el = $widget;

                if (settings.trackForm) {
                    $widget.append(this._renderTrackForm());
                }
                $widget.append(this.constructor._mapTpl);

                this._map = L.map($widget.find(".map")[0]).setView(settings.center, settings.zoom);
                this._featureGroup = L.featureGroup();
                L.tileLayer(settings.tilesUrl, {
                    attribution: settings.attribution,
                    maxZoom: settings.maxZoom
                }).addTo(this._map);
                L.control.locate().addTo(this._map);
                this._featureGroup.addTo(this._map);

                if (settings.trackingNr) {
                    this.trackDelivery(settings.trackingNr).done(function () {
                        $el.replaceWith($widget);
                        _this.invalidateSize();
                    });
                    return;
                }

                $el.replaceWith($widget);
                this.invalidateSize();
                return this;
            }
        },
        invalidateSize: {
            value: function invalidateSize() {
                var mapHeight = this._$el.height() - this._$el.find(".tracking-form").outerHeight(true) - 2;
                this._$el.find(".map-container").height(mapHeight);
                this._map.invalidateSize();
            }
        },
        _renderTrackForm: {
            value: function _renderTrackForm() {
                var _this = this;

                var $el = $(this.constructor._trackFormTpl);
                $el.find("button:submit").on("click", function (ev) {
                    ev.preventDefault();
                    var trackingNr = $(ev.target.form[0]).val(); //TODO: .toUpperCase()
                    _this.trackDelivery(trackingNr);
                });
                return $el;
            }
        },
        _socketSubscribe: {
            value: function _socketSubscribe(room) {
                var _this = this;

                var socket = this._socket;
                if (socket) {
                    this._rooms.push(room);
                    socket.emit("subscribe", room);
                    return socket;
                }
                socket = this._socket = io.connect(this._settings.wsUrl, { path: this._settings.wsPath });
                socket.on("connect", function () {
                    _this._rooms.push(room);
                    socket.emit("subscribe", room);
                });
                socket.on("error", function (err) {
                    console.error(err);
                });
                socket.on("position:update", function (pos) {
                    var driver = _this.driver;
                    var coords = pos.coords;
                    var latlng = new L.LatLng(coords.latitude, coords.longitude);
                    if (!driver) {
                        driver = _this.driver = _this._renderDriver(latlng);
                        _this._map.fitBounds(_this._featureGroup, { padding: [15, 15] });
                    } else {
                        driver.setLatLng(latlng);
                    }
                });
                return socket;
            }
        },
        _socketUnsubscribe: {
            value: function _socketUnsubscribe() {
                var socket = this._socket;
                if (socket && this._rooms.length) {
                    this._rooms.forEach(function (room) {
                        socket.emit("unsubscribe", room);
                    });
                    this._rooms = [];
                }
            }
        },
        trackDelivery: {
            value: function trackDelivery(trackingNr) {
                var _this = this;

                if (!trackingNr) {
                    alert("Please enter a tracking number to proceed");
                    return;
                }
                this._$el.find(".info-overlay").hide();
                this._socketUnsubscribe();
                this._featureGroup.clearLayers();
                var url = this._settings.deliveryServiceUrl.replace("{trackingNr}", trackingNr);
                $.get(url, function (delivery) {
                    if (!(delivery.addresses && delivery.addresses.length > 0)) {
                        alert("Delivery has no drop address.");
                        return;
                    }

                    var address = delivery.addresses[0];

                    if (delivery.lastPosition && delivery.lastPosition.coords) {
                        _this.driver = _this._renderDriver(delivery.lastPosition.coords);
                        _this._socketSubscribe("courier:" + delivery.lastPosition.courier);
                    }

                    if (address.coords) {
                        delivery.coords = address.coords;
                        _this._socketSubscribe("trackingNr:" + trackingNr);
                        _this._renderDelivery(delivery);
                        return;
                    }

                    if (!address.text) {
                        alert("Delivery has no drop address.");
                        return;
                    }

                    codeAddress(address.text).done(function (coords) {
                        delivery.coords = coords;
                        _this._socketSubscribe("trackingNr:" + trackingNr);
                        _this._renderDelivery(delivery);
                    });
                }).fail(function () {
                    alert("Delivery not found");
                });
            }
        },
        _renderDriver: {
            value: function _renderDriver(coords) {
                var latlng = new L.LatLng(coords.latitude, coords.longitude);
                var driver = L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: "images/driver-marker.png",
                        iconSize: [40, 54],
                        iconAnchor: [20, 54]
                    })
                });
                this._featureGroup.addLayer(driver);
                return driver;
            }
        },
        _renderDelivery: {
            value: function _renderDelivery(delivery) {
                var $el = this._$el;
                var coords = delivery.coords;
                var latlng = new L.LatLng(coords.latitude, coords.longitude);

                $el.addClass("is-tracking");

                var userMarker = L.marker(latlng, {
                    icon: L.icon({
                        iconUrl: "images/user-marker.png",
                        iconSize: [40, 54],
                        iconAnchor: [20, 54]
                    })
                });

                this._featureGroup.addLayer(userMarker);
                this._map.fitBounds(this._featureGroup, { padding: [30, 30] });

                //# info-overlay stuff
                var $overlay = $el.find(".info-overlay");
                $overlay.show();

                if (delivery.etd) {
                    eta = new Date(delivery.etd.date);
                    $overlay.find(".eta .dynamic").html([eta.getHours(), eta.getMinutes()].join(":"));
                    $overlay.find(".client-position .dynamic").html(delivery.etd.orderNr);
                } else {
                    var start = [delivery.lastPosition.coords.latitude, delivery.lastPosition.coords.longitude].join(",");
                    var end = [delivery.coords.latitude, delivery.coords.longitude].join(",");
                    calcETA(start, end).done(function (r) {
                        $overlay.find(".eta .dynamic").html(r.totalDuration);
                    });
                }
                $overlay.find(".info").html(delivery.note);
            }
        }
    });

    return MapilaryWidget;
})();

//# Default settings
MapilaryWidget._defaults = {
    allowedTravelModes: "CAR",
    unitSystem: "METRIC",
    wsUrl: "https://ws.mapilary.com:443",
    wsPath: "/socket.io",
    deliveryServiceUrl: "https://api.mapilary.com/v1/deliveries/find/{trackingNr}",
    findPathUrl: "http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/",
    tilesUrl: "https://{s}.tiles.mapbox.com/v3/mapilary.hmal3hg1/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"http://www.mapbox.com\">Mapbox</a>",
    center: [51.505, -0.09],
    zoom: 13,
    maxZoom: 18,
    trackForm: true
};

MapilaryWidget._trackFormTpl = "<form class=\"tracking-form\" class=\"form-inline\" role=\"form\"><div><div class=\"form-group\"><input type=\"text\" name=\"trackingNr\" class=\"trackingNr form-control\" title=\"for demonstration enter DEMO as Tracking Nr.\" placeholder=\"Tracking Nr.\" autofocus></div><button class=\"btn btn-default btn-track\" data-toggle=\"collapse\" data-target=\".bs-widget-frame\" type=\"submit\">TRACK</button></div></form>";
MapilaryWidget._mapTpl = "<div class=\"map-container\"><div class=\"info-overlay\" style=\"display:none\"><div class=\"eta\"><b>ETA</b> <span class=\"dynamic\"></span></div><div class=\"info\"></div><div class=\"client-position\"><div><span>#<b class=\"dynamic\"></b></span></div><div class=\"text\">Waiting list position</div></div></div><div class=\"map\"></div></div>";

if (typeof module != "undefined") module.exports = MapilaryWidget;else window.MapilaryWidget = MapilaryWidget;