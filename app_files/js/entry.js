/**
 * Created by krimeshu on 2016/3/8.
 */

var HeaderCtrl = require('./ctrl-header.js'),
    ListBoxCtrl = require('./ctrl-list-box.js'),
    InfoBoxCtrl = require('./ctrl-info-box.js');

angular.module('FrontCustosGUI', ['ngMaterial', 'ngMessages', 'ui.ace'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('red');
    })
    .controller('HeaderCtrl', HeaderCtrl)
    .controller('ListBoxCtrl', ListBoxCtrl)
    .controller('InfoBoxCtrl', InfoBoxCtrl);
