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
    '': function (console, gulp, params, errorHandler, taskName) {
        return function (done) {
            var workDir = params.workDir;

            var timer = new Timer();
            var logId = console.genUniqueId && console.genUniqueId();
            logId && console.useId && console.useId(logId);
            console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务开始……');

            gulp.src(_path.resolve(workDir, '**/*.{jpg,gif,png,svg}'))
                .pipe(plugins.plumber({ 'errorHandler': errorHandler }))
                .pipe(plugins.cache(plugins.imagemin([
                    plugins.imagemin.gifsicle({ interlaced: true }),
                    plugins.imagemin.jpegtran({ progressive: true }),
                    // plugins.imagemin.optipng({optimizationLevel: 5}),
                    plugins.pngquant({ quality: '50-80', speed: 4 }),
                    plugins.imagemin.svgo({ plugins: [{ removeViewBox: false }] })
                ]), {
                        fileCache: new plugins.cache.Cache({ cacheDirName: 'imagemin-cache' })
                    }))
                .pipe(gulp.dest(workDir))
                .on('end', function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
        };
    },
    'clear_cache': function (console, taskName) {
        return function (done) {
            var timer = new Timer();
            var logId = console.genUniqueId && console.genUniqueId();
            logId && console.useId && console.useId(logId);
            console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 清空缓存中……');
            return plugins.cache.clearAll(function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 缓存清空完毕。（' + timer.getTime() + 'ms）');
                done();
            });
        };
    }
};
