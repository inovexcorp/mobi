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
    nodeDir = './node_modules/';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + 'js/vendor/manchestersyntax.js',
            prefix + 'js/services/responseObj.js',
            prefix + 'js/services/prefixes.js',
            prefix + 'js/filters/*.js',
            prefix + 'js/services/*.js',
            prefix + 'directives/**/*.js',
            prefix + 'modules/**/*/services/**/*.js',
            prefix + 'modules/**/*/directives/**/*.js',
            prefix + 'modules/**/*.js',
            prefix + 'js/app.module.js',
            prefix + 'js/route.config.js'
        ]
    },
    nodeJsFiles = function(prefix) {
        return [
            prefix + 'lodash/**/lodash.min.js',
            prefix + 'codemirror/' + (prefix === nodeDir ? 'lib' : '**') + '/codemirror.js',
            prefix + 'codemirror/**/sparql.js',
            prefix + 'codemirror/**/turtle.js',
            prefix + 'codemirror/**/xml.js',
            prefix + 'codemirror/**/javascript.js',
            prefix + 'codemirror/**/matchbrackets.js',
            prefix + 'codemirror-no-newlines/**/no-newlines.js',
            prefix + 'angular/**/angular.min.js',
            prefix + 'angular-mocks/**/angular-mocks.js',
            prefix + 'angular-animate/**/angular-animate.js',
            prefix + 'angular-ui-router/**/angular-ui-router.min.js',
            prefix + 'angular-uuid/**/angular-uuid.js',
            prefix + 'angular-cookies/**/angular-cookies.min.js',
            prefix + 'angular-ui-codemirror/**/ui-codemirror.js',
            prefix + 'angular-messages/**/angular-messages.min.js',
            prefix + 'angular-ui-bootstrap/**/ui-bootstrap.js',
            prefix + 'angular-ui-bootstrap/**/ui-bootstrap-tpls.js',
            prefix + 'ui-select/**/select.min.js',
            prefix + 'handsontable/**/handsontable.full.js',
            prefix + 'ng-handsontable/**/ngHandsontable.min.js',
            prefix + 'chroma-js/**/chroma.min.js',
            prefix + 'angular-toastr/**/angular-toastr.tpls.js',
            prefix + 'snapsvg/**/snap.svg-min.js',
            prefix + 'angular-vs-repeat/**/angular-vs-repeat.min.js',
            prefix + 'clipboard/**/clipboard.min.js',
            prefix + 'ngclipboard/**/ngclipboard.min.js',
            prefix + 'angular-aria/angular-aria.min.js',
            prefix + 'angular-material/angular-material.min.js'
        ]
    },
    styleFiles = function(prefix, suffix) {
        return [
            prefix + '**/css/**/*.' + suffix,
            prefix + '**/directives/**/*.' + suffix,
            prefix + '**/modules/**/*.' + suffix
        ]
    },
    nodeStyleFiles = function(prefix) {
        return [
            prefix + 'angular-material/angular-material.min.css',
            prefix + 'bootstrap/**/bootstrap.min.css',
            prefix + 'font-awesome/**/font-awesome.min.css',
            prefix + 'ui-select/**/select.min.css',
            prefix + 'codemirror/**/codemirror.css',
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
        dest + 'js/manchester.js',
        dest + 'js/sparql.js'
    ];

// Method to chunk array
var createGroupedArray = function(arr, chunkSize) {
    var groups = [], i;
    for (i = 0; i < arr.length; i += chunkSize) {
        groups.push(arr.slice(i, i + chunkSize));
    }
    return groups;
}

var tests = createGroupedArray(glob.sync('./src/test/js/*Spec.js'), 50);

//Method to run jasmine tests
var runKarma = function(vendorFiles, testFiles, isBuild, done) {
    var configFile = isBuild ? __dirname + '/karma.conf.build.js' : __dirname + '/karma.conf.tdd.js';
    new Karma({
        configFile: configFile,
        files: vendorFiles.concat(['./target/templates.js', './src/test/js/Shared.js']).concat(testFiles)
    }, done).start();
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
gulp.task('test-minified', ['cacheTemplates', 'minify-scripts'], function(done) {
    return runKarma([dest + '**/*.js'], './src/test/js/*Spec.js', true, done);
});

gulp.task('test-minified-1', ['cacheTemplates'], function(done) {
    return runKarma([dest + '**/*.js'], tests[0], true, done);
});

gulp.task('test-minified-2', ['test-minified-1'], function(done) {
    return runKarma([dest + '**/*.js'], tests[1], true, done);
});

gulp.task('test-minified-3', ['test-minified-2'], function(done) {
    return runKarma([dest + '**/*.js'], tests[2], true, done);
});

gulp.task('test-minified-4', ['test-minified-3'], function(done) {
    return runKarma([dest + '**/*.js'], tests[3], true, done);
});

gulp.task('test-minified-5', ['test-minified-4'], function(done) {
    return runKarma([dest + '**/*.js'], tests[4], true, done);
});

// Run jasmine tests in PhantomJS with unminified source files
gulp.task('test-unminified', ['cacheTemplates', 'move-custom-js'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), './src/test/js/*Spec.js', true, done);
});

