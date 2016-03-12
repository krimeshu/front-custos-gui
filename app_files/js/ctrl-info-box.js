/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js'),
    Model = require('./model.js'),
    Utils = require('./utils.js');

module.exports = function InfoBoxCtrl($scope) {
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

    // 保存项目配置
    $scope.saveProj = function () {

    };

    // 删除项目配置
    $scope.removeProj = function () {

    };

    // 打开项目源目录
    $scope.openSrcDir = function () {

    };

    // 打开项目生成目录
    $scope.openDistDir = function () {

    };
};