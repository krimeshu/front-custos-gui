/**
 * Created by krimeshu on 2016/3/8.
 */
var mainWindow = require('electron').remote.getCurrentWindow(),
    dialog = require('electron').remote.require('dialog');

var _fs = require('fs'),
    _path = require('path');

// 加载模板列表
function getTemplates() {
    var templates = [{name: '空白模板', path: null}],
        templateDir = _path.resolve(__dirname, 'template');
    if (!_fs.existsSync(templateDir)) {
        _fs.mkdirSync(templateDir, 511); // 511:dec = 0777:hex
    }
    _fs.readdirSync(templateDir).forEach(function (file) {
        var filePath = _path.resolve(templateDir, file),
            extName = _path.extname(file),
            baseName = _path.basename(filePath, extName);
        templates.push({name: baseName, path: filePath});
    });
    return templates;
}

// 加载默认配置
function loadConfig() {
    var configPath = _path.resolve(__dirname, '..', 'config.json'),
        config = {
            "outputDir": "D:\\FC_Output",
            "htmlEnhanced": false,
            "delUnusedFiles": true,
            "uploadCallback": "function uploadCallback(response) {\n    return /^上传成功/.test(response);\n}",
            "flattenMap": {
                "page": "",
                "style": "css",
                "script": "js",
                "image": "images",
                "font": "font",
                "audio": "audio",
                "other": "raw"
            },
            "concurrentLimit": 1
        };
    if (_fs.existsSync(configPath)) {
        saveConfig(config);
    } else {
        try {
            var content = _fs.readFileSync(configPath).toString();
            config = JSON.parse(content);
        } catch (e) {
            console.log('loadConfig 时发生异常: ', e);
            saveConfig(config);
        }
    }
    return config;
}

// 保存默认配置
function saveConfig(config) {
    var configPath = _path.resolve(__dirname, '..', 'config.json'),
        content = JSON.stringify(config);
    try {
        _fs.writeFileSync(configPath, content);
    } catch (e) {
        console.log('saveConfig 时发生异常: ', e);
    }
}

// 加载项目列表
function loadProjList() {
    var listPath = _path.resolve(__dirname, '..', 'project-list.json'),
        list = [];
    if (_fs.existsSync(listPath)) {
        saveProjList(list);
    } else {
        try {
            var content = _fs.readFileSync(listPath).toString();
            list = JSON.parse(content);
        } catch (e) {
            console.log('loadProjList 时发生异常: ', e);
            saveProjList(list);
        }
    }
    return list;
}

// 保存项目列表
function saveProjList(projList) {
    var listPath = _path.resolve(__dirname, '..', 'project-list.json'),
        content = JSON.stringify(projList);
    try {
        _fs.writeFileSync(listPath, content);
    } catch (e) {
        console.log('saveProjList 时发生异常: ', e);
    }
}

// 加载 package.json
function loadProjPackage(projName, srcDir) {
    var configPath = _path.resolve(srcDir, 'package.json'),
        config = {
            projName: projName,
            version: '0.1.0',
            fcOpt: null
        };
    if (_fs.existsSync(configPath)) {
        saveProjPackage(config, srcDir);
    } else {
        try {
            var content = _fs.readFileSync(configPath).toString();
            config = JSON.parse(content);
        } catch (e) {
            console.log('readProjPackage 时发生异常: ', e);
            saveProjPackage(config, srcDir);
        }
    }
    var fcOpt = (config && config.fcOpt) || {};
    fcOpt.version = config.version;
    return fcOpt;
}

// 保存 package.json
function saveProjPackage(config, srcDir) {
    var configPath = _path.resolve(srcDir, 'package.json'),
        content = JSON.stringify(config);
    try {
        _fs.writeFileSync(configPath, content);
    } catch (e) {
        console.log('saveProjPackage 时发生异常: ', e);
    }
}

// 获取默认项目配置
function getInitOpt() {
    return {
        _id: null,
        projName: '',
        srcDir: '',
        version: '',
        scOpt: {},
        pcOpt: {},
        alOpt: {},
        upOpt: {},
        tasks: []
    };
}

/********************************************************************************/

var model = {
    templates: getTemplates(),
    config: loadConfig(),
    projList: loadProjList(),
    curProj: getInitOpt()
};

//console.log(templates);