gulp.task('test-unminified-1', ['cacheTemplates'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), tests[0], true, done);
});

gulp.task('test-unminified-2', ['test-unminified-1'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), tests[1], true, done);
});

gulp.task('test-unminified-3', ['test-unminified-2'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), tests[2], true, done);
});

gulp.task('test-unminified-4', ['test-unminified-3'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), tests[3], true, done);
});

gulp.task('test-unminified-5', ['test-unminified-4'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(dest)), tests[4], true, done);
});

// Launch TDD environment for jasmine tests in Chrome
gulp.task('tdd', ['cacheTemplates'], function(done) {
    return runKarma(nodeJsFiles(nodeDir).concat(bundledFiles).concat(jsFiles(src)), './src/test/js/*Spec.js', false, done);
});

// Concatenate and minifies JS Files
gulp.task('minify-scripts', ['antlr4', 'sparqljs'], function() {
    var nodeFiles = gulp.src(nodeJsFiles(nodeDir));
    var customFiles = gulp.src(jsFiles(src))
        .pipe(babel({
            presets: ['es2015']
        }));
    var bundledFileStream = gulp.src(bundledFiles)

    return queue({ objectMode: true }, nodeFiles, customFiles, bundledFileStream)
        .pipe(concat('main.js'))
        .pipe(ngAnnotate())
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'js'));
});

// Concatenates and minifies CSS Files
gulp.task('minify-css', function() {
    var sassFiles = gulp.src(styleFiles(src, 'scss'))
            .pipe(sass().on('error', sass.logError)),
        cssFiles = gulp.src(nodeStyleFiles(nodeDir).concat(styleFiles(src, 'css')));
    return queue({ objectMode: true }, cssFiles, sassFiles)
        .pipe(concat('main.css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(dest + 'css'));
});

// Injects minified CSS and JS files
gulp.task('inject-minified', ['minify-scripts', 'minify-css', 'html'], function() {
    return injectFiles([dest + '**/*.js', dest + '**/*.css']);
});

// Compresses images
gulp.task('images', function() {
    return gulp.src(src + 'images/**/*')
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
    return gulp.src(src + '**/*.html')
        .pipe(strip.html({ignore: /<!-- inject:css -->|<!-- inject:js -->|<!-- endinject -->/g}))
        .pipe(gulp.dest(dest));
});

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
        .pipe(gulp.dest(dest + 'js'));
});

gulp.task('sparqljs', function() {
    return browerify({
            entries: nodeDir + 'sparqljs/sparql.js',
            debug: true,
            standalone: 'sparqljs'
        })
        .bundle()
        .pipe(source('sparql.js'))
        .pipe(gulp.dest(dest + 'js'));
});

// Moves all node_modules js files to build folder
gulp.task('move-node-js', function() {
    return gulp.src(nodeJsFiles(nodeDir), {base: './'})
        .pipe(flatten({includeParents: 2}))
        .pipe(flatten({includeParents: -1}))
        .pipe(gulp.dest(dest + 'js'));
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
    return gulp.src(src + '**/*.js')
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
gulp.task('inject-unminified', ['antlr4', 'sparqljs', 'move-custom-js', 'html', 'move-node-js', 'move-node-css', 'change-to-css'], function() {
    var allJsFiles = nodeJsFiles(dest + 'js/').concat(bundledFiles).concat(jsFiles(dest)),
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
// gulp.task('prod', ['sparqljs', 'antlr4', 'test-minified', 'minify-scripts', 'minify-css', 'html', 'images', 'inject-minified', 'icons-minified', ]);

// Default Task (un-minified)
gulp.task('default', ['images', 'inject-unminified', 'icons-unminified']);
// gulp.task('default', ['sparqljs', 'antlr4', 'test-unminified', 'move-custom-js', 'move-node-js', 'move-node-css', 'images', 'html', 'change-to-css', 'inject-unminified', 'icons-unminified']);
