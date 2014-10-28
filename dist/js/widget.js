(function() {
  var MapilaryWidget;

  MapilaryWidget = (function() {
    MapilaryWidget._defaults = {
      allowedTravelModes: 'CAR',
      unitSystem: 'METRIC',
      wsUrl: 'https://ws.mapilary.com:443',
      deliveryServiceUrl: 'https://api.mapilary.com/v1/deliveries/find?trackingNr={trackingNr}',
      findPathUrl: 'http://ec2-54-194-157-122.eu-west-1.compute.amazonaws.com/pathfinding/',
      tilesUrl: 'http://{s}.tiles.mapbox.com/v3/mapilary.hmal3hg1/{z}/{x}/{y}.png',
      attribution: '&copy; <a href=\"http://www.mapbox.com\">Mapbox</a>',
      center: [51.505, -0.09],
      zoom: 13,
      maxZoom: 18,
      trackForm: true
    };

    MapilaryWidget._trackFormTpl = '<form class="tracking-form" class="form-inline" role="form"><div><div class="form-group"><input type="text" name="trackingNr" class="trackingNr form-control" title="for demonstration enter DEMO as Tracking Nr." placeholder="Tracking Nr." autofocus></div><button class="btn btn-default btn-track" data-toggle="collapse" data-target=".bs-widget-frame" type="submit">TRACK</button></div></form>';

    MapilaryWidget._mapTpl = '<div class="map-container"><div class="info-overlay" style="display:none"><div class="eta"><b>ETA</b> <span class="dynamic"></span></div><div class="info"></div><div class="client-position"><div><span>#<b class="dynamic"></b></span></div><div class="text">Waiting list position</div></div></div><div class="map"></div></div>';

    function MapilaryWidget(_settings) {
      this._titles = 0;
      this._trackings = {};
      this._settings = $.extend({}, this.constructor._defaults, _settings);
      this._$el = $(this._settings.el);
    }

    MapilaryWidget.prototype.render = function() {
      var $el, $widget, settings;
      settings = this._settings;
      $el = this._$el;
      $widget = this._$el.clone();
      $widget.empty();
      $widget.addClass('mapilary-widget');
      this._$el = $widget;
      if (settings.trackForm) {
        $widget.append(this._renderTrackForm());
      }
      $widget.append(this.constructor._mapTpl);
      this._map = L.map($widget.find('.map')[0]).setView(settings.center, settings.zoom);
      this._featureGroup = L.featureGroup();
      L.tileLayer(settings.tilesUrl, {
        attribution: settings.attribution,
        maxZoom: settings.maxZoom
      }).addTo(this._map);
      L.control.locate().addTo(this._map);
      this._featureGroup.addTo(this._map);
      if (settings.trackingNr) {
        this.trackDelivery(settings.trackingNr).done((function(_this) {
          return function() {
            $el.replaceWith($widget);
            return _this.invalidateSize();
          };
        })(this));
        return;
      }
      $el.replaceWith($widget);
      this.invalidateSize();
      return this;
    };

    MapilaryWidget.prototype.invalidateSize = function() {
      var mapHeight;
      mapHeight = this._$el.height() - this._$el.find('.tracking-form').outerHeight(true) - 2;
      this._$el.find('.map-container').height(mapHeight);
      return this._map.invalidateSize();
    };

    MapilaryWidget.prototype._renderTrackForm = function() {
      var $el;
      $el = $(this.constructor._trackFormTpl);
      $el.find('button:submit').on('click', (function(_this) {
        return function(ev) {
          var trackingNr;
          ev.preventDefault();
          trackingNr = $(ev.target.form[0]).val().toUpperCase();
          return _this.trackDelivery(trackingNr);
        };
      })(this));
      return $el;
    };

    MapilaryWidget.prototype._socketConnect = function(trackingNr) {
      var driver, socket;
      driver = null;
      socket = io.connect(this._settings.wsUrl, {
        resource: 'socket.io'
      });
      socket.on('connect', function() {
        return socket.emit('subscribe', 'trackingNr:' + trackingNr);
      });
      return socket.on('position:update', (function(_this) {
        return function(coords) {
          var latlng;
          latlng = new L.LatLng(coords.latitude, coords.longitude);
          if (!driver) {
            driver = L.marker(latlng, {
              icon: L.icon({
                iconUrl: 'images/driver-marker.png',
                iconSize: [40, 54],
                iconAnchor: [20, 54]
              })
            });
            _this._featureGroup.addLayer(driver);
            return _this._map.fitBounds(_this._featureGroup, {
              padding: [15, 15]
            });
          } else {
            return driver.setLatLng(latlng);
          }
        };
      })(this));
    };

    MapilaryWidget.prototype.trackDelivery = function(trackingNr, callback) {
      var $el, url;
      if (!trackingNr) {
        alert('Please enter a tracking number to proceed');
        return;
      }
      $el = this._$el;
      url = this._settings.deliveryServiceUrl.replace('{trackingNr}', trackingNr);
      return $.get(url, (function(_this) {
        return function(deliveries) {
          var $overlay, coords, delivery, eta, userMarker;
          delivery = deliveries.length && deliveries[0] || null;
          if (!delivery) {
            alert('No delivery found with the tracking number: ' + trackingNr);
            return;
          }
          if (!(delivery.addresses && delivery.addresses.length > 0)) {
            alert('Delivery has no drop address.');
            return;
          }
          coords = delivery.addresses[0].coords;
          delivery.latlng = new L.LatLng(coords.latitude, coords.longitude);
          $el.addClass('is-tracking');
          _this._map.panTo(delivery.latlng);
          userMarker = L.marker(delivery.latlng, {
            icon: L.icon({
              iconUrl: 'images/user-marker.png',
              iconSize: [40, 54],
              iconAnchor: [20, 54]
            })
          });
          _this._featureGroup.addLayer(userMarker);
          _this._socketConnect(trackingNr);
          $overlay = $el.find('.info-overlay');
          $overlay.show();
          _this._trackings[trackingNr] = {
            etd: delivery.etd
          };
          if (delivery.etd) {
            eta = new Date(delivery.etd.date);
            $overlay.find('.eta .dynamic').html([eta.getHours(), eta.getMinutes()].join(':'));
            $overlay.find('.client-position .dynamic').html(delivery.etd.orderNr);
          }
          return $overlay.find('.info').html(delivery.note);
        };
      })(this));
    };

    return MapilaryWidget;

  })();

  if (typeof module !== 'undefined') {
    module.exports = MapilaryWidget;
  } else {
    this.MapilaryWidget = MapilaryWidget;
  }

}).call(this);