angular.module('FrontCustosGUI', ['ngMaterial', 'ngMessages', 'ui.ace'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('red');
    })
    .controller('HeaderCtrl', function HeaderMenuCtrl($scope, $mdDialog) {
        $scope.version = require("../package.json").version;

        var originatorEv;

        // 打开顶栏菜单
        $scope.openMenu = function ($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

        // 显示配置对话框
        $scope.showConfig = function (ev) {
            $mdDialog.show({
                controller: function configDialogController($scope, $mdDialog) {
                    $scope.config = JSON.parse(JSON.stringify(model.config));

                    $scope.hide = function () {
                        $mdDialog.hide();
                    };

                    $scope.save = function (config) {
                        saveConfig(config);
                        model.config = config;
                    };

                    $scope.cancel = function () {
                        $mdDialog.cancel();
                    };
                },
                parent: angular.element(document.querySelector('.window-box')),
                templateUrl: 'dialog-temp/dialog-config.html',
                clickOutsideToClose: true,
                targetEvent: ev
            });
        };

        // 显示关于对话框
        $scope.showAbout = function (ev) {
            // Appending dialog to document.body to cover sidenav in docs app
            // Modal dialogs should fully cover application
            // to prevent interaction outside of dialog
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.querySelector('.window-box')))
                    .title('关于')
                    .textContent('本工具基于 electron 和 angular material 提供 front-custos 的图形界面，' +
                        '如不需要 GUI，也可以尝试直接基于 front-custos 编写脚本。使用过程中发现任何问题，欢迎联系 krimeshu。(^o^)/')
                    .ariaLabel('About Dialog')
                    .ok('好的')
                    .clickOutsideToClose(true)
                    .targetEvent(ev)
            );
        };
    })
    .controller('ListBoxCtrl', function ListBoxCtrl($scope, $mdDialog) {
        $scope.curProj = model.curProj;
        $scope.projList = model.projList;

        // 判断是否当前选中的项目
        $scope.isCurrent = function (id) {
            return id === $scope.curProj.id ? 'current' : '';
        };

        // 选中某项，更改当前的项目
        $scope.setCurrent = function (id) {
            //console.log('projName:', projName);
            var proj = null;
            $scope.projList.forEach(function (item) {
                if (id === item.id) {
                    proj = item;
                }
            });

            if (!proj) {
                console.log('ListBoxCtrl.setCurrent 选择的项目异常，找不到对应数据！');
                return;
            }

            for (var p in proj) {
                if (proj.hasOwnProperty(p)) {
                    model.curProj[p] = proj[p];
                }
            }

            var projName = proj.name,
                srcDir = proj.srcDir,
                pkg = loadProjPackage(projName, srcDir),
                opts = pkg.fcOpt || {};

            for (var p in opts) {
                if (opts.hasOwnProperty(p)) {
                    model.curProj[p] = opts[p];
                }
            }
        };

        // 显示打开项目路径对话框
        $scope.showOpenDialog = function () {
            dialog.showOpenDialog(mainWindow, {
                title: '选择项目所在的文件夹',
                properties: [
                    'openDirectory'
                ]
            }, function (files) {
                if (files && files.length) {
                    $scope.importProj(files[0]);
                }
            });
        };

        // 导入项目
        $scope.importProj = function (srcDir) {
            var projName = _path.basename(srcDir),
                pkg = loadProjPackage(projName, srcDir),
                opts = pkg.fcOpt || getInitOpt();

        };

        // 显示模板选择对话框
        $scope.showTemplates = function (ev) {
            $mdDialog.show({
                controller: function templatesDialogController($scope, $mdDialog) {
                    $scope.templates = model.templates;

                    $scope.tempPath = null;

                    $scope.hide = function () {
                        $mdDialog.hide();
                    };

                    $scope.answer = function (answer) {
                        $mdDialog.hide(answer);
                    };

                    $scope.cancel = function () {
                        $mdDialog.cancel();
                    };
                },
                parent: angular.element(document.querySelector('.window-box')),
                templateUrl: 'dialog-temp/dialog-templates.html',
                clickOutsideToClose: true,
                targetEvent: ev
            }).then(function (tempPath) {
                console.log(tempPath);
            });
        };
    })
    .controller('InfoBoxCtrl', function InfoBoxCtrl($scope) {
        $scope.curProj = model.curProj;
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