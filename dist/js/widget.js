"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// var $  = require('jquery')
// var L  = require('leaflet')
// var io = require('socket.io-client')
// require('../vendor/L.Control.Locate.browserify')

var MapilaryWidget = (function () {
	function MapilaryWidget(_settings) {
		_classCallCheck(this, MapilaryWidget);

		this._titles = 0;
		this._trackings = {};

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
					var trackingNr = $(ev.target.form[0]).val().toUpperCase();
					_this.trackDelivery(trackingNr);
				});
				return $el;
			}
		},
		_socketConnect: {
			value: function _socketConnect(trackingNr) {
				var _this = this;

				var driver = null;
				var socket = io.connect(this._settings.wsUrl, { path: this._settings.wsPath });
				socket.on("connect", function () {
					socket.emit("subscribe", "trackingNr:" + trackingNr);
				});
				socket.on("position:update", function (pos) {
					var coords = pos.coords;
					var latlng = new L.LatLng(coords.latitude, coords.longitude);
					if (!driver) {
						driver = L.marker(latlng, {
							icon: L.icon({
								iconUrl: "images/driver-marker.png",
								iconSize: [40, 54],
								iconAnchor: [20, 54]
							})
						});
						_this._featureGroup.addLayer(driver);
						_this._map.fitBounds(_this._featureGroup, { padding: [15, 15] });
					} else {
						driver.setLatLng(latlng);
					}
				});
			}
		},
		trackDelivery: {
			value: function trackDelivery(trackingNr, callback) {
				var _this = this;

				if (!trackingNr) {
					alert("Please enter a tracking number to proceed");
					return;
				}
				var $el = this._$el;
				var url = this._settings.deliveryServiceUrl.replace("{trackingNr}", trackingNr);
				$.get(url, function (deliveries) {
					var delivery = deliveries.length && deliveries[0] || null;
					if (!delivery) {
						alert("No delivery found with the tracking number: " + trackingNr);
						return;
					}

					if (!(delivery.addresses && delivery.addresses.length > 0)) {
						alert("Delivery has no drop address.");
						return;
					}

					var coords = delivery.addresses[0].coords;
					delivery.latlng = new L.LatLng(coords.latitude, coords.longitude);

					$el.addClass("is-tracking");

					_this._map.panTo(delivery.latlng);

					var userMarker = L.marker(delivery.latlng, {
						icon: L.icon({
							iconUrl: "images/user-marker.png",
							iconSize: [40, 54],
							iconAnchor: [20, 54]
						})
					});
					_this._featureGroup.addLayer(userMarker);

					_this._socketConnect(trackingNr);

					//# info-overlay stuff
					var $overlay = $el.find(".info-overlay");
					$overlay.show();
					_this._trackings[trackingNr] = {
						etd: delivery.etd
					};
					if (delivery.etd) {
						eta = new Date(delivery.etd.date);
						$overlay.find(".eta .dynamic").html([eta.getHours(), eta.getMinutes()].join(":"));
						$overlay.find(".client-position .dynamic").html(delivery.etd.orderNr);
					}

					$overlay.find(".info").html(delivery.note);
				});
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
	deliveryServiceUrl: "https://api.mapilary.com/v1/deliveries/find?trackingNr={trackingNr}",
	findPathUrl: "http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/",
	tilesUrl: "http://{s}.tiles.mapbox.com/v3/mapilary.hmal3hg1/{z}/{x}/{y}.png",
	attribution: "&copy; <a href=\"http://www.mapbox.com\">Mapbox</a>",
	center: [51.505, -0.09],
	zoom: 13,
	maxZoom: 18,
	trackForm: true
};

MapilaryWidget._trackFormTpl = "<form class=\"tracking-form\" class=\"form-inline\" role=\"form\"><div><div class=\"form-group\"><input type=\"text\" name=\"trackingNr\" class=\"trackingNr form-control\" title=\"for demonstration enter DEMO as Tracking Nr.\" placeholder=\"Tracking Nr.\" autofocus></div><button class=\"btn btn-default btn-track\" data-toggle=\"collapse\" data-target=\".bs-widget-frame\" type=\"submit\">TRACK</button></div></form>";
MapilaryWidget._mapTpl = "<div class=\"map-container\"><div class=\"info-overlay\" style=\"display:none\"><div class=\"eta\"><b>ETA</b> <span class=\"dynamic\"></span></div><div class=\"info\"></div><div class=\"client-position\"><div><span>#<b class=\"dynamic\"></b></span></div><div class=\"text\">Waiting list position</div></div></div><div class=\"map\"></div></div>";

if (typeof module != "undefined") module.exports = MapilaryWidget;else window.MapilaryWidget = MapilaryWidget;
//# sourceMappingURL=widget.js.map