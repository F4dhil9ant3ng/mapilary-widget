define ['jquery', 'widget'], ($, MapilaryWidget) ->
    # widget
    widget = new MapilaryWidget('map', {apikey: '1234'})
    $('button:submit').on 'click', (ev)->
        ev.preventDefault()
        trackingNr = ($ ev.target.form[0]).val().toUpperCase()
        widget.renderDelivery(trackingNr)
        return
    return