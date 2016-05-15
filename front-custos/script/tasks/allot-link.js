/**
 * Created by krimeshu on 2016/5/14.
 */

var _path = require('path'),

    PluginLoader = require('../plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('../utils.js'),
    Timer = require('../timer.js');

PluginLoader.add({'FileLinker': ()=> require('../plugins/file-linker.js')});

// 分发链接：
// - 根据文件类型分发文件到不同的目录
// - 根据 #link 语法、CSS中 url() 匹配和 HTML 解析，自动提取并替换静态资源的链接
module.exports = function (console, gulp, params, config, errorHandler) {
    return function (done) {
        var workDir = params.workDir,
            alOpt = params.alOpt,

            htmlEnhanced = config.htmlEnhanced,
            flattenMap = config.flattenMap;

        alOpt.src = workDir;
        alOpt.flattenMap = flattenMap;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'allot_link 任务开始……');

        var linker = new plugins.FileLinker({
            // php代码处理异常时，请关闭 cheerio 解析
            htmlEnhanced: htmlEnhanced
        }, errorHandler);
        
        var fileAllotMap = {},                               // 用于记录文件分发前后的路径关系
            usedFiles = linker.analyseDepRelation(workDir); //记录分发前的文件依赖表
        // 1. 将构建目录中的文件进行分发和重链接，生成到分发目录中
        gulp.src(_path.resolve(workDir, '**/*'))
            .pipe(plugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(linker.handleFile(alOpt, fileAllotMap))
            .pipe(gulp.dest(workDir))
            .on('end', function () {
                // 2. 更新分发后的使用文件依赖关系表
                var recycledFiles = [],
                    allotedUsedFiles = [];
                for (var oldFile in fileAllotMap) {
                    if (fileAllotMap.hasOwnProperty(oldFile)) {
                        var newFile = fileAllotMap[oldFile];
                        oldFile !== newFile && recycledFiles.push(oldFile);
                    }
                }
                usedFiles.forEach(function (filePath) {
                    filePath = fileAllotMap[filePath] || filePath;
                    allotedUsedFiles.push(filePath);
                });
                params.usedFiles = allotedUsedFiles;

                //console.log('recycledFiles:', recycledFiles);
                //console.log('allotedUsedFiles:', allotedUsedFiles);
                // 3. 清空构建目录的过期旧文件
                var afterClean = function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'allot_link 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                };
                var cleanFailed = function (e) {
                    var err = new Error('输出目录清理失败，请检查浏览器是否占用目录');
                    err.detail = e;
                    errorHandler(err);

                    afterClean();
                };
                plugins.del(recycledFiles, {force: true}).then(afterClean).catch(cleanFailed);
            });
    };
};