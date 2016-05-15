/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

// 压缩CSS
// - 消除 css 文件中的缩进、换行符等字符，减小文件体积
module.exports = function (console, gulp, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_csso 任务开始……');
        gulp.src(_path.resolve(workDir, '**/*.css'))
            .pipe(plugins.plumber({'errorHandler': errorHandler}))
            .pipe(plugins.csso({
                restructure: false,
                sourceMap: false,
                debug: false
            }))
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_csso 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    };
};