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
        "ruOpt": {
            "entry": "",
            "plugins": {
                "nodeResolve": false,
                "commonJS": false,
                "babel": true,
                "vue": false,
                "postcssModules": false,
                "uglify": false
            },
            "format": "es"
        },
        "alOpt": {
            "allot": false,
            "pageDir": "",
            "staticDir": "",
            "staticUrlHead": "http://asset-host.example.com/{PROJECT_NAME}",
            "flatten": false,
            "hashLink": "IN_FILE_NAME",
            "useStaticUrlHead": false
        },
        "upOpt": {
            "delta": true,
            "page": "",
            "filter": "/* \n    决定某文件是否需要上传\n      可用的注入参数:\n        - console, params, config, projName, projDir, srcDir, distDir, workDir...\n        - filePath: Path of the uploading file\n        - fileStreem: Stream of the uploading file\n      查看所有可用参数:\n        - console.log(this.queryAvailableArguments();\n */\nfunction uploadFilter(filePath, projName) {     \n    // 例子: \n    //   不上传 *.map 类的文件\n    return !/\\.map$/.test(filePath); \n}",
            "form": "/* \r\n    生成文件上传的表单.\r\n      可用的注入参数:\r\n        - console, params, config, projName, projDir, srcDir, distDir, workDir...\r\n        - filePath: Path of the uploading file\r\n        - fileStreem: Stream of the uploading file\r\n      查看所有可用参数:\r\n        - console.log(this.queryAvailableArguments();\r\n */\r\nfunction uploadForm(fileStream, filePath) {\r\n    // 例子:\r\n    //   生成带有 fileDir, fileName, fileType, fileContents 四个字段的表单，其中 fileContents 为上传的文件内容\r\n    var fileDir = filePath.split('/'),\r\n        fileName = fileDir.pop().split('.'),\r\n        fileType = fileName.length > 1 ? fileName.pop() : '';\r\n    return {\r\n        'fileDir': fileDir.join('/'),\r\n        'fileName': fileName.join('.'),\r\n        'fileType': fileType,\r\n        'fileContents': fileStream\r\n    };\r\n}",
            "judge": "/*\n    判断文件上传是否成功.\n      可用的注入参数:\n        - console, params, config, projName, projDir, srcDir, distDir, workDir...\n        - filePath: Path of the uploading file\n        - fileStreem: Stream of the uploading file\n        - reponse: Reponse from the uploading server\n      查看所有可用参数:\n        - console.log(this.queryAvailableArguments();\n */\nfunction uploadJudge(response) {\n    // 例子: \n    //   根据是否返回 { status: 2 } 判断上传结果.\n    try {\n        var res = JSON.parse(response);\n        return res.status == 2;\n    } catch (e) {\n        return false;\n    }\n}"
        },
        "tasks": [
            "prepare_build",
            "do_dist"
        ],
        "innerSrcDir": "",
        "innerDistDir": "",
        "preprocessing": "/* \n    任务开始前的预处理逻辑\n      可用的注入参数:\n        - console, params, config, projName, projDir, srcDir, distDir, workDir...\n        - filePath: Path of the uploading file\n        - fileStreem: Stream of the uploading file\n      查看所有可用参数:\n        - console.log(this.queryAvailableArguments();\n */\nfunction preprocessing(console, workDir) {\n    console.log('当前工作目录：', workDir);\n}",
        "postprocessing": "/* \n    任务结束前的处理逻辑\n      可用的注入参数:\n        - console, params, config, projName, projDir, srcDir, distDir, workDir...\n        - filePath: Path of the uploading file\n        - fileStreem: Stream of the uploading file\n      查看所有可用参数:\n        - console.log(this.queryAvailableArguments();\n */\nfunction postprocessing(console, workDir) {\n    console.log('当前工作目录：', workDir);\n}",
        "keepOldCopy": false,
        "smOpt": {
            "enable": false,
            "mappingUrl": "// function mappingUrl(file) {\n//     return 'http://asset-host.example.com/' + file.relative + '.map';\n// }"
        }
    },
    exampleProj: {
        "id": "default_example_project_" + Date.now(),
        "projName": "example",
        "projDir": _path.resolve(__dirname, "../front-custos/example")
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


