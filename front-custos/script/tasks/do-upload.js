/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({'FileUploader': ()=> require('../plugins/file-uploader.js')});

// 上传：
// - 将工作目录中的文件发到测试服务器
module.exports = function (console, gulp, params, config, errorHandler) {
    return function (done) {
        var workDir = params.workDir,

            upOpt = params.upOpt,

            uploadAll = upOpt.uploadAll,
            uploadPage = upOpt.page,
            uploadForm = upOpt.form,
            uploadJudge = upOpt.judge,

            concurrentLimit = config.concurrentLimit | 0;

        if (concurrentLimit < 1) {
            concurrentLimit = Infinity;
        }

        var uploader = new plugins.FileUploader({
            console: console,
            forInjector: params,

            uploadAll: uploadAll,
            uploadPage: uploadPage,
            uploadForm: uploadForm,
            uploadJudge: uploadJudge,
            concurrentLimit: concurrentLimit
        }, errorHandler);

        var timer = new Timer();
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_upload 任务开始……');

        gulp.src(_path.resolve(workDir, '**/*'))
            .pipe(plugins.plumber({'errorHandler': errorHandler}))
            .pipe(uploader.appendFile())
            .on('end', function () {
                var logId = console.genUniqueId && console.genUniqueId();
                uploader.start(function onProgress(results) {
                    // 完成一个文件时
                    var succeedCount = results.succeed.length,
                        failedCount = results.failed.length,
                        queueCount = results.queue.length,
                        info = 'do_upload 任务进度：' + succeedCount + '/' + queueCount +
                            (failedCount ? ', 失败：' + failedCount : '');
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), info);
                    //console.log('服务器回复：', response);
                }, function onComplete(results) {
                    // 完成所有文件时
                    var succeedCount = results.succeed.length,
                        failedCount = results.failed.length,
                        queueCount = results.queue.length,
                        unchangedCount = results.unchanged.length,
                        totalCount = results.totalCount,
                        resText = 'do_upload 任务结束' +
                            (queueCount ? '，上传' + queueCount + '个文件' : '') +
                            (succeedCount ? '，成功' + succeedCount + '个' : '') +
                            (failedCount ? '，失败' + failedCount + '个' : '') +
                            '。总计' + totalCount + '个文件' +
                            (unchangedCount === totalCount ? '，无任何文件变更' :
                                (unchangedCount ? '，其中' + unchangedCount + '个无变更' : '')) +
                            '。';
                    logId && console.useId && console.useId(logId);
                    console.info(Utils.formatTime('[HH:mm:ss.fff]'), resText + '（' + timer.getTime() + 'ms）');
                    if (succeedCount) {
                        console.log(succeedCount, '个文件上传成功：', results.succeed);
                    }
                    if (failedCount) {
                        console.log(failedCount, '个文件上传失败：', results.failed);
                    }
                    done();
                });
            });
    };
};