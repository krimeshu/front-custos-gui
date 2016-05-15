/**
 * Created by krimeshu on 2016/3/8.
 */

var HeaderCtrl = require('./ctrl-header.js'),
    ListBoxCtrl = require('./ctrl-list-box.js'),
    InfoBoxCtrl = require('./ctrl-info-box.js'),
    Model = require('./model.js');

angular.module('FrontCustosGUI', ['ngMaterial', 'ngMessages', 'ui.ace', 'perfect_scrollbar', 'as.sortable'])
    .config(['$mdThemingProvider', function ($mdThemingProvider) {
        var allThemes = Model.allThemes;
        for (var name in allThemes) {
            if (!allThemes.hasOwnProperty(name)) {
                continue;
            }
            var props = allThemes[name];
            $mdThemingProvider.theme(name)
                .primaryPalette(props.primary)
                .accentPalette(props.accent)
                .backgroundPalette('grey', {
                    'default': '50'
                });
        }
        $mdThemingProvider.alwaysWatchTheme(true);
    }])
    .filter('to_trusted', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .controller('MainCtrl', ['$scope', function ($scope) {
        var theme = Model.config.theme,
            allThemes = Model.allThemes,
            correct = false;
        for (var name in allThemes) {
            if (!allThemes.hasOwnProperty(name)) {
                continue;
            }
            if (name === theme) {
                correct = true;
                break;
            }
        }
        if (!correct) {
            Model.config.theme = 'default';
        }
        $scope.config = Model.config;
    }])
    .controller('HeaderCtrl', HeaderCtrl)
    .controller('ListBoxCtrl', ListBoxCtrl)
    .controller('InfoBoxCtrl', InfoBoxCtrl);

