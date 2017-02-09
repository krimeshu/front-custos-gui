/**
 * Created by krimeshu on 2016/1/11.
 */

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('../utils.js');

var Through2 = require('through2');

/**
 * 文件包含合并器
 * @param onError 异常处理函数
 * @constructor
 */
var FileIncluder = function (onError) {
    this.onError = onError;
    this.resultCache = {};
};

FileIncluder.prototype = {
    // 用于匹配语法的正则表达式
    _regExp: /(?:\/\/|\/\*|<!--)?[#_]include\(['"]?(.*?)['"]?(,[\s\b\f\n\t\r]*\{[^\u0000]+?})?\)(?:\*\/|-->)?/gi,
    // 获取初始化后的正则表达式
    _getRegExp: function () {
        var self = this,
            reg = self._regExp;
        return new RegExp(reg);
    },
    // 分析源项目的文件包含依赖关系
    analyseDepRelation: function (src) {
        try {
            var self = this,
                entryFiles = Utils.getFilesOfDir(src, '.html|.shtml|.php|.js|.css', true),
                finalList = [],
                cache = {};
            entryFiles.forEach(function (entryFile) {
                entryFile = Utils.replaceBackSlash(entryFile);
                var entryPos = finalList.indexOf(entryFile);
                var depList = self._getFileDep(entryFile, cache);
                depList.forEach(function (depFile) {
                    depFile = Utils.replaceBackSlash(depFile);
                    var depPos = finalList.indexOf(depFile);
                    if (entryPos < 0 && depPos < 0) {
                        // 没有入口文件的相对位置，且没有依赖文件记录
                        finalList.push(depFile);
                    } else if (entryPos >= 0 && depPos < 0) {
                        // 有入口文件的相对位置，但没有依赖文件记录
                        finalList.splice(entryPos++, 0, depFile);
                    } else if (entryPos >= 0 && depPos >= 0 && depPos > entryPos) {
                        // 有入口文件的相对位置，且有依赖文件记录，并且依赖在后
                        finalList.splice(depPos, 1);
                        finalList.splice(entryPos++, 0, depFile);
                    }
                });
                //console.log('================================================================================');
                //console.log('> FileIncluder.analyseDepRelation - file:', entryFile);
                //console.log('  Depend on files:', depList);
                finalList.indexOf(entryFile) < 0 && finalList.push(entryFile);
            });
            return finalList;
        } catch (e) {
            this.onError && this.onError(e);
            return [];
        }
    },
    // 递归获取依赖包含关系表
    _getFileDep: function (file, cache) {
        var self = this,
            reg = self._getRegExp(),
            depList = [],
            isText = Utils.isText(file);
        if (!isText) {
            return depList;
        }
        var content = cache[file] || _fs.readFileSync(file).toString(),
            dir = _path.dirname(file),
            match;
        cache[file] = content;
        while ((match = reg.exec(content)) !== null) {
            var _rawFile = match[1],
                _file = _rawFile && _rawFile.split(/[?#]/)[0]
            if (!_file) {
                continue;
            }
            if (!_path.isAbsolute(_file)) {
                _file = _path.resolve(dir, _file);
            }
            if (!_fs.existsSync(_file)) {
                continue;
            }
            depList = depList.concat(self._getFileDep(_file, cache));
            depList.push(_file);
        }
        return depList;
    },
    // 合并处理包含的文件
    handleFile: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
                var basePath = Utils.replaceBackSlash(file.base),
                    filePath = Utils.replaceBackSlash(file.path),
                    dirPath = _path.dirname(filePath),
                    isDir = file.isDirectory(),
                    isText = !isDir && Utils.isText(filePath),
                    content = isText ? String(file.contents) : file.contents,
                    baseName = _path.basename(filePath),
                    extName = _path.extname(filePath),
                    ignoreSass = /\.(scss|sass)/i.test(extName) && baseName.charAt(0) === '_';

                //console.log('================================================================================');
                //console.log('> FileIncluder - file:', filePath);

                var newContent = content,
                    cache = self.resultCache,
                    reg = self._getRegExp(),
                    match;

                while (!ignoreSass && isText && (match = reg.exec(content)) !== null) {
                    var _str = match[0],
                        _rawFile = match[1],
                        _json = match[2],
                        _file = _rawFile && _rawFile.split(/[?#]/)[0];
                    if (!_rawFile) {
                        continue;
                    }
                    var _para = null,
                        _inlineString = false,
                        _fragName = null;
                    if (_json) {
                        try {
                            _para = JSON.parse(_json.substr(1));
                            _inlineString = !!_para['_inlineString'];
                            _fragName = String(_para['_fragName'] || '')
                                .replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1');
                        } catch (ex) {
                            self.onError && self.onError(ex);
                            continue;
                        }
                    }
                    if (!_path.isAbsolute(_file)) {
                        _file = _path.resolve(dirPath, _file);
                    }
                    _file = Utils.replaceBackSlash(_file);
                    if (!cache.hasOwnProperty(_file)) {
                        var information = '无法包含文件：' + _path.relative(basePath, _file),
                            err = new Error(information);
                        err.fromFile = _path.relative(basePath, filePath);
                        err.line = Utils.countLineNumber(content, match);
                        err.targetFile = _path.relative(basePath, _file);
                        self.onError && self.onError(err);
                        continue;
                    }
                    var _content = cache[_file],
                        _extName = _path.extname(_file);
                    if (Utils.isImage(_file)) {
                        _content = 'data:image/' + _extName.substr(1) +
                            ';base64, ' + _content.toString('base64');
                    } else if (isText) {
                        if (_inlineString) {
                            _content = _content
                                .replace(/("|')/g, '\\$1')
                                .replace(/\r/g, '\\r')
                                .replace(/\n/g, '\\n');
                        }
                        if (_fragName) {
                            _content = _content.split(new RegExp(
                                    '(?:\\/\\*!?|\\/\\/|<!--)\\s*fragBegin\\s*:\\s*' + _fragName + '\\s*(?:\\*\\/|-->)?'
                                ))[1] || '';
                            _content = _content.split(new RegExp(
                                    '(?:\\/\\*!?|\\/\\/|<!--)\\s*fragEnd\\s*:\\s*' + _fragName + '\\s*(?:\\*\\/|-->)?'
                                ))[0] || '';
                        }
                        if (_para) {
                            for (var key in _para) {
                                if (!_para.hasOwnProperty(key)) {
                                    continue;
                                }
                                key = key.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1');
                                var value = String(_para[key]),
                                    valueReg = new RegExp('#' + key + '#', 'g');
                                _content = _content.replace(valueReg, value.replace(/\u0024([$`&'])/g, '$$$$$1'));
                            }
                        }
                    }
                    newContent = newContent.replace(_str, _content.replace(/\u0024([$`&'])/g, '$$$$$1'));
                }

                cache[filePath] = newContent;
                file.contents = isText ? new Buffer(newContent) : newContent;

                return cb(null, file);
            }
        ).resume();
    }
};

module.exports = FileIncluder;