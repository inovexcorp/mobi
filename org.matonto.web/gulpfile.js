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
    uglify = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    strip = require('gulp-strip-comments'),
    jasmine = require('gulp-jasmine-phantom'),
    ngdocs = require('gulp-ngdocs'),
    glob = require('glob-all'),
    templateCache = require('gulp-angular-templatecache');

// Project specific path variables
var src = './src/main/resources/public/',
    dest = './target/classes/build/',
    nodeDir = './node_modules/';

// JS and CSS file lists
// NOTE: This is where we determine the order in which JS files are loaded
var jsFiles = function(prefix) {
        return [
            prefix + 'js/services/responseObj.js',
            prefix + 'js/services/prefixes.js',
            prefix + 'js/services/annotationManager.js',
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
            prefix + 'codemirror/**/codemirror.js',
            prefix + 'codemirror/**/sparql.js',
            prefix + 'codemirror/**/matchbrackets.js',
            prefix + 'angular/**/angular.min.js',
            prefix + 'angular-mocks/**/angular-mocks.js',
            prefix + 'angular-animate/**/angular-animate.js',
            prefix + 'angular-ui-router/**/angular-ui-router.min.js',
            prefix + 'angular-uuid/**/angular-uuid.js',
            prefix + 'angular-cookies/**/angular-cookies.min.js',
            prefix + 'angular-ui-codemirror/**/ui-codemirror.js',
            prefix + 'angular-messages/**/angular-messages.min.js',
            prefix + 'ui-select/**/select.min.js'
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
            prefix + 'bootstrap/**/bootstrap.min.css',
            prefix + 'font-awesome/**/font-awesome.min.css',
            prefix + 'ui-select/**/select.min.css',
            prefix + 'codemirror/**/codemirror.css'
        ]
    };

//Method to create frontend documentation
var createDocs = function(scripts) {
    var options = {
        scripts: glob.sync(scripts.concat('./target/templates.js')),
        title: "MatOnto Frontend Docs",
        loadDefaults: {
            angularAnimate: false,
            angular: false
        }
    };
    return gulp.src(src + '**/*.js')
        .pipe(ngdocs.process(options))
        .pipe(gulp.dest('./target/generated-docs'));
}

//Method to run jasmine tests
var runJasmine = function(vendorFiles) {
    return gulp.src('./src/test/js/*Spec.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(jasmine({
            integration: true,
            abortOnFail: true,
            keepRunner: './target/',
            vendor: vendorFiles.concat(['./target/templates.js', './src/test/js/Shared.js']),
            jasmineVersion: '2.1'
        }));
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

gulp.task('cacheTemplates', function() {
    return gulp.src(src + '**/*.html')
        .pipe(strip.html())
        .pipe(templateCache({standalone: true}))
        .pipe(gulp.dest('./target/'));
});

gulp.task('jasmine-minified', ['cacheTemplates', 'minify-scripts'], function() {
    return runJasmine([dest + '**/*.js']);
});

gulp.task('jasmine-unminified', ['cacheTemplates', 'move-custom-js'], function() {
    return runJasmine(nodeJsFiles(nodeDir).concat(jsFiles(dest)));
});

gulp.task('ngdocs-minified', ['jasmine-minified'], function() {
    return createDocs([dest + '**/*.js']);
});

gulp.task('ngdocs-unminified', ['jasmine-unminified'], function() {
    return createDocs(nodeJsFiles(dest + 'js/').concat(jsFiles(dest)));
});

// Concatenate and minifies JS Files
gulp.task('minify-scripts', function() {
    var nodeFiles = gulp.src(nodeJsFiles(nodeDir));
    var customFiles = gulp.src(jsFiles(src))
        .pipe(babel({
            presets: ['es2015']
        }));

    return queue({ objectMode: true }, nodeFiles, customFiles)
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

// Moves all custom non-js files to build folder
gulp.task('move-custom-not-js', ['html'], function() {
    return gulp.src(src + '**/*')
        .pipe(ignore.exclude('**/*.scss'))
        .pipe(ignore.exclude('**/*.js'))
        .pipe(ignore.exclude('**/*.html'))
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
    var allJsFiles = nodeJsFiles(dest + 'js/').concat(jsFiles(dest)),
        allStyleFiles = nodeStyleFiles(dest + 'css/').concat(styleFiles(dest, 'css')),
        allFiles = allJsFiles.concat(allStyleFiles);
    return injectFiles(allFiles);
});

// Get icons from font-awesome for minified build
gulp.task('icons-minified', function() {
    return gulp.src(nodeDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest(dest + 'fonts'));
});

// Get icons from font-awesome for un-minified build
gulp.task('icons-unminified', function() {
    return gulp.src(nodeDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest(dest + 'css/fonts'));
});

// Production Task (minified)
gulp.task('prod', ['jasmine-minified', 'minify-scripts', 'minify-css', 'html', 'inject-minified', 'icons-minified', 'ngdocs-minified']);

// Default Task (un-minified)
gulp.task('default', ['jasmine-unminified', 'move-custom-js', 'move-custom-not-js', 'change-to-css', 'inject-unminified', 'icons-unminified', 'ngdocs-unminified']);
