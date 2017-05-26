/**
 * Created by krimeshu on 2016/3/12.
 */

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('./utils.js'),
    SessionProxy = require('./session-proxy.js');

module.exports = {
    initConfig: {
        "outputDir": _path.resolve(process.env.HOME || process.env.USERPROFILE, "FC_Output"),
        "htmlEnhanced": false,
        "delUnusedFiles": true,
        "flattenMap": {
            "page": "",
            "style": "css",
            "script": "js",
            "image": "images",
            "font": "font",
            "audio": "audio",
            "other": "raw"
        },
        "concurrentLimit": 1,
        "proxyRule": "",
        "watchTaskLimit": "",
        "watchDelayTime": 1000,
        "noticeWhenUploadFinished": true,
        "lastWorkingId": null
    },
    initOpt: {
        "scOpt": {},
        "pcOpt": {},
        "alOpt": {
            "allot": false
        },
        "upOpt": {
            "delta": true,
            "form": "function uploadForm(fileStream, filePath) {\r\n    var fileDir = filePath.split('/'),\r\n        fileName = fileDir.pop().split('.'),\r\n        fileType = fileName.length > 1 ? fileName.pop() : '';\r\n    // console.log('其它可用参数：', this.queryAvailableArguments().join(', '));\r\n    return {\r\n        'fileDir': fileDir.join('/'),\r\n        'fileName': fileName.join('.'),\r\n        'fileType': fileType,\r\n        'fileContents': fileStream\r\n    };\r\n}",
            "judge": "function uploadJudge(response) {\n    return /^上传成功/.test(response);\n}"
        },
        "tasks": [
            "prepare_build",
            "do_dist"
        ],
        "innerSrcDir": "",
        "innerDistDir": "",
        "preprocessing": "function preprocessing(console, workDir) {\n    console.log('当前工作目录：', workDir);\n    // console.log('其它可用参数：', this.queryAvailableArguments().join(', '));\n    // Todo: do something before build.\n}",
        "postprocessing": "function postprocessing(console, workDir) {\n    console.log('当前工作目录：', workDir);\n    // console.log('其它可用参数：', this.queryAvailableArguments().join(', '));\n    // Todo: do something after build.\n}",
        "keepOldCopy": false
    },
    exampleProj: {
        "id": "default_example_project_" + Date.now(),
        "projName": "example",
        "projDir": _path.resolve(__dirname, "../node_modules/front-custos/example")
    },
    // 加载全局配置
    loadConfig: function () {
        var configPath = Utils.configDir('./fc-config.json'),
            initConfig = this.initConfig,
            config = initConfig;
        if (!_fs.existsSync(configPath)) {
            this.saveConfig(config);
        } else {
            try {
                var content = _fs.readFileSync(configPath).toString();
                config = angular.fromJson(content);
            } catch (e) {
                console.log('loadConfig 时发生异常: ', e);
                this.saveConfig(config);
            }
            // 补全升级后的字段
            for (var k in initConfig) {
                if (initConfig.hasOwnProperty(k) && config[k] === undefined) {
                    config[k] = initConfig[k];
                }
            }
            // 应用代理规则
            SessionProxy.setProxy(config.proxyRule);
        }
        return config;
    },
    // 保存全局配置
    saveConfig: function (config) {
        var configPath = Utils.configDir('./fc-config.json'),
            content = angular.toJson(config, true);
        try {
            _fs.writeFileSync(configPath, content);
        } catch (e) {
            console.log('saveConfig 时发生异常: ', e);
        }
        // 应用代理规则
        SessionProxy.setProxy(config.proxyRule);
    },
    // 加载项目列表
    loadProjList: function () {
        var listPath = Utils.configDir('./fc-project-list.json'),
            list = [this.exampleProj];
        if (!_fs.existsSync(listPath)) {
            this.saveProjList(list);
        } else {
            try {
                var content = _fs.readFileSync(listPath).toString();
                list = angular.fromJson(content);
                projList_update(list);
            } catch (e) {
                console.log('loadProjList 时发生异常: ', e);
                this.saveProjList(list);
            }
        }
        return list;
    },
    // 保存项目列表
    saveProjList: function (projList) {
        var listPath = Utils.configDir('./fc-project-list.json'),
            content = angular.toJson(projList, true);
        try {
            _fs.writeFileSync(listPath, content);
        } catch (e) {
            console.log('saveProjList 时发生异常: ', e);
        }
    },
    // 加载 package.json
    loadProjPackage: function (projName, projDir) {
        var pkgPath = _path.resolve(projDir, 'package.json'),
            pkg = {
                name: projName,
                version: '0.1.0',
                fcOpt: null
            };
        if (!_fs.existsSync(pkgPath)) {
            this.saveProjPackage(pkg, projDir);
        } else {
            try {
                var content = _fs.readFileSync(pkgPath).toString();
                pkg = angular.fromJson(content);
            } catch (e) {
                console.log('readProjPackage 时发生异常: ', e);
                this.saveProjPackage(pkg, projDir);
            }
        }
        return pkg;
    },
    // 保存 package.json
    saveProjPackage: function (pkg, projDir) {
        var pkgPath = _path.resolve(projDir, 'package.json'),
            content = angular.toJson(pkg, true);
        try {
            _fs.writeFileSync(pkgPath, content);
        } catch (e) {
            console.log('saveProjPackage 时发生异常: ', e);
        }
    },
    // 获取默认项目配置
    getNewOpt: function () {
        var opt = Utils.deepCopy(this.initOpt);
        opt.id = null;
        opt.projName = '';
        opt.projDir = '';
        return opt;
    },
    // 读取模板列表
    getTemplates: function () {
        var templates = [{ name: '空白模板', path: null }],
            templateDir = Utils.configDir('./fc-template');
        if (!_fs.existsSync(templateDir)) {
            _fs.mkdirSync(templateDir, 511); // 511:dec = 0777:hex
        }
        _fs.readdirSync(templateDir).forEach(function (file) {
            var filePath = _path.resolve(templateDir, file),
                extName = _path.extname(file),
                baseName = _path.basename(filePath, extName);
            templates.push({ name: baseName, path: filePath });
        });
        return templates;
    }
};

// 项目列表版本更新
function projList_update(list) {
    list.forEach(function (proj) {
        if (proj.srcDir) {
            proj.projDir = proj.srcDir;
            delete proj.srcDir;
        }
    });
}


