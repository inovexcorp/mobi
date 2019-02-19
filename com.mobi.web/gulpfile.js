// Include gulp requirements
var gulp = require('gulp'),
    browerify = require('browserify'),
    babelify = require('babelify'),
    strictify = require('strictify'),
    source = require('vinyl-source-stream'),
    babel = require('gulp-babel'),
    cache = require('gulp-cache'),
    concat = require('gulp-concat'),
    debug = require('gulp-debug'),
    del = require('del'),
    queue = require('streamqueue'),
    filelog = require('gulp-filelog'),
    flatten = require('gulp-flatten'),
    ignore = require('gulp-ignore'),
    imagemin = require('gulp-imagemin'),
    inject = require('gulp-inject'),
    minifyCss = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    strip = require('gulp-strip-comments'),
    glob = require('glob-all'),
    templateCache = require('gulp-angular-templatecache'),
    Karma = require('karma').Server;

// Project specific path variables
var src = './src/main/resources/public/',
    dest = './target/classes/build/',
    nodeDir = './node_modules/',
    spec = src + '**/*.spec.js';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + 'vendor/manchestersyntax.js',
            prefix + 'shared/services/prefixes.service.js',
            prefix + 'shared/filters/!(*.spec).js',
            prefix + 'shared/services/!(*.spec).js',
            prefix + 'shared/directives/**/!(*.spec).js',
            prefix + 'shared/components/**/!(*.spec).js',
            prefix + '*/!(*.spec).js',
            prefix + '**/*/services/**/!(*.spec).js',
            prefix + '**/*/components/**/!(*.spec).js',
            prefix + '**/*/directives/**/!(*.spec).js',
            prefix + '!(vendor)*/**/!(*.spec).js',
            prefix + 'app.module.js',
            prefix + 'route.config.js'
        ]
    },
    nodeJsFiles = function(prefix) {
        return [
            prefix + 'lodash/**/lodash.min.js',
            prefix + 'codemirror-minified/**/codemirror.js',
            prefix + 'codemirror-no-newlines/**/no-newlines.js',
            prefix + 'codemirror-minified/**/sparql.js',
            prefix + 'codemirror-minified/**/turtle.js',
            prefix + 'codemirror-minified/**/xml.js',
            prefix + 'codemirror-minified/**/javascript.js',
            prefix + 'codemirror-minified/**/matchbrackets.js',
            prefix + 'angular/**/angular.min.js',
            prefix + 'jquery/**/jquery.min.js',
            prefix + 'popper.js/' + (prefix.includes(dest) ? '**' : 'dist/umd') + '/popper.min.js',
            prefix + 'bootstrap/' + (prefix.includes(dest) ? '**' : 'dist/js') + '/bootstrap.min.js',
            prefix + 'angular-mocks/**/angular-mocks.js',
            prefix + 'angular-animate/**/angular-animate.js',
            prefix + 'angular-ui-router/**/angular-ui-router.min.js',
            prefix + 'angular-uuid/**/angular-uuid.js',
            prefix + 'angular-cookies/**/angular-cookies.min.js',
            prefix + 'angular-ui-codemirror/**/ui-codemirror.js',
            prefix + 'angular-messages/**/angular-messages.min.js',
            prefix + 'ui-bootstrap4/**/ui-bootstrap-tpls.js',
            prefix + 'ui-select/**/select.min.js',
            prefix + 'handsontable/**/handsontable.full.js',
            prefix + 'ng-handsontable/**/ngHandsontable.min.js',
            prefix + 'chroma-js/**/chroma.min.js',
            prefix + 'angular-toastr/**/angular-toastr.tpls.js',
            prefix + 'snapsvg/**/snap.svg-min.js',
            prefix + 'clipboard/**/clipboard.min.js',
            prefix + 'ngclipboard/**/ngclipboard.min.js',
            prefix + 'angular-aria/angular-aria.min.js',
            prefix + 'daemonite-material/**/material.js',
            prefix + 'angular-material/angular-material.min.js',
            prefix + 'showdown/**/showdown.min.js'
        ]
    },
    styleFiles = function(prefix, suffix) {
        return [
            prefix + '**/css/**/*.' + suffix,
            prefix + '**/directives/**/*.' + suffix,
            prefix + '**/components/**/*.' + suffix,
            prefix + '*/*.' + suffix
        ]
    },
    nodeStyleFiles = function(prefix) {
        return [
            prefix + 'angular-material/angular-material.min.css',
            prefix + 'font-awesome/**/font-awesome.min.css',
            prefix + 'ui-select/**/select.min.css',
            prefix + 'codemirror-minified/**/codemirror.css',
            prefix + 'handsontable/**/handsontable.full.css',
            prefix + 'angular-toastr/**/angular-toastr.min.css'
        ]
    },
    fontFiles = function(prefix) {
        return [
            prefix + 'bootstrap/fonts/**.*',
            prefix + 'font-awesome/fonts/**.*'
        ]
    },
    bundledFiles = [
        dest + 'vendor/manchester.js',
        dest + 'vendor/sparql.js'
    ],
    minifiedFiles = [
        dest + '**/vendor.js',
        dest + '**/main.min.js'
    ];

