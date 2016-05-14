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
    CustosProxy = require('./custos-proxy.js');

Model.onCurrentChanged(function(){
    CustosProxy.fillTasks(Model.curProj.tasks);
});

module.exports = ['$scope', '$mdDialog', '$mdToast', function InfoBoxCtrl($scope, $mdDialog, $mdToast) {
    var self = this;
    self.isOpenExpanded = false;
    self.openDialMode = 'md-fling';

    $scope.curProj = Model.curProj;
    $scope.toggleCurWatching = function () {
        if (Model.curProj.watchToRebuilding) {
            CustosProxy.unwatch(Model.curProj);
        } else {
            CustosProxy.watch(Model.curProj);
        }
    };

    var tempPath = _path.resolve(_path.dirname(pagePath), './templates/options-confirm.html');
    $scope.optionsConfirmTemplate = _fs.readFileSync(tempPath).toString();
    $scope.optionsConfirmTemplate = $scope.optionsConfirmTemplate.replace(/\n/g, '');

    // 任务勾选相关
    $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else {
            list.push(item);
            CustosProxy.fillTasks(list);
        }
    };
    $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
    };
    $scope.allTasks = Model.allTasks;

    // 编辑器相关
    $scope.aceLoaded = function (_editor) {
        // Options
        _editor.$blockScrolling = Infinity;
        _editor.focus();
    };

    // 打开项目源目录
    $scope.openSrcDir = function () {
        var srcDir = CustosProxy.FrontCustos.getSrcDir(Model.curProj);
        Utils.makeSureDir(srcDir);
        shell.openExternal(srcDir);
    };

    // 打开项目生成目录
    $scope.openDistDir = function () {
        var distDir = CustosProxy.FrontCustos.getDistDir(Model.curProj, Model.config.outputDir);
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
            var proj = $scope.curProj,
                id = proj.id,
                projName = proj.projName;
            CustosProxy.unwatch(proj);
            var res = Model.removeProjById(id),
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

    // 弹个消息
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
        if (CustosProxy.FrontCustos.isRunning()) {
            $scope.toastMsg('有未完成的任务，请稍后再试');
            return;
        }
        CustosProxy.fillTasks(fcOpt.tasks);
        CustosProxy.doBuild(fcOpt, function () {
            $scope.$apply(function () {
                $scope.toastMsg('任务执行完毕');
            });
        });
    };

    // 构建上传
    $scope.buildUpload = function () {
        var fcOpt = Model.curProj;
        if (CustosProxy.FrontCustos.isRunning()) {
            $scope.toastMsg('有未完成的任务，请稍后再试');
            return;
        }
        $scope.toastMsg('任务开始……');
        CustosProxy.fillTasks(fcOpt.tasks);
        CustosProxy.doBuild(fcOpt, function (params) {
            $scope.$apply(function () {
                remindErrorAndUpload(params, '构建过程中发生了一些错误，是否要继续上传？', function () {
                    CustosProxy.doUpload(params, function () {
                        $scope.$apply(function () {
                            $scope.toastMsg('任务执行完毕');
                        });
                    });
                });
            });
        });
    };

    var remindErrorAndUpload = function (params, msg, cb) {
        var errors = CustosProxy.FrontCustos.getErrorRecords();
        if (errors.length) {
            var logId = Logger.genUniqueId();
            Logger.useId(logId).warn(msg + $scope.optionsConfirmTemplate);
            var listener = function (e) {
                var target = e.target,
                    optionsConfirm = target && Utils.dom.refluxToFind(target, '.options-confirm'),
                    linkOK = target && Utils.dom.refluxToFind(target, '.options-link.ok'),
                    linkCancel = target && Utils.dom.refluxToFind(target, '.options-link.cancel');
                if (linkOK) {
                    document.getElementById(logId).removeEventListener('click', listener);
                    optionsConfirm.innerHTML = ' -确定继续-';
                    cb();
                } else if (linkCancel) {
                    document.getElementById(logId).removeEventListener('click', listener);
                    optionsConfirm.innerHTML = ' -已取消-';
                    $scope.toastMsg('上传已取消');
                }
            };
            document.getElementById(logId).addEventListener('click', listener);
        } else {
            cb();
        }
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
    windowCtrl.bindPageShortCut('ctrl+s', function () {
        $scope.$apply(function () {
            $scope.saveProj();
        });
    });
    windowCtrl.bindPageShortCut('ctrl+d', function () {
        $scope.$apply(function () {
            $scope.removeProj();
        });
    });
}];