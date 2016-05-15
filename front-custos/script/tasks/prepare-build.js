/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js'),
    DependencyInjector = require('../dependency-injector.js');

// 准备构建环境：
// - 清理构建目录
// - 复制工作目录文件到构建目录
// - 工作目录转移至构建目录
module.exports = function (console, gulp, params, errorHandler) {
    return function (done) {
        var workDir = params.workDir,
            buildDir = params.buildDir;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务开始……');
        var afterClean = function () {
            gulp.src([_path.resolve(workDir, '**/*'), '!*___jb_tmp___'])
                .pipe(plugins.plumber({'errorHandler': errorHandler}))
                .pipe(gulp.dest(buildDir))
                .on('end', function () {
                    // 工作目录转到构建目录
                    params.workDir = buildDir;

                    // 预处理脚本
                    var preprocessing;
                    try {
                        preprocessing = Utils.tryParseFunction(params.preprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的预处理脚本格式有误，请检查相关配置。');
                    }
                    try {
                        var injector = new DependencyInjector(params);
                        injector.registerMap({
                            params: params,
                            console: console
                        });
                        preprocessing && injector.invoke(preprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的预处理将本执行异常：', e);
                    }
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务结束。（' + timer.getTime() + 'ms）');

                    done();
                });
        };
        var cleanFailed = function (e) {
            var err = new Error('输出目录清理失败，请检查浏览器是否占用目录');
            err.detail = e;
            errorHandler(err);

            afterClean();
        };
        plugins.del([_path.resolve(buildDir, '**/*')], {force: true}).then(afterClean).catch(cleanFailed);
    };
};