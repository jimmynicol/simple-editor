'use strict';

// Initialise Gulp and dependancies
var gulp =     require('gulp'),
    p =        require('gulp-load-plugins')({camelize: true}),
    stylish =  require('jshint-stylish'),
    util =     require('gulp-util'),
    lr =       require('tiny-lr')(),
    connect =  require('connect'),
    pkg =      require('./package.json');

// Directory configs
var config = {
  port: 8200
};

// Create a banner for distribution builds
var banner = ['/**',
  ' * ' + pkg.name + ' - ' + pkg.description,
  ' * @author     ' + pkg.author,
  ' * @repository ' + pkg.repository.url,
  ' * @link       ' + pkg.homepage,
  ' * @license    ' + pkg.license,
  ' */',
  '\n\n'].join('\n');


// -----
// Tasks
// -----

gulp.task('scripts', function(){
  gulp.src('lib/simple_editor.connector.js')
    .pipe(p.preprocess({
      context: {
        BANNER: banner,
        VERSION: pkg.version
      }
    }))
    .pipe(p.rename('simple_editor.js'))
    .pipe(gulp.dest('.'))
    .pipe(p.rename('simple_editor.min.js'))
    .pipe(p.uglify({ preserveComments: 'some' }))
    .pipe(gulp.dest('.'));
});

gulp.task('lint', function () {
  gulp.src(['simple_editor.js', 'gulpfile.js'])
    .pipe(p.jshint('.jshintrc'))
    .pipe(p.jshint.reporter(stylish));
});

gulp.task('lr', function(){
  lr.listen(config.port + 1, function(err){
    if (err) {
      return console.log(err);
    } else {
      util.log(
        'Livereload running on:',
        util.colors.magenta(config.port + 1)
      );
    }
  });
});

gulp.task('server', ['lr', 'scripts', 'lint'], function(){
  var middleware = [
    require('connect-livereload')({ port: config.port + 1 }),
    connect.static(__dirname),
    connect.directory(__dirname)
  ];

  var app = connect.apply(null, middleware),
      openPage = require('open'),
      server = require('http').createServer(app);

  server
    .listen(config.port)
    .on('listening', function() {
      util.log(
        'Started connect webserver on: ',
        util.colors.magenta('http://localhost:' + (config.port + 1))
      );
      openPage('http://localhost:' + config.port);
    });
});

gulp.task('watch', ['server'], function(){
  gulp.watch('lib/*.js', ['scripts', 'lint']);
  gulp.watch(
    ['index.html', 'simple_editor.js'],
    function(event){
    util.log('file changed:', util.colors.green(event.path));
    gulp.src(event.path).pipe(p.livereload(lr));
  });
});


gulp.task('dist', function(){
  var distFiles = [
    'index.html',
    'simple_editor.js',
    'bower_components/fundly-style-guide/dist/fundly-style.css'
  ];

  return gulp.src('dist/*', {read: false})
    .pipe(p.clean())
    .pipe(gulp.src(distFiles))
    .pipe(p.replace('bower_components/fundly-style-guide/dist/', ''))
    .pipe(gulp.dest('dist'))
    .pipe(gulp.src('bower_components/fundly-style-guide/dist/fonts/**/*.*'))
    .pipe(gulp.dest('dist/fonts'));
});


// --------
// Task for pushing the project to Github pages
// --------
gulp.task('bump:major', ['scripts', 'dist'], function(){
  gulp.src(['./bower.json', './package.json'])
    .pipe(p.bump({type:'major'}))
    .pipe(gulp.dest('./'));
});
gulp.task('bump:minor', ['scripts', 'dist'], function(){
  gulp.src(['./bower.json', './package.json'])
    .pipe(p.bump({type:'minor'}))
    .pipe(gulp.dest('./'));
});
gulp.task('bump:patch', ['scripts', 'dist'], function(){
  gulp.src(['./bower.json', './package.json'])
    .pipe(p.bump({type:'patch'}))
    .pipe(gulp.dest('./'));
});



// --------
// Task for pushing the project to Github pages
// --------
var ghRun = 0;
function ghPages(){
  var map = require('map-stream'),
      exec = require('child_process').exec,
      cmd = 'git push origin :gh-pages && git subtree push --prefix dist origin gh-pages';
      // cmd = 'git subtree push --prefix dist origin gh-pages';

  return map( function(file, cb){
    if (ghRun > 0){
      cb(null, file);
      return;
    }

    ghRun++;

    exec(cmd, {}, function(err, stdout, stderr){
      if(err) {
        util.log(err);
      } else {
        util.log(stdout, stderr);
      }

      cb(null, file);
    });
  });
}

gulp.task('gh-pages', ['scripts', 'dist'], function(){
  gulp.src('./dist/*')
    .pipe(p.git.add())
    .pipe(p.git.commit('dist build'))
    .pipe(p.git.push('origin', 'master'))
    .pipe(ghPages());
});
