// Include gulp requirements
var gulp = require('gulp'),
    cache = require('gulp-cache'),
    concat = require('gulp-concat'),
    debug = require('gulp-debug'),
    del = require('del'),
    es = require('event-stream'),
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
    bowerDir = './bower_components/';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + '**/js/services/responseObj.js',
            prefix + '**/js/filters/*.js',
            prefix + '**/js/services/*.js',
            prefix + '**/js/directives/*.js',
            prefix + '**/modules/**/*/services/**/*.js',
            prefix + '**/modules/**/*/directives/**/*.js',
            prefix + '**/modules/**/*.js',
            prefix + '**/app.module.js',
            prefix + '**/route.config.js'
        ]
    },
    bowerJsFiles = function(prefix) {
        return [
            prefix + '**/angular/angular.min.js',
            prefix + '**/angular-ui-router/release/angular-ui-router.min.js',
            prefix + '**/ui-select/dist/select.min.js'
        ]
    },
    styleFiles = function(prefix, suffix) {
        return [
            prefix + '**/css/**/*.' + suffix,
            prefix + '**/modules/**/*.' + suffix
        ]
    },
    bowerStyleFiles = function(prefix) {
        return [
            prefix + 'bootstrap/dist/css/bootstrap.min.css',
            prefix + 'font-awesome/css/font-awesome.min.css',
            prefix + 'ui-select/dist/select.min.css'
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

// Concatenate and minifies JS Files, right now, manually selecting the bower js files we want
gulp.task('minify-scripts', function() {
    return gulp.src(bowerJsFiles(bowerDir).concat(jsFiles(src)))
        .pipe(concat('main.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'js'));
});

// Concatenates and minifies CSS Files
gulp.task('minify-css', function() {
    var sassFiles = gulp.src(styleFiles(src, 'scss'))
            .pipe(sass().on('error', sass.logError)),
        cssFiles = gulp.src(bowerStyleFiles(bowerDir).concat(styleFiles(src, 'css')));
    return es.concat(cssFiles, sassFiles)
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
gulp.task('move-bower-js', function() {
    return gulp.src(bowerJsFiles(bowerDir))
        .pipe(gulp.dest(dest + 'js'));
});

// Moves all bower css files to build folder
gulp.task('move-bower-css', function() {
    return gulp.src(bowerStyleFiles(bowerDir))
        .pipe(gulp.dest(dest + 'css'));
});

// Moves all custom files to build folder
gulp.task('move-custom', function() {
    return gulp.src(src + '**/*')
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
gulp.task('inject-unminified', ['move-custom', 'move-bower-js', 'move-bower-css', 'change-to-css'], function() {
    var allJsFiles = bowerJsFiles(dest).concat(jsFiles(dest)),
        allStyleFiles = bowerStyleFiles(dest).concat(styleFiles(dest, 'css')),
        allFiles = allJsFiles.concat(allStyleFiles);
    return injectFiles(allFiles);
});

// Get icons from font-awesome
gulp.task('icons', function() {
    return gulp.src(bowerDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest(dest + 'fonts'));
});

// Production Task (minified)
gulp.task('prod', ['minify-scripts', 'minify-css', 'images', 'html', 'inject-minified', 'icons']);

// Default Task (un-minified)
gulp.task('default', ['move-custom', 'change-to-css', 'inject-unminified', 'icons']);
