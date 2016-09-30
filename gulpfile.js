var gulp = require("gulp");
var sass = require("gulp-sass");
var sassGlob = require('gulp-sass-glob');
var ts = require("gulp-typescript");
var imagemin = require("gulp-imagemin");
var server = require('gulp-server-livereload');
var autoprefixer = require('gulp-autoprefixer');
var replace = require('gulp-replace');

var vendorScripts = [
	'bower_components/bootstrap/dist/js/bootstrap.min.js',
	'bower_components/jquery/dist/jquery.min.js',
	'bower_components/jquery-ui/jquery-ui.min.js',
	'bower_components/semantic/dist/semantic.min.js'
];

var vendorStyles = [
  'bower_components/bootstrap/dist/css/bootstrap.min.css',
  'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
  'bower_components/semantic/dist/semantic.min.css',
  'bower_components/font-awesome/css/font-awesome.min.css'
];

var vendorFonts = [
  'bower_components/font-awesome/fonts/fontawesome-webfont.ttf',
  'bower_components/font-awesome/fonts/fontawesome-webfont.woff',
  'bower_components/font-awesome/fonts/fontawesome-webfont.woff2',
  'bower_components/font-awesome/fonts/fontawesome-webfont.svg',
  'bower_components/font-awesome/fonts/fontawesome-webfont.eot'
];
 
gulp.task('serve', ['watch'], function() {
  gulp.src('dist')
    .pipe(server({
      livereload: true,
      defaultFile: "index.html",
      open: true,
      port: 3000
    }));
});

gulp.task("watch", ["build-fast"], function(){
    gulp.watch('src/sass/**', ['build-sass']);
    gulp.watch('src/ts/**', ['build-typescript']);
    gulp.watch('src/views/**', ['copy-views']);
    gulp.watch('src/index.html', ['copy-views']);
    gulp.watch('src/images/**', ['copy-images']);
    gulp.watch('src/**/*.js', ['copy-js']);
    gulp.watch('src/json/*.json', ['copy-json-flat']);
});

gulp.task("build-fast", ["build-sass", "build-typescript", "copy-views", "copy-images", "copy-static", "copy-vendor", "copy-js", "copy-json-flat"]);
gulp.task("build", ["build-sass", "build-typescript", "copy-views", "copy-images", "copy-static", "copy-vendor", "copy-js", "copy-json"]);

gulp.task("build-sass", function(){ 
    gulp.src('src/sass/style.scss')
      .pipe(sassGlob())
      .pipe(sass())
      .pipe(autoprefixer({
            browsers: ['> 1%']
        }))
      .pipe(gulp.dest('dist/css/'));
});

gulp.task("build-typescript", function(){
    gulp.src('src/ts/**/*')
        .pipe(ts({
            out: 'compiled-ts.js'
        }))
        .pipe(gulp.dest('dist/js'))
});

gulp.task("copy-views", function(){
    gulp.src('src/views/**/*')
        .pipe(gulp.dest('dist'))
    gulp.src('src/index.html')
        .pipe(gulp.dest('dist'))
});

gulp.task("copy-images", function(){
    gulp.src('src/images/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/images'))
});

gulp.task("copy-json", function(){
    gulp.src('src/json/**/*.json')
        .pipe(gulp.dest('dist/json'))
});

gulp.task("copy-json-flat", function(){
    gulp.src('src/json/*.json')
        .pipe(gulp.dest('dist/json'))
});

gulp.task("copy-static", function(){
    gulp.src('src/favicon.ico')
        .pipe(gulp.dest('dist'))
    gulp.src('src/robots.txt')
        .pipe(gulp.dest('dist'))
    gulp.src('src/sitemap.xml')
        .pipe(gulp.dest('dist'))
});

gulp.task("copy-js", function(){
    gulp.src('src/ts/**/*.js')
        .pipe(gulp.dest('dist/js'))
});

gulp.task('preimport-views', function(){
  var indexTsFile = 'src/ts/index.ts';
  var tempaltesFolder = 'src/views/templates/*.html'
  var viewsFolder = 'src/views/*.html'
})

gulp.task("copy-vendor", function(){
	for(var i in vendorScripts){
	    gulp.src(vendorScripts[i])
	        .pipe(gulp.dest('dist/js/vendor'))
    }
  for(var i in vendorStyles){
      gulp.src(vendorStyles[i])
          .pipe(gulp.dest('dist/css/vendor'))
    }
  for(var i in vendorFonts){
      gulp.src(vendorFonts[i])
          .pipe(gulp.dest('dist/css/fonts'))
    }
});