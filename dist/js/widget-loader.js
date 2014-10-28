(function() {
  var MapilaryWidgetLoader;

  MapilaryWidgetLoader = (function() {
    MapilaryWidgetLoader.prototype.js = ['https://ws.mapilary.com/socket.io/socket.io.js', '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js', 'js/widget-loader.bundle.min.js'];

    MapilaryWidgetLoader.prototype.css = ['//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css', 'css/widget-loader.bundle.min.css'];

    function MapilaryWidgetLoader(_settings) {
      this._settings = _settings;
      this._$el = $(_settings.el);
    }

    MapilaryWidgetLoader.prototype._getResource = function(url, options) {
      options = $.extend(options || {}, {
        dataType: "script",
        cache: true,
        url: url
      });
      return jQuery.ajax(options);
    };

    MapilaryWidgetLoader.prototype.load = function(callback) {
      var $widget, notice;
      $widget = this._$el;
      $widget.addClass('mapilary-widget');
      notice = this._settings.notice || '';
      $widget.html('<div class="preload"><div class="loading">Loading<div class="progress"></div></div><div class="notice">' + notice + '</div></div>');
      $widget.slideDown('slow', (function(_this) {
        return function() {
          return LazyLoad.css('css/preload.css', function() {
            LazyLoad.css(_this.css);
            return LazyLoad.js(_this.js, function() {
              return callback(new MapilaryWidget(_this._settings));
            });
          });
        };
      })(this));
      return this;
    };

    return MapilaryWidgetLoader;

  })();

  if (typeof module !== 'undefined') {
    module.exports = MapilaryWidgetLoader;
  } else {
    this.MapilaryWidgetLoader = MapilaryWidgetLoader;
  }

}).call(this);
