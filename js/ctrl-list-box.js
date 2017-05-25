/**
 * Created by krimeshu on 2016/3/12.
 */
var mainWindow = require('electron').remote.getCurrentWindow(),
    dialog = require('electron').remote.dialog;

var Logger = require('./logger.js'),
    Data = require('./data.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js');

var _fs = require('fs'),
    _path = require('path');

module.exports = ['$scope', '$mdDialog', function ListBoxCtrl($scope, $mdDialog) {
    $scope.curProj = Model.curProj;
    $scope.projList = Model.projList;

    // 判断是否当前选中的项目
    $scope.isCurrent = function (id) {
        return id === $scope.curProj.id ? 'current' : '';
    };

    // 选中某项，更改当前的项目
    $scope.setCurrent = function (id, ev) {
        if (Model.curProj.id === id) {
            return;
        }
        //console.log('projName:', projName);
        var proj = Model.getProjById(id);

        if (!proj) {
            console.log('ListBoxCtrl.setCurrent 选择的项目异常，找不到对应数据！');
            return;
        }

        var projName = proj.projName,
            projDir = proj.projDir;

        if (!_fs.existsSync(projDir)) {
            Model.removeProjById(id);
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('.window-box')))
                    .title('项目“' + projName + '”配置失效，项目目录不存在，已从列表中移除')
                    .textContent('如项目被移动到其他位置，需要继续处理，请重新导入到工具内后继续操作。')
                    .ariaLabel('项目不存在')
                    .ok('好的')
                    .clickOutsideToClose(true)
                    .targetEvent(ev)
            );
            return;
        }

        // 开始加载
        Model.selectCurProj(proj);
    };

    // 显示打开项目路径对话框
    $scope.showOpenDialog = function (ev) {
        dialog.showOpenDialog(mainWindow, {
            title: '选择项目所在的文件夹',
            properties: [
                'openDirectory'
            ]
        }, function (files) {
            if (files && files.length) {
                $scope.$apply(function () {
                    $scope.importProj(files[0], ev);
                });
            }
        });
    };

    // 拖入项目目录
    $('.list-box')[0].ondrop = function (ev) {
        var file = ev.dataTransfer.files[0],
            filePath = file.path,
            state = _fs.statSync(filePath);
        console.log('Drop file:', filePath);
        if (state.isDirectory()) {
            $scope.importProj(filePath, ev);
        }
    };

    // 导入项目
    $scope.importProj = function (projDir, ev) {
        var projName = _path.basename(projDir),
            pkg = Data.loadProjPackage(projName, projDir),
            opts = pkg.fcOpt;
        $scope._importEv = ev;
        if (!opts) {
            $scope.showTemplates(projName, projDir);
        } else {
            $scope.addProj(projName, projDir);
        }
    };

    // 显示模板选择对话框
    $scope.showTemplates = function (projName, projDir) {
        var ev = $scope._importEv;
        $mdDialog.show({
            controller: function templatesDialogController($scope, $mdDialog) {
                $scope.templates = Model.templates;
                $scope.config = Model.config;

                $scope.tempPath = null;

                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
            },
            parent: angular.element(document.querySelector('.window-box')),
            templateUrl: 'templates/dialog-templates.html',
            clickOutsideToClose: true,
            targetEvent: ev
        }).then(function (tempPath) {
            // 读取模板设定初始配置
            var pkg = Data.loadProjPackage(projName, projDir),
                content = tempPath ?
                    _fs.readFileSync(tempPath).toString() :
                    Data.initOpt,
                temp = angular.fromJson(content),
                fcOpt = Model.extractFcOpt(temp);
            pkg.fcOpt = Utils.deepCopy(fcOpt);
            Data.saveProjPackage(pkg, projDir);
            $scope.addProj(projName, projDir);
        }, function () {
            // 不取模板，直接按默认配置
            var pkg = Data.loadProjPackage(projName, projDir),
                fcOpt = Data.initOpt;
            pkg.fcOpt = Utils.deepCopy(fcOpt);
            Data.saveProjPackage(pkg, projDir);
            $scope.addProj(projName, projDir);
        });
    };

    // 将项目添加到列表中
    $scope.addProj = function (projName, projDir) {
        var ev = $scope._importEv;

        var projList = $scope.projList,
            getId = function () {
                return new Date().getTime() + '_' + Utils.md5(String(Math.random()));
            },
            isIdUniq = function (id) {
                for (var i = 0, len = projList.length; i < len; i++) {
                    if (projList[i].id === id) {
                        return false;
                    }
                }
                return true;
            },
            id = getId();
        while (!isIdUniq(id)) {
            id = getId();
        }
        projList.push({
            id: id,
            projName: projName,
            projDir: projDir
        });
        Data.saveProjList(projList);

        $scope.setCurrent(id, ev);
    };

    // 拖拽控制
    $scope.dragControlListeners = {
        // itemMoved: function () {
        //     console.log('itemMoved:', Model.projList);
        // },
        orderChanged: function () {
            // console.log('orderChanged:', Model.projList);
            var projList = $scope.projList;
            Data.saveProjList(projList);
        },
        allowDuplicates: false //optional param allows duplicates to be dropped.
    };

    // 上次关闭时的工作项目ID
    var lastWorkingId = Model.config.lastWorkingId;
    lastWorkingId && $scope.setCurrent(lastWorkingId);
}];


