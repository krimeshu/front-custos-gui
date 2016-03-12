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
    $scope.toggle = function (item, list) {
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

    $scope.aceChanged = function () {
        //
    };
};