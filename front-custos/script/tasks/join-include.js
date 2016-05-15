/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({'FileIncluder': ()=> require('../plugins/file-includer.js')});

// 合并文件：
// - 根据 #include 包含关系，合并涉及到的文件
module.exports = function (console, gulp, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir;
        var includer = new plugins.FileIncluder(errorHandler);

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'join_include 任务开始……');
        var fileList = includer.analyseDepRelation(workDir);
        gulp.src(fileList, {base: workDir})
            .pipe(plugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(includer.handleFile())
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'join_include 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    };
};