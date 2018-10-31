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
    // $scope.toggleCurWatching = function () {
    //     if (Model.curProj.watchToRebuilding) {
    //         CustosProxy.unwatch(Model.curProj);
    //     } else {
    //         CustosProxy.watch(Model.curProj);
    //     }
    // };

    Model.onCurrentChanged(() => {
        $scope.updateCurOpt();
    });

    var tempPath = _path.resolve(_path.dirname(pagePath), './templates/options-confirm.html');
    $scope.optionsConfirmTemplate = _fs.readFileSync(tempPath).toString();
    $scope.optionsConfirmTemplate = $scope.optionsConfirmTemplate.replace(/\n/g, '');

    $scope.updateCurOpt = function () {
        // console.log('Mode change!');
        $scope.curProjOpt = Model.curProjOpt;
        $scope.curProjModeList = Model.curProjModeList;
    };

    $scope.updateCurOpt();

    // 任务勾选相关
    $scope.toggle = function (item, list) {
        // console.log('toggle');
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
    $scope.showModeDialog = function (ev) {
        self.isLocking = true;
        var curProj = $scope.curProj;
        var curMode = $scope.curProj.mode;
        var curProjModeList = $scope.curProjModeList;
        var toastMsg = $scope.toastMsg;
        return $mdDialog.show({
            lacals: {
                parent: $scope
            },
            controller: function configDialogController($scope, $mdDialog) {
                $scope.theme = Model.config.theme;
                $scope.curMode = curMode;
                $scope.NEW_MODE = '-- 新建配置 --';
                $scope.curProjModeList = [...curProjModeList, $scope.NEW_MODE];

                $scope.changeCurMode = function () {
                    if ($scope.curMode === $scope.NEW_MODE) {
                        return;
                    }
                    curMode = $scope.curMode;
                    $mdDialog.hide();
                };

                $scope.checkKeyPress = function (ev) {
                    if (ev.charCode !== 13) return;

                    var newModeName = ev.target.value;
                    if (/^\s*-/.test(newModeName)) {
                        toastMsg('任务模式名字不能用“-”起头');
                        return;
                    }

                    curProj.fcOpts[newModeName] = {};
                    curMode = newModeName;
                    $mdDialog.hide();
                };
            },
            parent: angular.element(document.querySelector('.window-box')),
            templateUrl: 'templates/dialog-mode.html',
            clickOutsideToClose: true,
            targetEvent: ev
        }).then(function () {
        }, function () {
        }).finally(function () {
            self.isLocking = false;
            if ($scope.curProj.mode !== curMode) {
                $scope.curProj.mode = curMode;
                $scope.updateCurOpt();
            }
        });
    };
    $scope.editMappingUrl = function (ev) {
        var smOpt = $scope.curProjOpt.smOpt || ($scope.curProjOpt.smOpt = {});
        $scope.showAceDialog('sourceMappingUrl 函数', smOpt.mappingUrl, ev).then(function (text) {
            smOpt.mappingUrl = text;
        }, function () {
        });
    };
    $scope.editPreprocessing = function (ev) {
        $scope.showAceDialog('预处理脚本', $scope.curProjOpt.preprocessing, ev).then(function (text) {
            $scope.curProjOpt.preprocessing = text;
        }, function () {
        });
    };
    $scope.editPostprocessing = function (ev) {
        $scope.showAceDialog('后处理脚本', $scope.curProjOpt.postprocessing, ev).then(function (text) {
            $scope.curProjOpt.postprocessing = text;
        }, function () {
        });
    };
    $scope.editUploadFilter = function (ev) {
        var upOpt = $scope.curProjOpt.upOpt || ($scope.curProjOpt.upOpt = {});
        $scope.showAceDialog('上传过滤', upOpt.filter, ev).then(function (text) {
            upOpt.filter = text;
        }, function () {
        });
    };
    $scope.editUploadForm = function (ev) {
        var upOpt = $scope.curProjOpt.upOpt || ($scope.curProjOpt.upOpt = {});
        $scope.showAceDialog('上传表单字段', upOpt.form, ev).then(function (text) {
            upOpt.form = text;
        }, function () {
        });
    };
    $scope.editUploadResult = function (ev) {
        var upOpt = $scope.curProjOpt.upOpt || ($scope.curProjOpt.upOpt = {});
        $scope.showAceDialog('上传结果判断', upOpt.judge, ev).then(function (text) {
            upOpt.judge = text;
        }, function () {
        });
    };

    // 保存项目配置
    $scope.saveProj = function () {
        if (self.isLocking) {
            // 被弹窗等情况阻止保存
            return;
        }
        // 补充任务
        CustosProxy.fillTasks(Model.curProjOpt.tasks);

        var proj = Utils.deepCopy($scope.curProj);
        proj.fcOpts[proj.mode] = Utils.deepCopy($scope.curProjOpt);

        var res = Model.updateProj(proj),
            projName = proj.projName,
            msg = res ?
                '项目 ' + projName + ' 配置保存完毕' :
                '项目 ' + projName + ' 配置保存失败，请稍后重试';
        // if (res && proj.watchToRebuilding) {
        //     Logger.log('<hr/>');
        //     Logger.info('项目配置发生变化，重新启动监听……');
        //     CustosProxy.unwatch(proj);
        //     CustosProxy.watch(proj);
        // }

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
        var {projName, projDir, version} = $scope.curProj;
        var fcOpt = Utils.deepCopy($scope.curProjOpt);
        fcOpt.proj = {projName, projDir, version};
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
        var {projName, projDir, version} = $scope.curProj;
        var fcOpt = Utils.deepCopy($scope.curProjOpt);
        fcOpt.proj = {projName, projDir, version};
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