//Method to run jasmine tests
var runKarma = function(vendorFiles, testFiles, isBuild, done) {
    var configFile = isBuild ? __dirname + '/karma.conf.build.js' : __dirname + '/karma.conf.tdd.js';
    new Karma({
        configFile: configFile,
        files: vendorFiles.concat(['./target/templates.js', './src/test/js/Shared.js']).concat(testFiles)
    }, function(processExitCode) {
        if (processExitCode === 0 || processExitCode === null || typeof processExitCode === 'undefined') {
            done();
        } else {
            var err = new Error('ERROR: Karma Server exited with code "' + processExitCode + '"');
            done(err);
        }
        process.exit(processExitCode);
    }).start();
}

// Inject method for minified and unminified
var injectFiles = function(files) {
    return gulp.src(dest + 'index.html')
        .pipe(inject(
            gulp.src(files, {read: false}),
            {relative: true}
        ))
        .pipe(gulp.dest(dest));
};

// Creates a cache of directive templates for use with test files
gulp.task('cacheTemplates', function() {
    return gulp.src(src + '**/*.html')
        .pipe(strip.html())
        .pipe(templateCache({standalone: true}))
        .pipe(gulp.dest('./target/'));
});

// Run jasmine tests in PhantomJS with minified source files
gulp.task('test-minified', ['cacheTemplates'], function(done) {
    return runKarma(minifiedFiles, spec, true, done);
});

// Run jasmine tests in PhantomJS with unminified source files
gulp.task('test-unminified', ['cacheTemplates'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), spec, true, done);
});

// Launch TDD environment for jasmine tests in Chrome
gulp.task('tdd', ['cacheTemplates'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(src)), spec, false, done);
});

// Concatenate and minifies JS Files and bundles files
gulp.task('minify-scripts', ['antlr4', 'sparqljs'], function() {
    var customFiles = gulp.src(jsFiles(src))
        .pipe(babel({
            presets: ['es2015']
        }));
    var bundledFileStream = gulp.src(bundledFiles);

    return queue({ objectMode: true }, bundledFileStream, customFiles)
        .pipe(concat('main.js'))
        .pipe(ngAnnotate())
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'vendor'));
});

// Concatenates and minifies vendor JS files
gulp.task('minify-vendor-scripts', function() {
    return gulp.src(nodeJsFiles(nodeDir))
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(dest + 'vendor'));
});

