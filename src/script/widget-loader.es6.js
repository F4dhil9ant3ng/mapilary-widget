// var $ = require('jquery')

class MapilaryWidgetLoader {

    constructor(settings) {
        this._settings = settings
        this._$el = $(settings.el)

        this.preloadCss = 'css/preload.css'

        this.js = [
            'https://ws.mapilary.com/socket.io/socket.io.js',
            '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js',
            'js/widget-loader.bundle.min.js'
        ]

        this.css = [
            '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css',
            'css/widget-loader.bundle.min.css'
        ]

        this.noticeTpl = [
            '<div class="preload"><div class="loading">Loading<div class="progress"></div></div><div class="notice">',
            '<!-- notice will be inserted here -->',
            '</div></div>'
        ]
    }

    _getResource(url, options) {

        //# Allow user to set any option except for dataType, cache, and url
        options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url
        })

        //# Use $.ajax() since it is more flexible than $.getScript
        //# Return the jqXHR object so we can chain callbacks
        $.ajax(options)
    }

    load(callback) {
        $widget = this._$el
        $widget.addClass('mapilary-widget')
        this.noticeTpl[2] = this._settings.notice || ''
        $widget.html(this.noticeTpl.join(''))
        $widget.slideDown('slow', () => {
            LazyLoad.css(this.preloadCss, () => {
                LazyLoad.css(this.css)
                LazyLoad.js(this.js, () => {
                    callback(new MapilaryWidget(this._settings))
                })
            })
        })
        return this
    }
}


if (typeof module != 'undefined')
    module.exports = MapilaryWidgetLoader
else
    window.MapilaryWidgetLoader = MapilaryWidgetLoader