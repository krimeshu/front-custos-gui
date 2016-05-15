/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({'ConstReplacer': ()=> require('../plugins/const-replacer.js')});

// 替换常量：
// - 替换常见常量（项目路径、项目名字等）
module.exports = function (console, gulp, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir,
            pattern = _path.resolve(workDir, '**/*@(.js|.css|.scss|.html|.shtml|.php)');

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'replace_const 任务开始……');

        var replacer = new plugins.ConstReplacer({
            PROJECT: Utils.replaceBackSlash(params.workDir),
            PROJECT_NAME: params.projName,
            VERSION: params.version
        });
        //replacer.doReplace(params);
        gulp.src(pattern)
            .pipe(plugins.plumber({'errorHandler': errorHandler}))
            .pipe(replacer.handleFile())
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'replace_const 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    };
};