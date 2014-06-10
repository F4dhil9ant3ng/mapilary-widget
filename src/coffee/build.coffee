require.config {
    waitSeconds: 30,
    paths: {
        'leaflet': '../../bower_components/Leaflet/dist/leaflet-src',
        'leaflet.locatecontrol': '../../bower_components/leaflet-locatecontrol/src/L.Control.Locate',
        'leaflet.awesome-markers': '../../bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers',
        'widget': 'main',
        # 'jquery': '../../bower_components/jquery/jquery',
        # 'jquery-private': '../vendor/jquery-private',
        'moment': '../../bower_components/momentjs/moment'
    },
    map: {
      # '*': { 'jquery': 'jquery-private' }
      # 'jquery-private': { 'jquery': 'jquery' }
    },
    shim: {
        'leaflet': {
            exports: 'L'
        },
        'leaflet.awesome-markers': ['leaflet'],
        'leaflet.locatecontrol': ['leaflet'],
        'widget': {
            exports: 'MapilaryWidget'
        }
    }
}
