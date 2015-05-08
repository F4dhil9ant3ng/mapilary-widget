"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// var $ = require('jquery')

var MapilaryWidgetLoader = (function () {
    function MapilaryWidgetLoader(settings) {
        _classCallCheck(this, MapilaryWidgetLoader);

        this._settings = settings;
        this._$el = $(settings.el);

        this.preloadCss = "css/preload.css";

        this.js = ["https://ws.mapilary.com/socket.io/socket.io.js", "//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js", "js/widget-loader.bundle.min.js"];

        this.css = ["//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css", "css/widget-loader.bundle.min.css"];

        this.noticeTpl = ["<div class=\"preload\"><div class=\"loading\">Loading<div class=\"progress\"></div></div><div class=\"notice\">", "<!-- notice will be inserted here -->", "</div></div>"];
    }

    _createClass(MapilaryWidgetLoader, {
        _getResource: {
            value: function _getResource(url, options) {

                //# Allow user to set any option except for dataType, cache, and url
                options = $.extend(options || {}, {
                    dataType: "script",
                    cache: true,
                    url: url
                });

                //# Use $.ajax() since it is more flexible than $.getScript
                //# Return the jqXHR object so we can chain callbacks
                $.ajax(options);
            }
        },
        load: {
            value: function load(callback) {
                var _this = this;

                $widget = this._$el;
                $widget.addClass("mapilary-widget");
                this.noticeTpl[2] = this._settings.notice || "";
                $widget.html(this.noticeTpl.join(""));
                $widget.slideDown("slow", function () {
                    LazyLoad.css(_this.preloadCss, function () {
                        LazyLoad.css(_this.css);
                        LazyLoad.js(_this.js, function () {
                            callback(new MapilaryWidget(_this._settings));
                        });
                    });
                });
                return this;
            }
        }
    });

    return MapilaryWidgetLoader;
})();

if (typeof module != "undefined") module.exports = MapilaryWidgetLoader;else window.MapilaryWidgetLoader = MapilaryWidgetLoader;
//# sourceMappingURL=widget-loader.js.map