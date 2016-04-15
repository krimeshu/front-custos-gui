/**
 * Created by krimeshu on 2016/3/12.
 */

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('./utils.js');

module.exports = {
    getTemplates: getTemplates,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    loadProjList: loadProjList,
    saveProjList: saveProjList,
    loadProjPackage: loadProjPackage,
    saveProjPackage: saveProjPackage,
    getNewOpt: getNewOpt,
    get initOpt() {
        return initOpt;
    }
};

// 读取模板列表
function getTemplates() {
    var templates = [{name: '空白模板', path: null}],
        templateDir = _path.resolve(__dirname, '../fc-template');
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
    var configPath = _path.resolve(__dirname, '../fc-config.json'),
        initConfig = {
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
            "concurrentLimit": 1,
            "watchToUploading": false,
            "watchDelayTime": 1000,
            "lastWorkingId": null
        },
        config = initConfig;
    if (!_fs.existsSync(configPath)) {
        saveConfig(config);
    } else {
        try {
            var content = _fs.readFileSync(configPath).toString();
            config = angular.fromJson(content);
        } catch (e) {
            console.log('loadConfig 时发生异常: ', e);
            saveConfig(config);
        }
        // 补全升级后的字段
        for (var k in initConfig) {
            if (initConfig.hasOwnProperty(k) && config[k] === undefined) {
                config[k] = initConfig[k];
            }
        }
    }
    return config;
}

// 保存默认配置
function saveConfig(config) {
    var configPath = _path.resolve(__dirname, '../fc-config.json'),
        content = angular.toJson(config, true);
    try {
        _fs.writeFileSync(configPath, content);
    } catch (e) {
        console.log('saveConfig 时发生异常: ', e);
    }
}

// 加载项目列表
function loadProjList() {
    var listPath = _path.resolve(__dirname, '../fc-project-list.json'),
        list = [];
    if (!_fs.existsSync(listPath)) {
        saveProjList(list);
    } else {
        try {
            var content = _fs.readFileSync(listPath).toString();
            list = angular.fromJson(content);
            projList_update(list);
        } catch (e) {
            console.log('loadProjList 时发生异常: ', e);
            saveProjList(list);
        }
    }
    return list;
}

// 项目列表版本更新
function projList_update(list) {
    list.forEach(function (proj) {
        if (proj.srcDir) {
            proj.projDir = proj.srcDir;
            delete proj.srcDir;
        }
    });
}

// 保存项目列表
function saveProjList(projList) {
    var listPath = _path.resolve(__dirname, '../fc-project-list.json'),
        content = angular.toJson(projList, true);
    try {
        _fs.writeFileSync(listPath, content);
    } catch (e) {
        console.log('saveProjList 时发生异常: ', e);
    }
}

// 加载 package.json
function loadProjPackage(projName, projDir) {
    var pkgPath = _path.resolve(projDir, 'package.json'),
        pkg = {
            name: projName,
            version: '0.1.0',
            fcOpt: null
        };
    if (!_fs.existsSync(pkgPath)) {
        saveProjPackage(pkg, projDir);
    } else {
        try {
            var content = _fs.readFileSync(pkgPath).toString();
            pkg = angular.fromJson(content);
        } catch (e) {
            console.log('readProjPackage 时发生异常: ', e);
            saveProjPackage(pkg, projDir);
        }
    }
    return pkg;
}

// 保存 package.json
function saveProjPackage(pkg, projDir) {
    var pkgPath = _path.resolve(projDir, 'package.json'),
        content = angular.toJson(pkg, true);
    try {
        _fs.writeFileSync(pkgPath, content);
    } catch (e) {
        console.log('saveProjPackage 时发生异常: ', e);
    }
}

var initOpt = require('../initial-options.json');
// 获取默认项目配置
function getNewOpt() {
    var opt = Utils.deepCopy(initOpt);
    opt.id = null;
    opt.projName = '';
    opt.projDir = '';
    return opt;
}

