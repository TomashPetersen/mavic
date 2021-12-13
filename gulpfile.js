const { src, dest, watch, parallel, series} = require('gulp');

const csslibs = ['node_modules/slick-slider/slick/slick.css', 'node_modules/fullpage.js/dist/fullpage.css']; 

const scss             = require('gulp-sass')(require('sass'));
const concat           = require('gulp-concat');
const browserSync      = require('browser-sync').create();
const uglify           = require('gulp-uglify-es').default;
const autoprefixer     = require('gulp-autoprefixer');
const imagemin         = require('gulp-imagemin');
const del              = require('del');
const clean            = require('gulp-clean-css');
const bulk             = require('gulp-sass-bulk-importer');
const map              = require('gulp-sourcemaps');
const chalk            = require('chalk');
const ttfToWoff2       = require('gulp-ttf2woff2');
const ttfToWoff        = require('gulp-ttf2woff');
const changed          = require('gulp-changed');

function styles () {
  return src('app/scss/style.scss')
    .pipe(map.init())
    .pipe(bulk())
    .pipe(scss({ outputStyle: 'compressed' }).on('error', scss.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 version'],
      browsers: [
        'Android >= 4',
        'Chrome >= 20',
        'Firefox >= 24',
        'Explorer >= 11',
        'iOS >= 6',
        'Opera >= 12',
        'Safari >= 6',
      ],
      grid: true
    }))
    .pipe(clean({
      level: 2
    }))
    .pipe(concat('style.min.css'))
    .pipe(map.write('../sourcemaps/'))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream());
}

function ttf (done) {
  src('app/fonts/**/*.ttf')
    .pipe(changed('app/fonts', {
      extension: '.woff2',
      hasChanged: changed.compareLastModifiedTime
    }))
    .pipe(ttfToWoff2())
    .pipe(dest('app/fonts'))

  src('app/fonts/**/*.ttf')
    .pipe(changed('app/fonts', {
      extension: 'woff',
      hasChanged: changed.compareLastModifiedTime
    }))
    .pipe(ttfToWoff())
    .pipe(dest('app/fonts'))
  done();
}

function libs_style (done) {
  if (csslibs.length > 0) {
    return src(csslibs)
      .pipe(map.init())
      .pipe(scss({
        outputStyle: 'compressed'
      }).on('error', scss.logError))
      .pipe(clean({
        level: 2
      }))
      .pipe(concat('libs.min.css'))
      .pipe(map.write('../sourcemaps/'))
      .pipe(dest('app/css/'))
  } else {
    return done(console.log(chalk.black.bgYellow('Don\'t worry, but no added CSS/SCSS libraries')));
  }
}

function cleanDist () {
  return del('dist');
}

function images () {
  return src('app/images/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest('build/images'));
}

function build () {
  return src([
      'app/css/*.min.css',
      'app/fonts/**/*',
      'app/js/main.min.js',
      'app/*.html',
      'app/sourcemaps/*',
      'app/images/**/*'
    ], {base: 'app'})
    .pipe(dest('dist'));
}

function watching () {
  watch(['app/scss/**/*.scss'], styles);
  watch(['app/js/**/*.js', '!app/js/**/main.min.js'], scripts);
  watch(['app/*.html']).on('change', browserSync.reload);
}

function browsersync () {
  browserSync.init({
    server: {
      baseDir: 'app/'
    }
  });
}

function scripts () {
  return src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/slick-slider/slick/slick.js',
    'node_modules/fullpage.js/dist/fullpage.js',
    'node_modules/fullpage.js/vendors/scrolloverflow.js',
    'app/js/main.js'
    ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream());

}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.libs_style = libs_style;
exports.ttf = ttf;

exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, libs_style, scripts, browsersync, watching);