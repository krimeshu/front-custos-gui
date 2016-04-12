/**
 * Created by krimeshu on 2016/4/3.
 */

var _path = require('path'),

    _watch = require('watch');

var Logger = require('./logger.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js');

var getDelayTime = function () {
    return Model.config.watchDelayTime;
};

var FrontCustos = {
    unloaded: true,
    loadPlugin: function () {
        var gulp = require('../front-custos/node_modules/gulp');
        FrontCustos = require('../front-custos');
        FrontCustos.takeOverConsole(Logger);
        FrontCustos.registerTasks(gulp);
    }
};

// 补充可能缺少的默认任务参数
var fillTasks = function (fcOpt) {
    var tasks = fcOpt.tasks,
        uploadPos = tasks.indexOf('do_upload');
    if (tasks.indexOf('prepare_build') < 0) {
        tasks.splice(0, 0, 'prepare_build');
    }
    if (tasks.indexOf('do_dist') < 0) {
        if (uploadPos >= 0) {
            tasks.splice(uploadPos++, 0, 'do_dist');
        } else {
            tasks.push('do_dist');
        }
    }
    if (uploadPos >= 0) {
        tasks.splice(uploadPos, 1);
    }
};

var isRunning = function () {
    FrontCustos.unloaded && FrontCustos.loadPlugin();
    return FrontCustos.isRunning.apply(FrontCustos, arguments);
};

var getSrcDir = function (fcOpt) {
    FrontCustos.unloaded && FrontCustos.loadPlugin();
    return FrontCustos.getSrcDir.apply(FrontCustos, arguments);
};

var getDistDir = function () {
    FrontCustos.unloaded && FrontCustos.loadPlugin();
    return FrontCustos.getDistDir.apply(FrontCustos, arguments);
};

var doBuild = function (fcOpt, cb) {
    if (isRunning()) {
        return;
    }
    FrontCustos.config(Model.config);
    var params = Utils.deepCopy(fcOpt);
    Logger.log('<hr/>');
    FrontCustos.process(params, function () {
        cb && cb(params);
    });
};

var doUpload = function (params, cb) {
    if (isRunning()) {
        return;
    }
    params.errors = [];
    params.tasks = ['do_upload'];
    FrontCustos.runTasks(params, function () {
        cb && cb(params);
    });
};

var watch = function (_projWithOpt) {
    _projWithOpt.watchToRebuilding = true;

    var projWithOpt = Utils.deepCopy(_projWithOpt),
        id = projWithOpt.id,
        projName = projWithOpt.projName,
        projDir = projWithOpt.projDir;

    var pos = Model.watchingProjIds.indexOf(id);
    if (pos >= 0) {
        return;
    } else {
        Model.watchingProjIds.push(id);
    }

    fillTasks(projWithOpt);
    var rebuild = debounce(function () {
        Logger.info('<hr/>');
        Logger.info('监听到变化，执行项目构建：%c%s', 'color: white;', projName);
        doBuild(projWithOpt, function (params) {
            Logger.info('监听项目构建完毕：%c%s', 'color: white;', projName);
            Model.config.watchToUploading && doUpload(params, function () {
                Logger.info('监听构建上传完毕：%c%s', 'color: white;', projName);
            });
        });
    }, getDelayTime);

    Logger.info('开始监听项目：%c%s', 'color: white;', projName);
    _watch.watchTree(projDir, {
        ignoreDotFiles: true,
        interval: 2004,
        filter: function (f) {
            var baseName = _path.basename(f),
                ignoreNames = ['package.json'];
            return ignoreNames.indexOf(baseName) < 0;
        }
    }, function (f, curr, prev) {
        if (typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
        } else if (prev === null) {
            // f is a new file
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 创建了文件: ', f);
            rebuild();
        } else if (curr.nlink === 0) {
            // f was removed
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 删除了文件: ', f);
            rebuild();
        } else {
            // f was changed
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 修改了文件: ', f);
            rebuild();
        }
    });
};

var unwatch = function (_projWithOpt) {
    _projWithOpt.watchToRebuilding = false;

    var projWithOpt = Utils.deepCopy(_projWithOpt),
        id = projWithOpt.id,
        projName = projWithOpt.projName,
        projDir = projWithOpt.projDir;

    var pos = Model.watchingProjIds.indexOf(id);
    if (pos < 0) {
        return;
    } else {
        Model.watchingProjIds.splice(pos, 1);
    }

    Logger.info('停止监听项目：%c%s', 'color: white;', projName);
    _watch.unwatchTree(projDir);
};

var debounce = function (func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function () {
        // 据上一次触发时间间隔
        var last = Date.now() - timestamp,
            waitTime = typeof(wait) === 'function' ? wait() : wait;
        // 上次被包装函数被调用时间间隔last小于设定时间间隔wait
        if (last < waitTime && last > 0) {
            timeout = setTimeout(later, waitTime - last);
        } else {
            timeout = null;
            // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return function () {
        context = this;
        args = arguments;
        timestamp = Date.now();
        var callNow = immediate && !timeout,
            waitTime = typeof(wait) === 'function' ? wait() : wait;
        // 如果延时不存在，重新设定延时
        if (!timeout) timeout = setTimeout(later, waitTime);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }
        return result;
    };
};

module.exports = {
    fillTasks: fillTasks,
    isRunning: isRunning,
    getSrcDir: getSrcDir,
    getDistDir: getDistDir,
    doBuild: doBuild,
    doUpload: doUpload,
    watch: watch,
    unwatch: unwatch
};