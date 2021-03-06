var gulp = require('gulp');
var mocha = require('gulp-mocha');
var sourcemaps = require("gulp-sourcemaps");
var babel = require('gulp-babel');
var del = require('del');
var path = require('path');

gulp.task('clean', function (cb) {
	del(["dist/**/*"], cb)
});

gulp.task('transpile', ['clean'], function () {
	return gulp.src(['src/**/*.js', 'test/**/*.js'], {nodir: true})
	.pipe(sourcemaps.init())
	.pipe(babel({stage: 0}))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest(function (vfile) {
		return path.join('dist', path.relative(vfile.cwd, vfile.base));
	}));
});

gulp.task('watch', function () {
    gulp.watch(['src/**/*.js', 'test/**/*.js'], ['test']);
});

gulp.task('test', ['transpile'], function () {
    return gulp.src('dist/test/**/*.spec.js', {read: false})
        .pipe(mocha({reporter: process.env.npm_config_reporter || 'nyan'}))
});
