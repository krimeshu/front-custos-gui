/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    Utils = require('../script/utils.js'),
    Timer = require('../script/timer.js'),
    ConstReplacer = require('../script/const-replacer.js');

// 替换常量：
// - 替换常见常量（项目路径、项目名字等）
module.exports = function (console, gulp, plugins, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir,
            pattern = _path.resolve(workDir, '**/*@(.js|.css|.scss|.html|.shtml|.php)');

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'replace_const 任务开始……');

        var replacer = new ConstReplacer({
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