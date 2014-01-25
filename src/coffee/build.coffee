require.config {
    waitSeconds: 30,
    paths: {
        'leaflet': '../../bower_components/Leaflet/dist/leaflet-src',
        'leaflet.locatecontrol': '../../bower_components/leaflet-locatecontrol/src/L.Control.Locate',
        'leaflet.awesome-markers': '../../bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers',
        'leaflet.plotter': '../../bower_components/leaflet-plotter/src/leaflet.plotter',
        'widget': 'widget'
    },
    map: {
      '*': { 'jquery': 'jquery-private' },
      'jquery-private': { 'jquery': 'jquery' }
    },
    shim: {
        'leaflet': {
            exports: 'L'
        },
        'leaflet.awesome-markers': ['leaflet'],
        'leaflet.locatecontrol': ['leaflet'],
        'leaflet.plotter': ['leaflet'],
        'widget': {
            exports: 'MapilaryWidget'
        }
    }
}
