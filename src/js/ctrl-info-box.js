/**
 * Created by krimeshu on 2016/3/12.
 */

var shell = require('electron').remote.shell;

var _path = require('path');

var Logger = require('./logger.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js'),
    FrontCustos = require('../front-custos'),

    gulp = require('../front-custos/node_modules/gulp');

FrontCustos.takeOverConsole(Logger);
FrontCustos.registerTasks(gulp);

module.exports = function InfoBoxCtrl($scope, $mdDialog) {
    var self = this;
    self.isOpenExpanded = false;
    self.openDialMode = 'md-fling';

    $scope.curProj = Model.curProj;

    // 任务勾选相关
    $scope.toggle = function (item, list, locked) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
    };
    $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
    };
    $scope.allTasks = [
        {name: 'prepare_build', desc: '构建预准备', locked: true},
        {name: 'replace_const', desc: '替换定义的常量'},
        {name: 'join_include', desc: '合并包含的文件'},
        {name: 'sprite_crafter', desc: '自动合并雪碧图'},
        {name: 'prefix_crafter', desc: '添加CSS3样式前缀'},
        {name: 'allot_link', desc: '分发关联文件'},
        {name: 'optimize_image', desc: '压缩图片'},
        {name: 'do_dist', desc: '输出文件', locked: true},
        {name: 'do_upload', desc: '上传文件', locked: true}
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

    // 本地构建
    $scope.buildLocally = function () {
        var fcOpt = Model.curProj,
            pos = fcOpt.tasks.indexOf('do_upload');
        if (pos >= 0) {
            fcOpt.tasks.splice(pos, 1);
        }
        doBuild(fcOpt);
    };

    // 构建上传
    $scope.buildUpload = function () {
        var fcOpt = Model.curProj,
            pos = fcOpt.tasks.indexOf('do_upload');
        if (pos < 0) {
            fcOpt.tasks.push('do_upload');
        }
        doBuild(fcOpt);
    };

    var doBuild = function (fcOpt) {
        FrontCustos.process(fcOpt);
    };
};