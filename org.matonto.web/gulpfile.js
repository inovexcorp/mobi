// Include gulp requirements
var gulp = require('gulp'),
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
    uglify = require('gulp-uglify');

// Project specific path variables
var src = './src/main/resources/public/',
    dest = './target/classes/build/',
    nodeDir = './node_modules/';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + 'js/services/responseObj.js',
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
            prefix + '*/lodash.min.js',
            prefix + '**/angular.min.js',
            prefix + '**/angular-mocks.js',
            prefix + '**/angular-ui-router.min.js',
            prefix + '**/angular-uuid.js',
            prefix + '**/angular-cookies.min.js',
            prefix + '**/angular-file-saver.bundle.min.js',
            prefix + '**/angular-messages.min.js',
            prefix + '**/select.min.js'
        ]
    },
    styleFiles = function(prefix, suffix) {
        return [
            prefix + '**/css/**/*.' + suffix,
            prefix + '**/modules/**/*.' + suffix
        ]
    },
    nodeStyleFiles = function(prefix) {
        return [
            prefix + '**/bootstrap.min.css',
            prefix + '**/font-awesome.min.css',
            prefix + '**/select.min.css'
        ]
    };

// Inject method for minified and unminified
var injectFiles = function(files) {
    return gulp.src(dest + 'index.html')
        .pipe(inject(
            gulp.src(files, {read: false}),
            {relative: true}
        ))
        .pipe(gulp.dest(dest));
};

// Concatenate and minifies JS Files
gulp.task('minify-scripts', function() {
    var nodeFiles = gulp.src(nodeJsFiles(nodeDir));
    var customFiles = gulp.src(jsFiles(src))
        .pipe(babel({
            presets: ['es2015']
        }));

    return queue({ objectMode: true }, nodeFiles, customFiles)
        .pipe(concat('main.js'))
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
        .pipe(gulp.dest(dest + 'img'));
});

// Moves all of the html files to build folder
gulp.task('html', function() {
    return gulp.src(src + '**/*.html')
        .pipe(gulp.dest(dest));
});

// Moves all bower js files to build folder
gulp.task('move-node-js', function() {
    return gulp.src(nodeJsFiles(nodeDir))
        .pipe(flatten())
        .pipe(gulp.dest(dest + 'js'));
});

// Moves all bower css files to build folder
gulp.task('move-node-css', function() {
    return gulp.src(nodeStyleFiles(nodeDir))
        .pipe(flatten())
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

// Moves all custom non-js files to build folder
gulp.task('move-custom-not-js', function() {
    return gulp.src(src + '**/*')
        .pipe(ignore.exclude('**/*.scss'))
        .pipe(ignore.exclude('**/*.js'))
        .pipe(gulp.dest(dest));
});

// Changes the css files to sass files
gulp.task('change-to-css', function() {
    return gulp.src(styleFiles(src, 'scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dest));
});

// Injects un-minified CSS and JS files
gulp.task('inject-unminified', ['move-custom-js', 'move-custom-not-js', 'move-node-js', 'move-node-css', 'change-to-css'], function() {
    var allJsFiles = nodeJsFiles(dest).concat(jsFiles(dest)),
        allStyleFiles = nodeStyleFiles(dest).concat(styleFiles(dest, 'css')),
        allFiles = allJsFiles.concat(allStyleFiles);
    return injectFiles(allFiles);
});

// Get icons from font-awesome
gulp.task('icons', function() {
    return gulp.src(nodeDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest(dest + 'fonts'));
});

// Production Task (minified)
gulp.task('prod', ['minify-scripts', 'minify-css', 'html', 'inject-minified', 'icons']);

// Default Task (un-minified)
gulp.task('default', ['move-custom-js', 'move-custom-not-js', 'change-to-css', 'inject-unminified', 'icons']);
