/**
 * Created by krimeshu on 2016/3/12.
 */

var shell = require('electron').remote.shell,
    ipcRenderer = require('electron').ipcRenderer;

var _path = require('path'),
    _fs = require('fs');

var Logger = require('./logger.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js'),
    FrontCustos = require('../front-custos'),

    gulp = require('../front-custos/node_modules/gulp');

FrontCustos.takeOverConsole(Logger);
FrontCustos.registerTasks(gulp);

module.exports = ['$scope', '$mdDialog', '$mdToast', function InfoBoxCtrl($scope, $mdDialog, $mdToast) {
    var self = this;
    self.isOpenExpanded = false;
    self.openDialMode = 'md-fling';

    $scope.curProj = Model.curProj;

    var tempPath = _path.resolve(_path.dirname(pagePath), './templates/options-confirm.html');
    $scope.optionsConfirmTemplate = _fs.readFileSync(tempPath).toString();
    $scope.optionsConfirmTemplate = $scope.optionsConfirmTemplate.replace(/\n/g, '');

    // 任务勾选相关
    $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else {
            var _list = [];
            for (var i = 0, task; task = $scope.allTasks[i]; i++) {
                var pos = list.indexOf(task.name);
                if (pos >= 0 || task.name === item || task.locked) {
                    _list.push(task.name);
                }
            }
            var _args = [0, list.length].concat(_list);
            list.splice.apply(list, _args);
        }
    };
    $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
    };
    $scope.allTasks = Model.allTasks;

    // 编辑器相关
    $scope.aceChanged = function () {
        // 暂无
    };

    // 打开项目源目录
    $scope.openSrcDir = function () {
        var srcDir = $scope.curProj.srcDir;
        Utils.makeSureDir(srcDir);
        shell.openExternal(srcDir);
    };

    // 打开项目生成目录
    $scope.openDistDir = function () {
        var srcDir = $scope.curProj.srcDir,
            baseName = _path.basename(srcDir),
            outputDir = Model.config.outputDir,
            distDir = _path.resolve(outputDir, baseName);
        Utils.makeSureDir(distDir);
        shell.openExternal(distDir);
    };

    // 删除项目配置
    $scope.removeProj = function (ev) {
        var confirm = $mdDialog.confirm()
            .parent(angular.element(document.querySelector('.window-box')))
            .title('确定要从项目列表中移除此项目的配置吗？')
            .textContent('项目源文件不会受任何影响。')
            .ariaLabel('删除项目')
            .targetEvent(ev)
            .ok('确定')
            .cancel('取消');
        $mdDialog.show(confirm).then(function () {
            var res = Model.removeProjById($scope.curProj.id),
                projName = $scope.curProj.projName,
                msg = res ?
                '项目 ' + projName + ' 已被移除' :
                '项目 ' + projName + ' 移除失败，请稍后重试';
            $scope.toastMsg(msg);
        });
    };

    // 保存项目配置
    $scope.saveProj = function () {
        var res = Model.updateProj($scope.curProj),
            projName = $scope.curProj.projName,
            msg = res ?
            '项目 ' + projName + ' 配置保存完毕' :
            '项目 ' + projName + ' 配置保存失败，请稍后重试';
        $scope.toastMsg(msg);
    };

    $scope.toastMsg = function (msg) {
        $mdToast.show(
            $mdToast.simple()
                .parent(angular.element(document.querySelector('.window-box .info-box')))
                .textContent(msg)
                .position('top right')
                .hideDelay(2000)
        );
    };

    // 本地构建
    $scope.buildLocally = function () {
        var fcOpt = Model.curProj;
        fillTasks(fcOpt);
        doBuild(fcOpt, function () {
            $scope.toastMsg('任务执行完毕');
        });
    };

    // 构建上传
    $scope.buildUpload = function () {
        var fcOpt = Model.curProj;
        fillTasks(fcOpt);
        doBuild(fcOpt, function (params) {
            var errors = params.errors;
            if (errors.length) {
                var logId = Logger.genUniqueId();
                Logger.useId(logId).warn('构建过程中发生了一些错误，是否要继续上传？' + $scope.optionsConfirmTemplate);
                var cb = function (e) {
                    var target = e.target,
                        optionsConfirm = target && Utils.dom.refluxToFind(target, '.options-confirm'),
                        linkOK = target && Utils.dom.refluxToFind(target, '.options-link.ok'),
                        linkCancel = target && Utils.dom.refluxToFind(target, '.options-link.cancel');
                    if (linkOK) {
                        document.getElementById(logId).removeEventListener('click', cb);
                        optionsConfirm.innerHTML = ' -确定继续-';
                        doUpload(params, function () {
                            $scope.toastMsg('任务执行完毕');
                        });
                    } else if (linkCancel) {
                        document.getElementById(logId).removeEventListener('click', cb);
                        optionsConfirm.innerHTML = ' -已取消-';
                        $scope.toastMsg('上传已取消');
                    }
                };
                document.getElementById(logId).addEventListener('click', cb);
            } else {
                doUpload(params, function () {
                    $scope.toastMsg('任务执行完毕');
                });
            }
        });
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

    var doBuild = function (fcOpt, cb) {
        if (FrontCustos.isRunning()) {
            $scope.toastMsg('有未完成的任务，请稍后再试');
            return;
        }
        $scope.toastMsg('任务开始……');
        FrontCustos.config(Model.config);
        var params = Utils.deepCopy(fcOpt);
        Logger.log('<hr/>');
        FrontCustos.process(params, function () {
            $scope.$apply(function () {
                cb && cb(params);
            });
        });
    };

    var doUpload = function (params, cb) {
        params.tasks = ['do_upload'];
        FrontCustos.process(params, function () {
            $scope.$apply(function () {
                cb && cb(params);
            });
        });
    };

    // 快捷键
    ipcRenderer.on('global-shortcut', function (ev, keys) {
        switch (keys) {
            case 'ctrl+alt+b':
                $scope.buildLocally();
                break;
            case 'ctrl+alt+u':
                $scope.buildUpload();
                break;
        }
    });
}];