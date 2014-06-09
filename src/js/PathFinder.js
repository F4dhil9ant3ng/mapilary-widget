'use strict';

define([
    'zepto',
    '../.'
], function ($, _) {

    var PathFinder = function (options) {
        options = options || {};
        this.options = _.extend({}, this.options, options);
        if (!this.options.url) {
            throw new Error('missing url of pathfinding server');
        }
        if (!this.options.apikey) {
            throw new Error('missing apikey of pathfinding server');
        }
    };

    PathFinder.prototype = {
        options: {},
        estimate: function (origin, destination, waypoints) {
            if (!origin || !destination) {
                return;
            }
            var params = {
                allowedTravelModes: 'CAR',
                unitSystem: 'METRIC',
                apiKey: this.options.apikey,
                origin: origin,
                waypoints: waypoints.join('|'),
                destination: destination
            };
            return $.getJSON(this.options.url, params).then(
                function (matrix) {
                    var durationSeconds = 0;
                    var distanceMeters = 0;
                    if (!_.isArray(matrix.paths)) {
                        return;
                    }
                    _.each(matrix.paths, function (path) {
                        durationSeconds += path.durationSeconds;
                        distanceMeters += path.distanceMeters;
                        // dispatcher.trigger('map:renderPath', path);
                    });
                    var hours = Math.floor(durationSeconds / 3600);
                    var minutes = Math.ceil((durationSeconds / 60) % 60);
                    var time = (hours > 0) ? hours + ' h ' : '' + minutes + ' m';
                    return {
                        time: time,
                        distance: Math.round(distanceMeters/1000) + ' km',
                        paths: matrix.paths
                    };
                }
            );
        }
    };

    return PathFinder;
});
