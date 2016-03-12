/**
 * Created by krimeshu on 2016/3/12.
 */
var mainWindow = require('electron').remote.getCurrentWindow(),
    dialog = require('electron').remote.require('dialog');

var Data = require('./data.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js');

var _fs = require('fs'),
    _path = require('path');

module.exports = function ListBoxCtrl($scope, $mdDialog) {
    $scope.curProj = Model.curProj;
    $scope.projList = Model.projList;

    // 判断是否当前选中的项目
    $scope.isCurrent = function (id) {
        return id === $scope.curProj.id ? 'current' : '';
    };

    // 选中某项，更改当前的项目
    $scope.setCurrent = function (id) {
        //console.log('projName:', projName);
        var proj = Model.getProjById(id);

        if (!proj) {
            console.log('ListBoxCtrl.setCurrent 选择的项目异常，找不到对应数据！');
            return;
        }

        Utils.deepCopy(proj, Model.curProj);

        var projName = proj.name,
            srcDir = proj.srcDir,
            pkg = Data.loadProjPackage(projName, srcDir),
            opts = pkg.fcOpt || {};

        Model.curProj.version = pkg.version;

        Utils.deepCopy(opts, Model.curProj);
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
                $scope.importProj(files[0], ev);
            }
        });
    };

    // 导入项目
    $scope.importProj = function (srcDir, ev) {
        var projName = _path.basename(srcDir),
            pkg = Data.loadProjPackage(projName, srcDir),
            opts = pkg.fcOpt;
        if (!opts) {
            $scope.showTemplates(projName, srcDir, ev);
        } else {
            $scope.addProj(projName, srcDir);
        }
    };

    // 显示模板选择对话框
    $scope.showTemplates = function (projName, srcDir, ev) {
        $mdDialog.show({
            controller: function templatesDialogController($scope, $mdDialog) {
                $scope.templates = Model.templates;

                $scope.tempPath = null;

                $scope.hide = function () {
                    $mdDialog.hide();
                };

                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
            },
            parent: angular.element(document.querySelector('.window-box')),
            templateUrl: 'dialog-temp/dialog-templates.html',
            clickOutsideToClose: true,
            targetEvent: ev
        }).then(function (tempPath) {
            //console.log(tempPath);
            var content = _fs.readFileSync(tempPath).toString(),
                opts = angular.fromJson(content),
                pkg = Data.loadProjPackage(projName, srcDir);
            pkg.fcOpt = Utils.deepCopy(opts);
            Data.saveProjPackage(pkg, srcDir);
            $scope.addProj(projName, srcDir);
        });
    };

    // 将项目添加到列表中
    $scope.addProj = function (projName, srcDir) {
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
            srcDir: srcDir
        });
        Data.saveProjList(projList);
    };
};


