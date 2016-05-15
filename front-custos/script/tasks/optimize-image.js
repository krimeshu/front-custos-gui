/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

// 优化图片：
// - Png图片有损压缩（PngQuant）
// - Jpg图片转为渐进式
// - Gif图片转为隔行加载
module.exports = {
    '': function (console, gulp) {
        return function (done) {
            var runSequence = plugins.runSequence.use(gulp);

            var timer = new Timer();
            var logId = console.genUniqueId && console.genUniqueId();
            logId && console.useId && console.useId(logId);
            console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'optimize_image 任务开始……');

            runSequence(['optimize_image:png', 'optimize_image:other'], function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'optimize_image 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
        };
    },
    'png': function (console, gulp, params, errorHandler) {
        return function (done) {
            var workDir = params.workDir;

            gulp.src(_path.resolve(workDir, '**/*.png'))
                .pipe(plugins.plumber({'errorHandler': errorHandler}))
                .pipe(plugins.cache(plugins.pngquant({
                    quality: '50-80',
                    speed: 4
                })(), {
                    fileCache: new plugins.cache.Cache({cacheDirName: 'imagemin-cache'})
                }))
                .pipe(gulp.dest(workDir))
                .on('end', done);
        };
    },
    'other': function (console, gulp, params, errorHandler) {
        return function (done) {
            var workDir = params.workDir;

            gulp.src(_path.resolve(workDir, '**/*.{jpg,gif}'))
                .pipe(plugins.plumber({'errorHandler': errorHandler}))
                .pipe(plugins.cache(plugins.imagemin({
                    progressive: true,
                    interlaced: true
                }), {
                    fileCache: new plugins.cache.Cache({cacheDirName: 'imagemin-cache'})
                }))
                .pipe(gulp.dest(workDir))
                .on('end', done);
        };
    }
};
