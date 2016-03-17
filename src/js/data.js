/**
 * Created by krimeshu on 2016/3/12.
 */

var _fs = require('fs'),
    _path = require('path');

module.exports = {
    getTemplates: getTemplates,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    loadProjList: loadProjList,
    saveProjList: saveProjList,
    loadProjPackage: loadProjPackage,
    saveProjPackage: saveProjPackage,
    getInitOpt: getInitOpt
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
            "concurrentLimit": 1,
            "lastWorkingId": null
        };
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
    }
    return config;
}

// 保存默认配置
function saveConfig(config) {
    var configPath = _path.resolve(__dirname, '../fc-config.json'),
        content = angular.toJson(config);
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
        } catch (e) {
            console.log('loadProjList 时发生异常: ', e);
            saveProjList(list);
        }
    }
    return list;
}

// 保存项目列表
function saveProjList(projList) {
    var listPath = _path.resolve(__dirname, '../fc-project-list.json'),
        content = angular.toJson(projList);
    try {
        _fs.writeFileSync(listPath, content);
    } catch (e) {
        console.log('saveProjList 时发生异常: ', e);
    }
}

// 加载 package.json
function loadProjPackage(projName, srcDir) {
    var pkgPath = _path.resolve(srcDir, 'package.json'),
        pkg = {
            name: projName,
            version: '0.1.0',
            fcOpt: null
        };
    if (!_fs.existsSync(pkgPath)) {
        saveProjPackage(pkg, srcDir);
    } else {
        try {
            var content = _fs.readFileSync(pkgPath).toString();
            pkg = angular.fromJson(content);
        } catch (e) {
            console.log('readProjPackage 时发生异常: ', e);
            saveProjPackage(pkg, srcDir);
        }
    }
    return pkg;
}

// 保存 package.json
function saveProjPackage(pkg, srcDir) {
    var pkgPath = _path.resolve(srcDir, 'package.json'),
        content = angular.toJson(pkg);
    try {
        _fs.writeFileSync(pkgPath, content);
    } catch (e) {
        console.log('saveProjPackage 时发生异常: ', e);
    }
}

// 获取默认项目配置
function getInitOpt() {
    return {
        id: null,
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

