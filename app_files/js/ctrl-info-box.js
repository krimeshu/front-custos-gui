/**
 * Created by krimeshu on 2016/3/12.
 */

var shell = require('electron').remote.shell;

var _path = require('path');

var Data = require('./data.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js');

module.exports = function InfoBoxCtrl($scope, $mdDialog) {
    var self = this;
    self.isOpenExpanded = false;
    self.openDialMode = 'md-fling';

    $scope.curProj = Model.curProj;

    // 任务勾选相关
    $scope.toggle = function (item, list) {
        if ($scope.curProj.id === null) {
            return;
        }
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
    };
    $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
    };
    $scope.allTasks = [
        //'prepare_build',
        //'replace_const',
        'join_include',
        'sprite_crafter',
        'prefix_crafter',
        'allot_link',
        'optimize_image',
        //'do_dist',
        //'do_upload'
    ];

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
            Model.removeProjById($scope.curProj.id);
        });

    };

    // 保存项目配置
    $scope.saveProj = function () {
        Model.updateProj($scope.curProj);
    };
};