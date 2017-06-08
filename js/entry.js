/**
 * Created by krimeshu on 2016/3/8.
 */

var remote = require('electron').remote,
    Menu = remote.Menu;

var HeaderCtrl = require('./ctrl-header.js'),
    ListBoxCtrl = require('./ctrl-list-box.js'),
    InfoBoxCtrl = require('./ctrl-info-box.js'),
    Model = require('./model.js');

var tinycolor = require('tinycolor2');

angular.module('FrontCustosGUI', [
    'ngMaterial',
    'ngMessages',
    'ngRightClick',
    'ui.ace',
    'perfect_scrollbar',
    'as.sortable'])
    .config(['$mdThemingProvider', function ($mdThemingProvider) {
        var allThemes = Model.allThemes,
            extraThemeStyle = [];
        for (var name in allThemes) {
            if (!allThemes.hasOwnProperty(name)) {
                continue;
            }
            var props = allThemes[name];
            $mdThemingProvider.theme(name)
                .primaryPalette(props.primary)
                .accentPalette(props.accent, {
                    'default': '500'
                })
                .backgroundPalette('grey', {
                    'default': '50'
                });

            // 顶栏与项目列表配色
            var primaryColor = $mdThemingProvider._PALETTES[props.primary]['500'];
            extraThemeStyle.push('.window-box[md-theme="' + name + '"] .window-header {');
            extraThemeStyle.push('  background-color: ' + tinycolor(primaryColor) + ';');
            extraThemeStyle.push('}');
            extraThemeStyle.push('.window-box[md-theme="' + name + '"] .list-box {');
            extraThemeStyle.push('  background-color: ' + tinycolor(primaryColor).lighten(45) + ';');
            extraThemeStyle.push('  color: ' + tinycolor(primaryColor).darken(25) + ';');
            extraThemeStyle.push('}');
            extraThemeStyle.push('.window-box[md-theme="' + name + '"] .proj-item.current {');
            extraThemeStyle.push('  background-color: ' + tinycolor(primaryColor).lighten(25) + ';');
            extraThemeStyle.push('}');
        }

        var styleText = extraThemeStyle.join('\n');
        // console.log('styleText:', styleText);
        $('body').append($('<style title="extra-theme-style"></style>').html(styleText));

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
            isThemeConfigAvailable = false;
        for (var name in allThemes) {
            if (!allThemes.hasOwnProperty(name)) {
                continue;
            }
            if (name === theme) {
                isThemeConfigAvailable = true;
                break;
            }
        }
        if (!isThemeConfigAvailable) {
            Model.config.theme = Model._DEFAULT_THEME;
        }

        $scope.config = Model.config;
    }])
    .controller('HeaderCtrl', HeaderCtrl)
    .controller('ListBoxCtrl', ListBoxCtrl)
    .controller('InfoBoxCtrl', InfoBoxCtrl);

(function setApplicationMenu() {
    // 设置应用菜单（修复 Mac OS 内常用编辑快捷键）

    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "CmdOrCtrl+Q", click: ()=> app.quit() }
        ]
    }, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]
    }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
})();