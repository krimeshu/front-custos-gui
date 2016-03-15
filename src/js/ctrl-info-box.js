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

module.exports = ['$scope', '$mdDialog', '$mdToast', function InfoBoxCtrl($scope, $mdDialog, $mdToast) {
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
        fillTasks(fcOpt, false);
        doBuild(fcOpt);
    };

    // 构建上传
    $scope.buildUpload = function () {
        var fcOpt = Model.curProj;
        fillTasks(fcOpt, true);
        doBuild(fcOpt);
    };

    // 补充可能缺少的默认任务参数
    var fillTasks = function (fcOpt, withUpload) {
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
        if (!withUpload && uploadPos >= 0) {
            tasks.splice(uploadPos, 1);
        }
        if (withUpload && uploadPos < 0) {
            tasks.push('do_upload');
        }
    };

    var doBuild = function (fcOpt) {
        $scope.toastMsg('任务开始……');
        FrontCustos.config(Model.config);
        FrontCustos.process(Utils.deepCopy(fcOpt), function () {
            $scope.$apply(function () {
                $scope.toastMsg('任务执行完毕');
            });
        });
    };
}];