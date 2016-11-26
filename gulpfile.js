var gulp = require("gulp");
var sass = require("gulp-sass");
var sassGlob = require('gulp-sass-glob');
var ts = require("gulp-typescript");
var imagemin = require("gulp-imagemin");
var server = require('gulp-server-livereload');
var autoprefixer = require('gulp-autoprefixer');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var parse = require('./node_modules/gulp-parse');
var fs = require('fs');

var vendorScripts = [
	'bower_components/bootstrap/dist/js/bootstrap.min.js',
	'bower_components/jquery/dist/jquery.min.js',
	'bower_components/jquery-ui/jquery-ui.min.js',
	'bower_components/semantic/dist/semantic.min.js'
];

var vendorStyles = [
  'bower_components/bootstrap/dist/css/bootstrap.min.css',
  'bower_components/bootstrap/dist/css/bootstrap-theme.min.css',
  'bower_components/semantic/dist/**',
  // 'bower_components/font-awesome/css/font-awesome.min.css'
];

var vendorFonts = [
  // 'bower_components/font-awesome/fonts/fontawesome-webfont.ttf',
  // 'bower_components/font-awesome/fonts/fontawesome-webfont.woff',
  // 'bower_components/font-awesome/fonts/fontawesome-webfont.woff2',
  // 'bower_components/font-awesome/fonts/fontawesome-webfont.svg',
  // 'bower_components/font-awesome/fonts/fontawesome-webfont.eot'
];

function getFiles(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync((dir + "/" + file).replace('//', '/')).isFile();
    });
}

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
    gulp.watch(['src/json/*.json', 'src/json/bundles/*.json'], ['copy-json-fast']);
});

gulp.task("build", [
  "build-ugly-sass", 
  "build-ugly-typescript", 
  "copy-views", 
  "copy-images", 
  "copy-static", 
  "copy-vendor", 
  "copy-js", 
  "copy-json"
]);

gulp.task("build-fast", [
  "build-sass", 
  "build-typescript", 
  "copy-views", 
  "copy-images", 
  "copy-static", 
  "copy-vendor", 
  "copy-js", 
  "copy-json-fast"
]);

function sassPipe(){
	return gulp.src('src/sass/style.scss')
      .pipe(sassGlob())
      .pipe(sass())
      .pipe(autoprefixer({
            browsers: ['> 1%']
        }));
}

gulp.task("build-sass", function(){ 
    sassPipe()
      .pipe(gulp.dest('dist/css/'));
});

gulp.task("build-ugly-sass", function(){
    sassPipe()
      .pipe(uglifycss())
      .pipe(gulp.dest('dist/css/'));
});

function tsPipe(){
	return gulp.src('src/ts/**/*')
        .pipe(ts({
            out: 'compiled-ts.js',
            removeComments: false
        }))
}

gulp.task("build-typescript", function(){
    tsPipe()
        .pipe(gulp.dest('dist/js'))
});

gulp.task("build-ugly-typescript", function(){
    tsPipe()
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
});

gulp.task("copy-views", ['copy-json-fast'], function(){
    // gulp.src('src/views/**/*')
    //     .pipe(gulp.dest('dist'))
    gulp.src('src/index.html')
        .pipe(gulp.dest('dist'))
});

gulp.task("copy-images", function(){
    gulp.src('src/images/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/images'))
});

gulp.task("copy-json", ["copy-json-fast"], function(){
    gulp.src('src/json/movie-quotes/*.json')
        .pipe(gulp.dest('dist/json/movie-quotes'))

    gulp.src('src/json/serie-quotes/*.json')
        .pipe(gulp.dest('dist/json/serie-quotes'))
});

gulp.task("copy-json-fast", ["parse-views"], function(){
    gulp.src('src/json/*.json')
        .pipe(gulp.dest('dist/json'))

    gulp.src('src/json/bundles/*.json')
        .pipe(gulp.dest('dist/json/bundles'))
});

gulp.task("copy-static", function(){
    gulp.src('src/favicon.ico')
        .pipe(gulp.dest('dist'))

    gulp.src('src/robots.txt')
        .pipe(gulp.dest('dist'))
});

gulp.task("copy-js", function(){
    gulp.src('src/ts/**/*.js')
        .pipe(gulp.dest('dist/js'))
});

gulp.task('parse-views', ['preimport-views'], function(){
  gulp.src('src/views/**/*.html')
  .pipe(parse())
  .pipe(gulp.dest('dist'));
})

gulp.task('preimport-views', function(){
    var bundles = fs.readFileSync("src/bundles.json", {encoding : "UTF-8"});
    var bundlesJson = JSON.parse(bundles);

    for (var i = bundlesJson.length - 1; i >= 0; i--) {
    	var templateFile = bundlesJson[i].templateFile;
    	var filesFolder = bundlesJson[i].filesFolder;
    	var prefix = bundlesJson[i].prefix;

      var dir = templateFile.split('/');
      dir.pop();
      dir = dir.join('/');
      dir = 'dist/' + dir;
      dir = dir.replace(/\/\//g, '/');
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }

  		var files = getFiles(filesFolder);
     	bundlesJson[i].items = files;

        var bundle = {};
        for(var j in bundlesJson[i].items){
        var src = (filesFolder + "/" + bundlesJson[i].items[j]).replace('//', '/').replace(/^\//g, '');
        var dest = (prefix + "/" + bundlesJson[i].items[j]).replace('//', '/').replace(/^\//g, '');

        var content = fs.readFileSync(src, {encoding : "UTF-8"});
        bundlesJson[i].items[j] = dest;
        bundle[dest] = parse(content);
      }
      fs.writeFile("dist/" + templateFile, JSON.stringify(bundle));
    }

	fs.writeFile("dist/bundles.json", JSON.stringify(bundlesJson));
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