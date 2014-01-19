require.config {
    waitSeconds: 30,
    paths: {
        'jquery': '../../bower_components/jquery/jquery',
        'jquery-private': '../vendor/jquery-private',
        'leaflet': '../../bower_components/Leaflet/dist/leaflet',
        'leaflet.locatecontrol': '../../bower_components/leaflet-locatecontrol/src/L.Control.Locate',
        'socketio': '../../bower_components/socket.io-client/dist/socket.io',
        'widget': 'widget'
    },
    map: {
      '*': { 'jquery': 'jquery-private' },
      'jquery-private': { 'jquery': 'jquery' }
    },
    shim: {
        'socketio': {
            exports: 'io'
        },
        'leaflet': {
            exports: 'L'
        },
        'leaflet.locatecontrol':   ['leaflet']
        'widget': {
            exports: 'MapilaryWidget'
        }
    }
}
