// Include gulp requirements
var gulp = require('gulp'),
    cache = require('gulp-cache'),
    concat = require('gulp-concat'),
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
    dest = './target/classes/build/';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + '**/angular.min.js',
            prefix + '**/angular-ui-router.min.js',
            prefix + '**/ui-bootstrap.min.js',
            prefix + '**/js/vendor/**/*.js',
            prefix + '**/js/custom/filters/*.js',
            prefix + '**/js/custom/services/*.js',
            prefix + '**/js/custom/directives/*.js',
            prefix + '**/modules/**/*/services/**/*.js',
            prefix + '**/modules/**/*/directives/**/*.js',
            prefix + '**/modules/**/*.js',
            prefix + '**/app.module.js',
            prefix + '**/route.config.js'
        ]
    },
    styleFiles = function(prefix, suffix) {
        return [
            prefix + '**/css/vendor/ng-tags-input.min.' + suffix,
            prefix + '**/css/vendor/ng-tags-input.bootstrap.min.' + suffix,
            prefix + '**/css/vendor/**/*.' + suffix,
            prefix + '**/css/custom/**/*.' + suffix,
            prefix + '**/modules/**/*.' + suffix
        ]
    };

// Inject method for minified and unminified
var myInject = function(files) {
    return gulp.src(dest + 'index.html')
        .pipe(inject(
            gulp.src(files, {read: false}),
            {relative: true}
        ))
        .pipe(gulp.dest(dest));
};

// Concatenate and minifies JS Files, right now, manually selecting the bower js files we want
gulp.task('minify-scripts', function() {
    return gulp.src(jsFiles(src))
        .pipe(concat('main.js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'js'));
});

// Concatenates and minifies CSS Files
gulp.task('minify-css', function() {
    var sassFiles = gulp.src(styleFiles(src, 'scss'))
            .pipe(sass().on('error', sass.logError)),
        cssFiles = gulp.src(styleFiles(src, 'css'));
    return es.concat(cssFiles, sassFiles)
        .pipe(concat('main.css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifyCss())
        .pipe(gulp.dest(dest + 'css'));
});

// Injects minified CSS and JS files
gulp.task('inject-minified', ['minify-scripts', 'minify-css', 'html'], function() {
    return myInject([dest + '**/*.js', dest + '**/*.css']);
});

// Compresses images
gulp.task('images', function() {
    return gulp.src(src + 'img/**/*')
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

// Moves all of the html files to build folder
gulp.task('fonts', function() {
    return gulp.src([src + '**/fonts/*'])
        .pipe(flatten())
        .pipe(gulp.dest(dest + '/fonts'));
});

// Moves the file to the bundle expected location
gulp.task('prepare-for-bundle', function() {
    return gulp.src([dest + '**/*', src + '**/*.json'])
        .pipe(gulp.dest('target/classes/build'));
});

// Moves all files to build folder
gulp.task('move-all', function() {
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
gulp.task('inject-unminified', ['move-all', 'change-to-css'], function() {
    return myInject(jsFiles(dest).concat(styleFiles(dest, 'css')));
});

// Deletes old build directory
gulp.task('clean', function() {
    del([dest]);
});

// Production Task (minified)
gulp.task('prod', ['minify-scripts', 'minify-css', 'images', 'html', 'fonts', 'inject-minified']);

// Default Task (un-minified)
gulp.task('default', ['move-all', 'change-to-css', 'inject-unminified']);
