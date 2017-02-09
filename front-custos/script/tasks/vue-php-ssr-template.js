/**
 * Created by krimeshu on 2017/2/9.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({'VuePhpSsrTemplateCompiler': ()=> require('../plugins/vue-php-ssr-template-compiler.js')});

// 处理Vue-PHP模板：
// - 尝试将简单的 Vue 模板转译成 PHP 可用的模板
module.exports = function (console, gulp, params, config, errorHandler, taskName) {
    return function (done) {
        var workDir = params.workDir,
            pattern = _path.resolve(workDir, '**/*@(.html|.shtml|.php)');
        var compiler = new plugins.VuePhpSsrTemplateCompiler(errorHandler);

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务开始……');
        gulp.src(pattern)
            .pipe(plugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(compiler.handleFile())
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), taskName + ' 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    };
};