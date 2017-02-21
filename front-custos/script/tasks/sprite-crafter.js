/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({ 'spriteCrafterProxy': () => require('../plugins/sprite-crafter-proxy.js') });

// 雪碧图处理：
// - 使用 Sprite Crafter（基于 spritesmith）解析CSS，自动合并雪碧图
module.exports = function (console, gulp, params, errorHandler, taskName) {
    return function (done) {
        var workDir = params.workDir,
            pattern = _path.resolve(workDir, '**/*@(.css)'),
            scOpt = params.scOpt;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务开始……');
        var files = [],
            maps = {};
        scOpt.src = workDir;
        gulp.src(pattern)
            .pipe(plugins.plumber({ 'errorHandler': errorHandler }))
            .pipe(plugins.spriteCrafterProxy.analyseUsedImageMap(files, maps))
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                scOpt.files = files;
                scOpt.maps = maps;
                plugins.spriteCrafterProxy.process(scOpt, function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
            });
    };
};