module.exports = function(grunt) {

    // load tasks
    [
    'grunt-contrib-jshint',
    'grunt-contrib-qunit',
    'grunt-contrib-watch',
    'grunt-contrib-clean',
    'grunt-contrib-copy',
    'grunt-contrib-uglify',
    'grunt-contrib-cssmin',
    'grunt-contrib-concat',
    'grunt-contrib-less',
    'grunt-contrib-coffee',
    'grunt-contrib-requirejs',
    'grunt-usemin',
    'grunt-targethtml'
    ].forEach(function(task) { grunt.loadNpmTasks(task); });


    // setup init config
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: ['.tmp', 'dist']
        },
        copy: {
            prepareUsemin: {
                files: [
                {
                    expand: true,
                    dot: true,
                    cwd: 'src',
                    dest: '.tmp/',
                    src: ['vendor/*', '*.html'],
                    filter: 'isFile'
                }
            ]},
            dist: {
                files: [
                {//socketio & jquery
                    expand: true,
                    dot: true,
                    flatten: true,
                    cwd: 'bower_components/',
                    dest: 'dist/js/',
                    src: ['**/socket.io.min.js', '**/jquery.min.js'],
                    filter: 'isFile'
                },
                {//locatecontrol
                    expand: true,
                    dot: true,
                    flatten: true,
                    cwd: 'bower_components/',
                    dest: 'dist/css/images/',
                    src: ['**/images/*'],
                    filter: 'isFile'
                },
                {//fonts
                    expand: true,
                    dot: true,
                    flatten: true,
                    cwd: 'bower_components/',
                    dest: 'dist/fonts/',
                    src: ['**/fonts/*'],
                    filter: 'isFile'
                }
            ]}
        },
        less: {
            dist: {
                files: {
                    '.tmp/css/widget.css': [
                        'src/less/style.less',
                        'src/less/track.less'
                    ]
                },
                options: {
                    compress: false,
                    // LESS source maps
                    // To enable, set sourceMap to true and update sourceMapRootpath based on your install
                    sourceMap: false,
                    sourceMapFilename: 'dist/css/widget.css.map',
                    sourceMapRootpath: '/mapilary-widget'
                }
            }
        },
        coffee: {
            glob_to_multiple: {
                expand: true,
                //flatten: true,
                cwd: 'src/coffee',
                src: ['*.coffee'],
                dest: '.tmp/js',
                ext: '.js'
            }
        },
        useminPrepare: {
            html: ['.tmp/track.html'],
            options: {
                dest: 'dist/'
            }
        },
        usemin: {
            html: ['.tmp/track.html']
        },
        // TODO - support qunit
        qunit: {
            files: ['test/**/*.html']
        },
        jshint: {
            files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    mainConfigFile: '.tmp/js/build.js',
                    baseUrl: '.tmp/js',
                    name: '../../bower_components/almond/almond',
                    include: ['main'],
                    insertRequire: ['main'],
                    out: 'dist/js/main.js',
                    optimize: 'none',
                    wrap: {
                        startFile: 'src/start.frag',
                        endFile: 'src/end.frag'
                    }
                }
            }
        },
        targethtml: {
            dist: {
                files: {
                    'dist/track.html': '.tmp/track.html'
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            html: {
                files: ['src/*.html'],
                task: ['change']
            },
            coffee: {
                files: ['src/**/*.coffee'],
                tasks: ['coffee', 'jshint', 'change']
            },
            less: {
                files: ['src/**/*.less'],
                tasks: ['less', 'change']
            },
            css: {
                files: '**/*.sass',
                tasks: ['sass', 'change']
            }
        }
    });

grunt.registerTask('test', ['jshint', 'qunit']);

grunt.registerTask('change', [
    'copy:prepareUsemin',
    'useminPrepare',
    'requirejs',
    'concat',
    'cssmin',
    'usemin',
    'copy:dist',
    'targethtml'
]);

grunt.registerTask('default', [
    'clean',
    'less',
    'coffee',
    'jshint',
    'change'
]);
};