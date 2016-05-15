/**
 * Created by krimeshu on 2016/1/10.
 */

var _os = require('os'),
    _path = require('path'),

    TaskManager = require('./script/task-manager.js'),
    PluginLoader = require('./script/plugin-loader.js'),
    plugins = PluginLoader.plugins,

    Utils = require('./script/utils.js'),
    Timer = require('./script/timer.js'),
    ConsoleProxy = require('./script/console-proxy.js'),
    TaskErrorHandler = require('./script/task-error-handler.js'),
    FilenameHelper = require('./script/filename-helper.js');

PluginLoader.add({'ConstReplacer': ()=> require('./script/plugins/const-replacer.js')});

var config = {delUnusedFiles: true},
    running = false,
    taskManager = new TaskManager();

module.exports = {
    // 编译前后文件名转换管理
    FilenameHelper: FilenameHelper,
    // 接管console
    takeOverConsole: ConsoleProxy.takeOverConsole.bind(ConsoleProxy),
    // 所有可用任务列表
    availableTasks: taskManager.availableTasks,
    // 补全并按序排列任务
    fillAndOrderTasks: taskManager.fillAndOrderTasks.bind(taskManager),
    // 直接执行任务
    runTasks: function (_params, cb) {
        if (running) {
            return;
        }
        var params = _params || {},
            tasks = params.tasks || [];
        tasks.push(function () {
            running = false;
            cb && cb();
        });
        running = true;
        // 清空出错记录
        TaskErrorHandler.clearErrorRecords();
        taskManager.runTasks(_params, config);
    },
    // 是否任务中
    isRunning: function () {
        return running;
    },
    // 获取最近任务的出错记录
    getErrorRecords: TaskErrorHandler.getErrorRecords.bind(TaskErrorHandler),
    // 设置通用配置
    setConfig: function (_config) {
        config = _config;
    },
    // 根据项目配置计算出项目源目录
    getSrcDir: function (params) {
        var projDir = params.projDir || params.srcDir,
            innerSrcDir = params.innerSrcDir || '';
        return innerSrcDir ? _path.resolve(projDir, innerSrcDir) : projDir;
    },
    // 根据项目配置计算出项目输出目录
    getDistDir: function (params, outputDir) {
        var projDir = params.projDir || params.srcDir,
            projName = _path.basename(params.projDir),
            innerDistDir = params.innerDistDir || '';
        return innerDistDir ? _path.resolve(projDir, innerDistDir) : _path.resolve(outputDir, projName);
    },
    // 开始处理并执行任务
    process: function (_params, cb) {
        var console = ConsoleProxy.console;
        if (running) {
            return;
        }
        var params = _params || {};
        // 处理项目基本配置
        var projDir = params.projDir || params.srcDir,
            projName = _path.basename(params.projDir),
            version = params.version || '';

        if (!projDir) {
            console.error(Utils.formatTime('[HH:mm:ss.fff]'), '开始任务前，请指定一个项目目录。');
            return;
        }

        // 处理项目源、构建、发布目录路径
        var buildDir = _path.resolve(_os.tmpdir(), 'FC_BuildDir', projName),
            srcDir = this.getSrcDir(params),
            distDir = this.getDistDir(params, config.outputDir);

        params.projName = projName;
        params.buildDir = buildDir;
        params.srcDir = srcDir;
        params.distDir = !params.keepOldCopy ? distDir : _path.resolve(distDir, version);
        params.version = version;

        params.workDir = params.workDir || params.srcDir;

        // 生成项目常量并替换参数中的项目常量
        var replacer = new plugins.ConstReplacer({
            PROJECT: Utils.replaceBackSlash(params.workDir),
            PROJECT_NAME: params.projName,
            VERSION: params.version
        });
        replacer.doReplace(params);

        var timer = new Timer();
        console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + projName + ' 任务开始……');
        this.runTasks(params, function () {
            console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + projName + ' 任务结束。（共计' + timer.getTime() + 'ms）');
            cb && cb();
        });
    }
};
