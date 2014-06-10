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
    'grunt-requirejs',
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
                    src: ['vendor/*', '*.html', 'js/*'],
                    filter: 'isFile'
                }
            ]},
            dist: {
                files: [
                {//fonts & images
                    expand: true,
                    dot: true,
                    flatten: false,
                    cwd: 'src',
                    dest: 'dist/',
                    src: ['images/*'],
                    filter: 'isFile'
                },
                {//socketio & jquery
                    expand: true,
                    dot: true,
                    flatten: true,
                    cwd: 'bower_components/',
                    dest: 'dist/js/',
                    src: ['**/socket.io.min.js', '**/jquery.min.js', '**/moment.min.js'],
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
            html: ['.tmp/index.html'],
            options: {
                dest: 'dist/'
            }
        },
        usemin: {
            html: ['.tmp/index.html']
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
                },
                ignores: 'src/js/*'
            }
        },
        requirejs: {
            compile: {
                options: {
                    mainConfigFile: '.tmp/js/build.js',
                    baseUrl: '.tmp/js',
                    include: ['main'],
                    exclude: ['moment'],
                    insertRequire: ['main'],
                    out: 'dist/js/main.js',
                    optimize: 'uglify2',
                    preserveLicenseComments: false,
                    findNestedDependencies: true,
                    generateSourceMaps: true,
                    onModuleBundleComplete: function (data) {
                        var fs = require('fs'),
                        amdclean = require('amdclean'),
                        outputFile = data.path;
                        fs.writeFileSync(outputFile, amdclean.clean({
                            filePath: outputFile,
                            transformAMDChecks: true,
                            wrap: {
                                start: fs.readFileSync('src/start.frag', 'utf8'),
                                end: fs.readFileSync('src/end.frag', 'utf8')
                            }
                        }));
                    }
                }
            }
        },
        targethtml: {
            dist: {
                files: {
                    'dist/index.html': '.tmp/index.html'
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