// Concatenates and minifies CSS Files
gulp.task('minify-css', function() {
    var sassFiles = gulp.src(styleFiles(src, 'scss')).pipe(sass()),
        cssFiles = gulp.src(nodeStyleFiles(nodeDir).concat(styleFiles(src, 'css')));
    return queue({ objectMode: true }, cssFiles, sassFiles)
        .pipe(concat('main.css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(dest + 'css'));
});

// Injects minified CSS and JS files
gulp.task('inject-minified', ['minify-scripts', 'minify-vendor-scripts', 'minify-css', 'html', 'filtered-html'], function() {
    return injectFiles(minifiedFiles.concat([dest + '**/*.css']));
});;

// Compresses images
gulp.task('images', function() {
    return gulp.src(src + 'images/*')
        .pipe(cache(
            imagemin({
                optimizationLevel: 5,
                progressive: true,
                interlaced: true
            })
        ))
        .pipe(gulp.dest(dest + 'images'));
});

// Moves all of the html files to build folder
gulp.task('html', function() {
    return gulp.src(src + '**/!(sidebar).html')
        .pipe(strip.html({ignore: /<!-- inject:css -->|<!-- inject:js -->|<!-- endinject -->/g}))
        .pipe(gulp.dest(dest));
});

gulp.task('filtered-html', function() {
    return gulp.src(src + 'shared/directives/sidebar/sidebar.directive.html')
        .pipe(strip.html({ignore: /<!-- inject:css -->|<!-- inject:js -->|<!-- endinject -->/g}))
        .pipe(gulp.dest('./target/filtered-resources'));
})

// Creates Antlr4 bundle file
gulp.task('antlr4', function() {
    return browerify({
            entries: './src/main/antlr4/manchester.js',
            debug: true,
            standalone: 'antlr'
        })
        .transform(babelify, {presets: ['es2015']})
        .transform(strictify)
        .bundle()
        .pipe(source('manchester.js'))
        .pipe(gulp.dest(dest + 'vendor'));
});

gulp.task('sparqljs', function() {
    return browerify({
            entries: nodeDir + 'sparqljs/sparql.js',
            debug: true,
            standalone: 'sparqljs'
        })
        .bundle()
        .pipe(source('sparql.js'))
        .pipe(gulp.dest(dest + 'vendor'));
});

// Moves all node_modules js files to build folder
gulp.task('move-node-js', function() {
    return gulp.src(nodeJsFiles(nodeDir), {base: './'})
        .pipe(flatten({includeParents: 2}))
        .pipe(flatten({includeParents: -1}))
        .pipe(gulp.dest(dest + 'vendor'));
});

// Moves all node_modules css files to build folder
gulp.task('move-node-css', function() {
    return gulp.src(nodeStyleFiles(nodeDir), {base: './'})
        .pipe(flatten({includeParents: 2}))
        .pipe(flatten({includeParents: -1}))
        .pipe(gulp.dest(dest + 'css'));
});

// Moves all custom js files to build folder
gulp.task('move-custom-js', function() {
    return gulp.src(src + '**/!(*.spec).js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(ignore.exclude('**/*.scss'))
        .pipe(gulp.dest(dest));
});

// Changes the css files to sass files
gulp.task('change-to-css', function() {
    return gulp.src(styleFiles(src, 'scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dest));
});

// Injects un-minified CSS and JS files
gulp.task('inject-unminified', ['antlr4', 'sparqljs', 'move-custom-js', 'html', 'filtered-html', 'move-node-js', 'move-node-css', 'change-to-css'], function() {
    var allJsFiles = nodeJsFiles(dest + 'vendor/').concat(bundledFiles).concat(jsFiles(dest)),
        allStyleFiles = nodeStyleFiles(dest + 'css/').concat(styleFiles(dest, 'css')),
        allFiles = allJsFiles.concat(allStyleFiles);
    return injectFiles(allFiles);
});

// Get icons from font-awesome and bootstrap for minified build
gulp.task('icons-minified', function() {
    return gulp.src(fontFiles(nodeDir))
        .pipe(gulp.dest(dest + 'fonts'));
});

// Get icons from font-awesome and bootstrap for un-minified build
gulp.task('icons-unminified', function() {
    return gulp.src(fontFiles(nodeDir))
        .pipe(gulp.dest(dest + 'css/fonts'));
});

gulp.task('clearcache', function() {
    cache.clearAll();
});

// Production Task (minified)
gulp.task('prod', ['images', 'inject-minified', 'icons-minified']);

// Default Task (un-minified)
gulp.task('default', ['images', 'inject-unminified', 'icons-unminified']);
