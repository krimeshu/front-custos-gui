/**
 * Created by krimeshu on 2016/3/12.
 */

var ipcRenderer = require('electron').ipcRenderer;

var _path = require('path'),
    _fs = require('fs');

var Logger = require('./logger.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js'),
    CustosProxy = require('./custos-proxy.js');

module.exports = ['$scope', '$mdDialog', '$mdToast', function InfoBoxCtrl($scope, $mdDialog, $mdToast) {
    var self = this;
    self.isOpenExpanded = false;
    self.openDialMode = 'md-fling';
    self.isLocking = false;
    $scope.cmdOrCtrl = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';

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
    $scope.showAceDialog = function (title, orgText, ev) {
        return new Promise(function (rs, rj) {
            self.isLocking = true;
            $mdDialog.show({
                lacals: {
                    parent: $scope
                },
                controller: function configDialogController($scope, $mdDialog) {
                    $scope.title = title;
                    $scope.text = orgText;
                    $scope.theme = Model.config.theme;
                    $scope.isShowEditor = false;
                    setTimeout(function () {
                        $scope.isShowEditor = true;
                    }, 50);

                    $scope.aceLoaded = function (_editor) {
                        // Options
                        _editor.$blockScrolling = Infinity;
                        _editor.focus();
                    };

                    $scope.hide = function () {
                        self.isLocking = false;
                        $mdDialog.hide();
                    };

                    $scope.save = function () {
                        rs($scope.text);
                        $scope.hide();
                    };

                    $scope.cancel = function () {
                        rj();
                        $scope.hide();
                    };
                },
                parent: angular.element(document.querySelector('.window-box')),
                templateUrl: 'templates/dialog-ace.html',
                clickOutsideToClose: false,
                targetEvent: ev
            });
        });
    };
    $scope.editPreprocessing = function (ev) {
        $scope.showAceDialog('预处理脚本', Model.curProj.preprocessing, ev).then(function (text) {
            Model.curProj.preprocessing = text;
        }, function () { });
    };
    $scope.editPostprocessing = function (ev) {
        $scope.showAceDialog('后处理脚本', Model.curProj.postprocessing, ev).then(function (text) {
            Model.curProj.postprocessing = text;
        }, function () { });
    };
    $scope.editUploadForm = function (ev) {
        $scope.showAceDialog('上传表单字段', Model.curProj.upOpt.form, ev).then(function (text) {
            Model.curProj.upOpt.form = text;
        }, function () { });
    };
    $scope.editUploadResult = function (ev) {
        $scope.showAceDialog('上传结果判断', Model.curProj.upOpt.judge, ev).then(function (text) {
            Model.curProj.upOpt.judge = text;
        }, function () { });
    };

    // 保存项目配置
    $scope.saveProj = function () {
        if (self.isLocking) {
            // 被弹窗等情况阻止保存
            return;
        }
        // 补充任务
        CustosProxy.fillTasks(Model.curProj.tasks);

        var proj = $scope.curProj,
            res = Model.updateProj(proj),
            projName = proj.projName,
            msg = res ?
                '项目 ' + projName + ' 配置保存完毕' :
                '项目 ' + projName + ' 配置保存失败，请稍后重试';
        if (res && proj.watchToRebuilding) {
            Logger.log('<hr/>');
            Logger.info('项目配置发生变化，重新启动监听……');
            CustosProxy.unwatch(proj);
            CustosProxy.watch(proj);
        }
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

    // 提示出错询问上传信息
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
}];