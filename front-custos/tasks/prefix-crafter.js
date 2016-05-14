/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    Utils = require('../script/utils.js'),
    Timer = require('../script/timer.js'),
    PrefixCrafterProxy = require('../script/prefix-crafter-proxy.js');

// 前缀处理：
// - 使用 Prefix Crafter（基于 autoprefixer）处理CSS，自动添加需要的浏览器前缀
module.exports = function (console, gulp, plugins, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir,
            pattern = _path.resolve(workDir, '**/*@(.css)'),
            pcOpt = params.pcOpt;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prefix_crafter 任务开始……');
        gulp.src(pattern)
            .pipe(plugins.plumber({'errorHandler': errorHandler}))
            .pipe(PrefixCrafterProxy.process(pcOpt, errorHandler))
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prefix_crafter 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    };
};