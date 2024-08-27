const gulp = require('gulp');
const pug = require('gulp-pug');
const formatHtml = require('gulp-format-html');
const clean = require('gulp-clean');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const replace = require('gulp-token-replace');
const uglifycss = require('gulp-uglifycss');
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const argv = require('yargs').argv;

const buildPath = 'dist'
const imgFileExtensions = 'png,gif,jpg,jpeg,svg'
const localDevUrl = "http://localhost:3000"
const localBuildResourcePath = 'src/localBuild'
const defaultLanguage = 'en';

const paths = {
  source: 'src',
  destination: 'dist',
  configuration: 'src/config.json',
  localization: 'src/localization-config.json',
  brand: 'src/brand-config.json'
};

readConfig(() => console.log('finished reading config'));

function reload(done) {
  browserSync.reload();
  done();
}

function cleanOutput() {
    return gulp.src(`${buildPath}`, { allowEmpty: true })
        .pipe(clean())
}

function cleanDevTemplates() {
  return gulp.src(`${buildPath}/devTemplates`, { allowEmpty: true })
      .pipe(clean())
}

function readConfig(done) {
  config = getMergedJsonEnv(paths.configuration);
  localizationConfig = JSON.parse(fs.readFileSync(paths.localization));
  done();
}

function setLocalhostConfig(done) {
  config.baseUrl = localDevUrl;
  config.cacheBustingKey = uuid();
  config.isLocalDev = argv.local;

  done();
}

function styles() {
  let sourceFiles = ['src/styles/*.scss'];
  if(config.isLocalDev) {
    sourceFiles.push(`${localBuildResourcePath}/styles/*.scss`)
  }

  let result = gulp.src(sourceFiles)
                  .pipe(sourcemaps.init())
                  .pipe(sass({outputStyle: 'expanded'}))
                  .pipe(sourcemaps.write('.'))
                  .pipe(gulp.dest(`${buildPath}/css`))
                  .pipe(browserSync.reload({ stream: true }));

  return result;
}

// Template step can't handle minified css - expanded output with minify later for now
function prodStyles() {
  return (
    gulp.src('src/styles/*.scss')
        .pipe(sass({
          outputStyle: 'expanded',
          sourceComments: false
        }))
        .pipe(gulp.dest(`${buildPath}/css`))
  )
}

function templateCss() {
  return gulp.src(`${buildPath}/css/*.css`)
            .pipe(replace({global: config}))
            .pipe(gulp.dest(`${buildPath}/css`));
}

function minifyCss() {
  return (
    gulp.src(`${buildPath}/css/*.css`)
    .pipe(uglifycss({
      "maxLineLen": 80,
      "uglyComments": true
    }))
    .pipe(gulp.dest(`${buildPath}/css`, { overwrite: true }))
  )
}

function scripts() {
  return (
      gulp.src('src/js/*.js')
          .pipe(gulp.dest(`${buildPath}/js`))
  )
}

function localDevScripts() {
  return (
      gulp.src(`${localBuildResourcePath}/js/*.js`)
          .pipe(gulp.dest(`${buildPath}/js`))
  )
}

function copyDevTemplates() {
  return (
    gulp.src(`${localBuildResourcePath}/devTemplates/*.html`)
        .pipe(gulp.dest(`${buildPath}/devTemplates`))
  )
}

function prodScripts() {
  return (
    gulp.src('src/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(`${buildPath}/js`))
  )
}

function cleanHtml() {
  let result = gulp.src(`${buildPath}/*.html`)
  .pipe(formatHtml({
      preserve_newlines: false
  }))
  .pipe(gulp.dest(`${buildPath}`));

  return result;
}

const minifyImages = () => (
  gulp.src(`${buildPath}/assets/**/*.{${imgFileExtensions}}`)
      .pipe(imagemin({ verbose: true }))
      .pipe(gulp.dest(`${buildPath}/assets`, { overwrite: true }))
);

function copyImages() {
  return gulp.src('src/assets/**/*')
             .pipe(gulp.dest(`${buildPath}/assets`))
}

function build() {
  let gulpVars = config;
  gulpVars.localization = localizationConfig[defaultLanguage];
  let result = gulp.src("src/templates/*.pug")
                    .pipe(pug({
                        data: gulpVars
                    }))
                    .pipe(gulp.dest(`${buildPath}`));

  return result;
}

function startBrowserSync(done) {
  browserSync({
    open: true,
    server: {
      baseDir: buildPath,
      directory: true,
      middleware: function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  });

  done();
}

function getMergedJsonEnv(configPath) {
  let config = JSON.parse(fs.readFileSync(configPath));
  let kvPairs = Object.entries(process.env).filter(([key]) => key.startsWith("UIBUILD_")).map(function(a) {
      a[0] = a[0].substring(a[0].indexOf("_") + 1);
      return a;
  });
  let envVars = Object.fromEntries(kvPairs);

  // Overwrite config with environment variables while adding any new environment variables to the new config.
  let newConfig = {
    ...config,
    ...envVars
  }

  return newConfig;
}


function watchPugFiles() {
  return gulp.watch(['src/**/*.pug'], gulp.series(build, cleanHtml, reload));
}

function watchScss() {
  return gulp.watch(['src/styles/**/*.scss'], gulp.series(styles, templateCss));
}

function watchLocalBuild() {
  return gulp.watch([`${localBuildResourcePath}/**/*`], gulp.series(localDevScripts, cleanDevTemplates, copyDevTemplates)).on('all', browserSync.reload)
}

function watchJsFiles() {
  return gulp.watch(['src/**/*.js'], gulp.series(scripts, reload));
}

function watchConfigFiles() {
  return gulp.watch(['src/*.json'], gulp.series(readConfig, ...localBuildTasks, reload));
}

function watchAssets() {
  return gulp.watch(['src/assets/**/*'], gulp.series(copyImages)).on('all', browserSync.reload);
}

let commonBuildTasks = [build, copyImages, cleanHtml];
let localBuildTasks = [setLocalhostConfig, build, copyImages, cleanHtml, styles, templateCss, scripts];

let commonBuild = gulp.series(cleanOutput, ...commonBuildTasks);
let localBuildCommon = gulp.series(cleanOutput, ...localBuildTasks);
let localBuildTemplate = gulp.series(localBuildCommon, localDevScripts, copyDevTemplates);

exports.localDev = gulp.series(localBuildTemplate, gulp.parallel(startBrowserSync, watchPugFiles, watchScss, watchJsFiles, watchConfigFiles, watchAssets, watchLocalBuild));
exports.b2cServe = gulp.series(localBuildCommon, gulp.parallel(startBrowserSync, watchPugFiles, watchScss, watchJsFiles, watchConfigFiles, watchAssets));
exports.dev = gulp.series(commonBuild, styles, templateCss, scripts);
exports.prod = gulp.series(commonBuild, prodStyles, templateCss, minifyCss, prodScripts, minifyImages);
