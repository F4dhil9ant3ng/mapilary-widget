'use strict';

window.$  = require('jquery')
window.L  = require('leaflet')
window.io = require('socket.io-client')
require('../vendor/L.Control.Locate.browserify')

global.window.MapilaryWidget = require('../js/widget');