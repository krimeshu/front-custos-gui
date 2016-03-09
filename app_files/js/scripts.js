/**
 * Created by krimeshu on 2016/3/8.
 */
var model = {
    projList: [{
        projName: '条漫'
    }, {
        projName: '新版H5'
    }, {
        projName: '动漫人物猜猜看'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }, {
        projName: '让我占个位'
    }],
    currentProj: {
        projName: '',
        srcPath: '',
        uploadAll: false,
        scOpt: {},
        pcOpt: {},
        alOpt: {},
        tasks: [],
        uploadForm: function uploadForm(fileStream, relativeName, projectName) {
            var suffix = (relativeName.substr(relativeName.lastIndexOf('.'))),
                prefix = (relativeName.split('/').slice(0, -1));
            (['.html', '.shtml', '.php'].indexOf(suffix) < 0) && prefix.pop();
            prefix.splice(0, 0, projectName);
            return {
                'fileName': relativeName,
                'prefix': prefix.join('/'),
                'myfile': fileStream
            };
        }
    }
};

angular.module('FrontCustosGUI', ['ngMaterial', 'ngMessages', 'ui.ace'])
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
        $scope.projList = model.projList;
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

        $scope.currentProj._uploadForm = $scope.currentProj.uploadForm.toString();
        $scope.aceChanged = function () {
            try {
                var uploadForm = new Function('return ' + $scope.currentProj._uploadForm)();
                $scope.currentProj.uploadForm = uploadForm;
                console.log(uploadForm);
            } catch (e) {
                console.log(e);
            }
        };
    });