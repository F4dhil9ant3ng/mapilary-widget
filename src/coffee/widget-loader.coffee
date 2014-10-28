class MapilaryWidgetLoader

    js: [
        'https://ws.mapilary.com/socket.io/socket.io.js',
        '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js',
        'js/widget-loader.bundle.min.js'
    ]
    
    css: [
        '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css',
        'css/widget-loader.bundle.min.css'
    ];

    constructor: (_settings) ->
        @_settings = _settings
        @_$el = $ _settings.el

    _getResource: (url, options) ->

        # Allow user to set any option except for dataType, cache, and url
        options = $.extend options || {}, {
            dataType: "script",
            cache: true,
            url: url
        }

        # Use $.ajax() since it is more flexible than $.getScript
        # Return the jqXHR object so we can chain callbacks
        jQuery.ajax options

    load: (callback) ->
        $widget = @_$el
        $widget.addClass 'mapilary-widget'
        notice = @_settings.notice || ''
        $widget.html '<div class="preload"><div class="loading">Loading<div class="progress"></div></div><div class="notice">' + notice + '</div></div>'
        $widget.slideDown 'slow', () =>
            LazyLoad.css 'css/preload.css', () =>
                LazyLoad.css @css
                LazyLoad.js @js, () =>
                    callback new MapilaryWidget @_settings
        this

if (typeof module != 'undefined')
    module.exports = MapilaryWidgetLoader
else
    this.MapilaryWidgetLoader = MapilaryWidgetLoader