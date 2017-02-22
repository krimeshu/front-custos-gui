/**
 * Created by krimeshu on 2016/4/3.
 */

var _fs = require('fs'),
    _path = require('path'),

    _watch = require('watch');

var Logger = require('./logger.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js'),

    FrontCustos = null,

    buildWhenFinished = null;

try {
    if (!require('../package.json').useDevCore) {
        throw new Error('未开启开发版本内核开关。');
    }
    FrontCustos = require('../../front-custos');
} catch (e) {
    // 未找到附近的开发版本，使用普通版本内核
    FrontCustos = require('front-custos');
}

// 补充可能缺少的默认任务参数
var fillTasks = function (tasks) {
    var uploadPos = tasks.indexOf('do_upload');
    if (uploadPos >= 0) {
        tasks.splice(uploadPos, 1);
    }
    FrontCustos.fillAndOrderTasks(tasks);
};

var doBuild = function (fcOpt, cb) {
    if (FrontCustos.isRunning()) {
        console.info('有任务尚未结束，将推迟到任务结束后再处理。');
        buildWhenFinished = {
            fcOpt: fcOpt,
            cb: cb
        };
        return;
    }
    FrontCustos.takeOverConsole(Logger);
    FrontCustos.setConfig(Model.config);
    var params = Utils.deepCopy(fcOpt);
    Logger.log('<hr/>');
    FrontCustos.process(params, function () {
        cb && cb(params);
        if (buildWhenFinished) {
            console.info('有待处理任务，将自动开始。');
            var _fcOpt = buildWhenFinished.fcOpt,
                _cb = buildWhenFinished.cb,
                _params = Utils.deepCopy(_fcOpt);
            buildWhenFinished = null;
            doBuild(_params, function () {
                _cb && _cb(params);
            });
        }
    });
};

var doUpload = function (params, cb) {
    if (FrontCustos.isRunning()) {
        return;
    }
    FrontCustos.takeOverConsole(Logger);
    params.workDir = params.distDir;
    params.tasks = ['do_upload'];
    FrontCustos.runTasks(params, function () {
        Model.config.noticeWhenUploadFinished && Utils.playSE('upload-finished');
        cb && cb(params);
    });
};

var runTasks = function (params, cb) {
    if (FrontCustos.isRunning()) {
        return;
    }
    FrontCustos.takeOverConsole(Logger);
    FrontCustos.runTasks(params, cb);
};

var watch = function (_projWithOpt) {
    _projWithOpt.watchToRebuilding = true;

    var projWithOpt = Utils.deepCopy(_projWithOpt),
        id = projWithOpt.id,
        projName = projWithOpt.projName,
        srcDir = FrontCustos.getSrcDir(projWithOpt),
        tasks = projWithOpt.tasks;

    var pos = Model.watchingProjIds.indexOf(id);
    if (pos >= 0) {
        return;
    } else {
        Model.watchingProjIds.push(id);
    }

    var rebuild = debounce(function () {
        Logger.info('<hr/>');
        Logger.info('监听到变化，开始自动处理任务：%c%s', 'color: white;', projName);
        // 根据配置，限制自动监听时执行的任务
        projWithOpt.tasks = Model.getTasksInRange(tasks, Model.config.watchTaskLimit);
        doBuild(projWithOpt, function () {
            Logger.info('监听自动处理任务执行完毕：%c%s', 'color: white;', projName);
        });
    }, () => Model.config.watchDelayTime);

    Logger.info('开始监听项目：%c%s', 'color: white;', projName);
    _watch.watchTree(srcDir, {
        ignoreDotFiles: true,
        interval: 2004,
        filter: function (f) {
            var baseName = _path.basename(f),
                ignoreNames = ['package.json'],
                regJetBrainsTempFile = /___jb_tmp___$/;
            if (ignoreNames.indexOf(baseName) >= 0 || regJetBrainsTempFile.test(baseName)) {
                return false;
            }
            // 排除生成文件的情况
            return !FrontCustos.FilenameHelper.getOriginalPathFromCompiled(f);
        }
    }, function (f, curr, prev) {
        if (typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
        } else if (prev === null) {
            // f is a new file
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 创建了文件: ', f);
            rebuild(f);
        } else if (curr.nlink === 0) {
            // f was removed
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 删除了文件: ', f);
            rebuild(f);
        } else {
            // f was changed
            console.log(Utils.formatTime('[HH:mm:ss.fff]') + ' - 修改了文件: ', f);
            rebuild(f);
        }
    });
};

var unwatch = function (_projWithOpt) {
    _projWithOpt.watchToRebuilding = false;

    var projWithOpt = Utils.deepCopy(_projWithOpt),
        id = projWithOpt.id,
        projName = projWithOpt.projName,
        srcDir = FrontCustos.getSrcDir(projWithOpt);

    var pos = Model.watchingProjIds.indexOf(id);
    if (pos < 0) {
        return;
    } else {
        Model.watchingProjIds.splice(pos, 1);
    }

    Logger.info('停止监听项目：%c%s', 'color: white;', projName);
    _watch.unwatchTree(srcDir);
};

var debounce = function (func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function () {
        // 据上一次触发时间间隔
        var last = Date.now() - timestamp,
            waitTime = typeof (wait) === 'function' ? wait() : wait;
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
            waitTime = typeof (wait) === 'function' ? wait() : wait;
        // 如果延时不存在，重新设定延时
        if (!timeout) timeout = setTimeout(later, waitTime);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }
        return result;
    };
};

Model.onCurrentChanged(function () {
    // 检查是否监听自动构建
    if (Model.curProj.watchToRebuilding) {
        watch(Model.curProj);
    }
});

module.exports = {
    get FrontCustos() {
        return FrontCustos;
    },
    fillTasks: fillTasks,
    doBuild: doBuild,
    doUpload: doUpload,
    runTasks: runTasks,
    watch: watch,
    unwatch: unwatch
};