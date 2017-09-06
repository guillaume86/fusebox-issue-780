// @ts-check-x
const gulp = require("gulp");
const runSequence = require("run-sequence");
const hash_src = require("gulp-hash-src");
const htmlmin = require("gulp-htmlmin");
const clean = require("gulp-clean");
const open = require("gulp-open");
const inject = require("gulp-inject");
const path = require("path");
const serveStatic = require("serve-static");

// help fuse-box figure out the project path
process.env.PROJECT_ROOT = __dirname;
const fsbx = require("fuse-box");

// paths
const srcPath = 'src/';
const devPath = '.fusebox/dev/';
const prodPath = 'dist/';

// fusebox config
const alias = {
  "src": "~/",
};

const copyHtml = (destPath) => {

  return gulp.src(srcPath + "index.html")
    .pipe(gulp.dest(destPath));
};

gulp.task("dev:copy-html", () => {
  return copyHtml(devPath);
});

const Development = () => {

  const fuse = fsbx.FuseBox.init({
    homeDir: srcPath,
    tsConfig : srcPath + "tsconfig.json",
    output: devPath + "$name.js",
    cache: true,
    //sourceMaps: true,
    target: "browser",
    plugins:[
      fsbx.JSONPlugin(),
      [
        fsbx.LESSPlugin(), 
        fsbx.CSSPlugin()
      ],
    ],
    alias,
  });

  fuse.dev({ 
    root: devPath, 
    port : 3000,
  });

  const vendor = fuse.bundle("vendor")
    .instructions(`~ application.tsx`);

  const app = fuse.bundle("app")
    .instructions("!> [application.tsx]");

  //vendor.hmr().watch();
  app.hmr().watch();

  return fuse.run();
}

gulp.task('dev:open-browser', () => {
  var options = {
    uri: 'http://localhost:3000'
  };
  gulp.src(__filename)
    .pipe(open(options));
});

gulp.task('dev:fuse', () => {
  Development().then(() => {
    gulp.start('dev:open-browser');
  });
})

gulp.task("dev", () => {
  return runSequence('dev:copy-html', 'dev:fuse');
});

gulp.task('dev:clean', function() {
  return gulp.src('.fusebox', { read: false })
    .pipe(clean());
});

gulp.task("dist:fuse", () => {

  const fuse = fsbx.FuseBox.init({
    homeDir: srcPath,
    tsConfig : srcPath + "tsconfig.json",
    output: prodPath + "$name.js",
    cache: false,
    sourceMaps: true,
    target: "browser",
    plugins:[
      fsbx.JSONPlugin(),
      [
        fsbx.LESSPlugin(), 
        fsbx.CSSPlugin({ 
          group: 'app.css', 
          outFile: prodPath + "app.css",
          inject: false,
          minify: true,
        }),
      ],
      fsbx.ReplacePlugin({ 
        "process.env.NODE_ENV": JSON.stringify("production"),
      }),
      fsbx.UglifyJSPlugin(),
    ],
    alias,
  });

  const vendor = fuse.bundle("vendor")
    .instructions(`~ application.tsx`);

  const app = fuse.bundle("app")
    .instructions("!> [application.tsx]");

  return fuse.run()
    .then(x => { /* required for gulp to wait? */ });

});

gulp.task("dist:hash-src", function() {
  return copyHtml(prodPath)
    .pipe(htmlmin())
    .pipe(hash_src({ verbose: true, build_dir: `./${prodPath}`, src_path: `./${prodPath}` }))
    .pipe(gulp.dest(`./${prodPath}`))
  });

gulp.task('dist:clean', function() {
  return gulp.src(prodPath, { read: false })
    .pipe(clean());
});

gulp.task("dist", () => {
    return runSequence('dist:clean', 'dist:fuse', 'dist:hash-src')
});

gulp.task('clean', [ 'dev:clean', 'dist:clean' ]);

gulp.task('default', ['dev']);