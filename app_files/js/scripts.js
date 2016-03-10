/**
 * Created by krimeshu on 2016/3/8.
 */
var model = {
    projList: [{
        projName: '条漫',
        srcDir: ''
    }, {
        projName: '新版H5',
        srcDir: ''
    }, {
        projName: '动漫人物猜猜看',
        srcDir: ''
    }],
    currentProj: {
        projName: '新版H5',
        srcDir: '',
        scOpt: {},
        pcOpt: {},
        alOpt: {},
        upOpt: {},
        tasks: []
    }
};

angular.module('FrontCustosGUI', ['ngMaterial', 'ngMessages', 'ui.ace'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('red');
    })
    .controller('HeaderCtrl', function HeaderMenuCtrl($scope) {
        $scope.version = require("../package.json").version;

        var originatorEv;
        this.openMenu = function ($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

        this.closeWindow = function () {
            window.close();
        };
    })
    .controller('ListBoxCtrl', function ListBoxCtrl($scope) {
        $scope.currentProj = model.currentProj;
        $scope.projList = model.projList;
        $scope.isCurrent = function (projName) {
            return projName === $scope.currentProj.projName ? 'current' : '';
        };

        this.setCurrent = function (projName) {
            console.log('projName:', projName);
            var srcDir = null;
            $scope.projList.forEach(function (item) {
                if (projName === item.projName) {
                    srcDir = item.srcDir;
                }
            });

            var proj = {
                projName: projName
            };
            for (var p in proj) {
                if (proj.hasOwnProperty(p)) {
                    $scope.currentProj[p] = proj[p];
                }
            }
        };
    })
    .controller('InfoBoxCtrl', function InfoBoxCtrl($scope) {
        $scope.currentProj = model.currentProj;
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
    });