/**
 * Created by krimeshu on 2016/1/10.
 */

var Through2 = require('through2'),
    Cheerio = require('cheerio');

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('./utils.js');

/**
 * 文件分发链接器
 * @param opts 配置项
 * @param onError 异常处理函数
 * @constructor
 */
var FileLinker = function (opts, onError) {
    this.opts = opts;
    this.onError = onError;
};

FileLinker.prototype = {
    // 用于匹配语法的正则表达式
    _regExp: /(?:\/\/)?[#_]link\(['"]?([^\)'"]+)['"]?\)/gi,
    _regExpHtml: /<(?:link|script|img|audio|video|source)[^>]*(?:href|src|data\-src)\s*=\s*['"]?([^<>'"\$]+)[<>'"\$]?[^>]*>/gi,
    _regExpCss: /[,:\s\b\f\n\t\r]url\(['"]?([^\)'"]+)['"]?\)/gi,
    // 获取初始化后的正则表达式
    _getRegExp: function (type) {
        var self = this,
            reg = type === 'css' ? self._regExpCss :
                type === 'html' ? self._regExpHtml :
                    self._regExp;
        return new RegExp(reg);
    },
    // 分析项目的文件引用关系
    analyseDepRelation: function (src) {
        var self = this,
            onError = self.onError,
            cache = {},
            finalList = [];
        self.onError = null;
        try {
            var entryFiles = Utils.getFilesOfDir(src, '.html|.shtml|.php', true);
            entryFiles.forEach(function (entryFile) {
                entryFile = Utils.replaceBackSlash(entryFile);
                if (finalList.indexOf(entryFile) >= 0) {
                    return;
                }
                var basename = _path.basename(entryFile);
                if (basename.charAt(0) === '_') {
                    return;
                }
                var depList = self._getFileDep(entryFile, cache, src);
                depList.forEach(function (depFile) {
                    depFile = Utils.replaceBackSlash(depFile);
                    if (finalList.indexOf(depFile) >= 0) {
                        return;
                    }
                    finalList.push(depFile);
                });
                finalList.push(entryFile);
            });
        } catch (e) {
            this.onError && this.onError(e);
        }
        self.onError = onError;
        return finalList;
    },
    // 递归获取引用依赖关系表
    _getFileDep: function (filePath, cache, src) {
        var self = this,
            depList = [],
            isText = Utils.isText(filePath);
        if (!isText) {
            return depList;
        }
        var content = cache[filePath] || _fs.readFileSync(filePath).toString();
        cache[filePath] = content;
        var usedList = self.getUsedFiles({
            path: filePath,
            base: src,
            contents: content
        });
        usedList.forEach(function (_file) {
            depList = depList.concat(self._getFileDep(_file, cache, src));
            depList.push(_file);
        });
        return depList;
    },
    // 判断是否可以忽略此链接
    _canIgnoreLink: function (_rawStr) {
        return (
            // 忽略空链接
            !_rawStr.length ||
            // 忽略非本地文件
            /^(http|https|data|javascript|about|chrome):/.test(_rawStr) ||
            // 忽略各种模板标记
            /((\{\{|}})|(<%|%>)|(\{.*?})|^\$)/.test(_rawStr)
        );
    },
    // 获取单个文件的引用依赖关系表
    getUsedFiles: function (file, cb) {
        var self = this,
            reg = self._getRegExp(),
            match,
            usedFiles = [],
            basePath = Utils.replaceBackSlash(file.base),
            filePath = Utils.replaceBackSlash(file.path),
            dir = _path.dirname(filePath),
            isStyle = Utils.isStyle(filePath),
            isHtml = Utils.isPage(filePath),
            opts = self.opts || {},
            htmlEnhanced = opts.htmlEnhanced;
        if (isStyle) {
            usedFiles = usedFiles.concat(self._getUsedFilesByCssUrl(file, cb));
        }
        if (isHtml) {
            usedFiles = usedFiles.concat(htmlEnhanced ?
                self._getUsedFilesByDom(file, cb) :
                self._getUsedFilesByHtmlUrl(file, cb)
            );
        }
        var content = String(file.contents),
            newContent = content;
        while ((match = reg.exec(content)) !== null) {
            var _rawStr = match[0],
                _rawFile = match[1],
                _file = _rawFile && _rawFile.split(/[?#]/)[0];
            if (!_file || self._canIgnoreLink(_rawFile)) {
                continue;
            }

            if (!_path.isAbsolute(_file)) {
                _file = _path.resolve(dir, _file);
            }
            if (!_fs.existsSync(_file)) {
                var information = '无法链接文件：' + _path.relative(basePath, _file),
                    err = new Error(information);
                err.fromFile = _path.relative(basePath, filePath);
                err.line = Utils.countLineNumber(content, match);
                err.targetFile = _path.relative(basePath, _file);
                self.onError && self.onError(err);
                continue;
            }
            if (!_fs.statSync(_file).isFile()) {
                continue;
            }
            usedFiles.push(_file);
            if (cb) {
                var _newFile = cb(_rawFile, _file),       // 调整后文件路径 = 处理（原始文件路径, 原始文件完整路径）
                //_newStr = _rawStr.replace(_rawFile, _newFile.replace(/\u0024([`&'])/g, '$$$$$1')),
                    _pattern = _rawStr.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1'),
                    _reg = new RegExp(_pattern, 'g');
                newContent = newContent.replace(_reg, _newFile.replace(/\u0024([`&'])/g, '$$$$$1'));
            }
        }
        //if (content.substr(0, 1000) != newContent.substr(0, 1000)) {
        //    console.log('================================================================================');
        //    console.log('> old:', content.substr(0, 1000));
        //    console.log('================================================================================');
        //    console.log('> new:', newContent.substr(0, 1000));
        //}
        if (cb) {
            file.contents = new Buffer(newContent);
        }
        //console.log(' |  getUsedFiles:', usedFiles);
        return usedFiles;
    },
    // 匹配CSS代码中的url来获取文件引用依赖关系
    _getUsedFilesByCssUrl: function (file, cb) {
        var self = this,
            reg = self._getRegExp('css'),
            match,
            basePath = Utils.replaceBackSlash(file.base),
            filePath = Utils.replaceBackSlash(file.path),
            dir = _path.dirname(filePath),
            usedFiles = [];
        //console.log('================================================================================');
        //console.log('> FileLinker._getUsedFilesByCssUrl - file:', filePath);

        var content = String(file.contents),
            newContent = content;

        while ((match = reg.exec(content)) !== null) {
            var _rawStr = match[0],
                _rawFile = match[1],
                _file = _rawFile && _rawFile.split(/[?#]/)[0];
            if (!_file || self._canIgnoreLink(_rawFile)) {
                continue;
            }
            //console.log('    ~ find:', _rawStr);
            if (!_path.isAbsolute(_file)) {
                _file = _path.resolve(dir, _file);
            }
            if (!_fs.existsSync(_file)) {
                //console.log('  but miss: ', _file);
                var information = '无法链接文件：' + _path.relative(basePath, _file),
                    err = new Error(information);
                err.fromFile = _path.relative(basePath, filePath);
                err.line = Utils.countLineNumber(content, match);
                err.targetFile = _path.relative(basePath, _file);
                self.onError && self.onError(err);
                continue;
            }
            if (!_fs.statSync(_file).isFile()) {
                continue;
            }
            usedFiles.push(_file);
            if (cb) {
                var _newFile = cb(_rawFile, _file),       // 调整后文件路径 = 处理（原始文件路径, 原始文件完整路径）
                    _newStr = _rawStr.replace(_rawFile, _newFile.replace(/\u0024([`&'])/g, '$$$$$1')),  // 注意，与上面不同
                    _pattern = _rawStr.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1'),
                    _reg = new RegExp(_pattern, 'g');
                //console.log(_rawStr, '=>', _newStr);
                newContent = newContent.replace(_reg, _newStr.replace(/\u0024([`&'])/g, '$$$$$1'));
            }
        }
        if (cb) {
            file.contents = new Buffer(newContent);
        }
        //console.log(' |  _getUsedFilesByCssUrl:', usedFiles);
        return usedFiles;
    },
    // 匹配HTML代码中的src、href来获取文件引用依赖关系
    _getUsedFilesByHtmlUrl: function (file, cb) {
        var self = this,
            reg = self._getRegExp('html'),
            match,
            basePath = Utils.replaceBackSlash(file.base),
            filePath = Utils.replaceBackSlash(file.path),
            dir = _path.dirname(filePath),
            usedFiles = [];

        var content = String(file.contents),
            newContent = content;

        while ((match = reg.exec(content)) !== null) {
            var _rawStr = match[0],
                _rawFile = match[1],
                _file = _rawFile && _rawFile.split(/[?#]/)[0];
            if (!_file || self._canIgnoreLink(_rawFile)) {
                continue;
            }
            //console.log('    ~ find:', _rawStr);
            if (!_path.isAbsolute(_file)) {
                _file = _path.resolve(dir, _file);
            }
            if (!_fs.existsSync(_file)) {
                //console.log('  but miss: ', _file);
                var information = '无法链接文件：' + _path.relative(basePath, _file),
                    err = new Error(information);
                err.fromFile = _path.relative(basePath, filePath);
                err.line = Utils.countLineNumber(content, match);
                err.targetFile = _path.relative(basePath, _file);
                self.onError && self.onError(err);
                continue;
            }
            if (!_fs.statSync(_file).isFile()) {
                continue;
            }
            usedFiles.push(_file);
            if (cb) {
                var _newFile = cb(_rawFile, _file),       // 调整后文件路径 = 处理（原始文件路径, 原始文件完整路径）
                    _newStr = _rawStr.replace(_rawFile, _newFile.replace(/\u0024([`&'])/g, '$$$$$1')),  // 注意，与上面不同
                    _pattern = _rawStr.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1'),
                    _reg = new RegExp(_pattern, 'g');
                newContent = newContent.replace(_reg, _newStr.replace(/\u0024([`&'])/g, '$$$$$1'));
            }
        }
        if (cb) {
            file.contents = new Buffer(newContent);
        }
        //console.log(' |  _getUsedFilesByHtmlUrl:', usedFiles);
        return usedFiles;
    },
    // 通过解析DOM元素中的属性来获取文件引用依赖关系
    _getUsedFilesByDom: function (file, cb) {
        var self = this,
            basePath = Utils.replaceBackSlash(file.base),
            filePath = Utils.replaceBackSlash(file.path),
            dir = _path.dirname(filePath),
            usedFiles = [];

        var content = String(file.contents),
            $ = Cheerio.load(content, {
                lowerCaseTags: false,
                lowerCaseAttributeNames: false,
                recognizeSelfClosing: true,
                decodeEntities: false
            });
        $('link[href], img[src], script[src], audio[src], video[src], source[src]').each(function () {
            var $this = $(this),
                propName = $this.is('[src]') ? 'src' :
                    $this.is('[href]') ? 'href' :
                        null;
            if (!propName) {
                return;
            }
            var _rawFile = $this.attr(propName),
                _file = _rawFile && _rawFile.split(/[?#]/)[0];
            if (!_file || self._canIgnoreLink(_rawFile)) {
                return;
            }
            //console.log('    ~ find:', _rawFile);
            if (!_path.isAbsolute(_file)) {
                _file = _path.resolve(dir, _file);
            }
            if (!_fs.existsSync(_file)) {
                //console.log('      but miss: ', _file);
                var information = '无法链接文件：' + _path.relative(basePath, _file),
                    err = new Error(information),
                    domPath = [],
                    getSelector = function (elem) {
                        var selector = elem.tagName.toLowerCase(),
                            id = elem.id,
                            classList = elem.classList;
                        id && (selector += '#' + id);
                        classList && [].forEach.call(classList, function (className) {
                            selector += '.' + className;
                        });
                        return selector;
                    };
                domPath.push(getSelector($this.get(0)));
                $this.parents().each(function () {
                    domPath.push(getSelector(this));
                });
                err.fromFile = _path.relative(basePath, filePath);
                err.domPath = domPath.reverse().join('>');
                err.targetFile = _path.relative(basePath, _file);
                self.onError && self.onError(err);
                return;
            }
            if (!_fs.statSync(_file).isFile()) {
                return;
            }
            usedFiles.push(_file);
            if (cb) {
                var _newFile = cb(_rawFile, _file);       // 调整后文件路径 = 处理（原始文件路径, 原始文件完整路径）
                $this.attr(propName, _newFile);
            }
        });
        if (cb) {
            file.contents = new Buffer($.html());
        }
        //console.log(' |  _getUsedFilesByDom:', usedFiles);
        return usedFiles;
    },
    handleFile: function (alOpt, allotMap) {
        var self = this,
            hashCache = {};

        // 相关配置项
        var src = alOpt.src,
            allot = alOpt.allot,
            pageAllotDir = alOpt.pageDir,
            staticAllotDir = alOpt.staticDir,
            staticUrlHead = alOpt.staticUrlHead,
            useStaticUrlHead = alOpt.useStaticUrlHead,
            flatten = alOpt.flatten,
            flattenMap = alOpt.flattenMap,
            hashLink = alOpt.hashLink;

        return Through2.obj(function (file, enc, cb) {
            if (file.isDirectory()) {
                return cb(null, file);
            }

            // 分发的新路径
            var filePath = Utils.replaceBackSlash(file.path),
                fileType = Utils.getFileType(filePath),
                isText = Utils.isText(filePath),
                isPage = Utils.isPage(filePath),
                fromCss = Utils.isStyle(filePath),

                baseName = _path.basename(filePath),
                flattenDir = flattenMap[fileType] || '',

                pathParts = filePath.split('/');

            //console.log('================================================================================');
            //console.log('> FileLinker - file:', filePath);

            for (var i = 0, l = pathParts.length; i < l; i++) {
                if (pathParts[i].charAt(0) === '_') {
                    return cb(null, null);
                }
            }

            //console.log('- baseName:', baseName, '\n- fileType:', fileType, '\n- flattenDir:', flattenDir, '\n===')

            var fileRela = (flatten ?
                        _path.relative(src, _path.resolve(src, flattenDir, baseName)) :
                        _path.relative(src, filePath)
                ),
                newFilePath = Utils.replaceBackSlash(allot ?
                    _path.resolve(src, isPage ? pageAllotDir : staticAllotDir, fileRela) :
                    _path.resolve(src, fileRela)
                );

            //console.log(_path.relative(src, filePath), '=>', _path.relative(src, newFilePath));

            allotMap[filePath] = newFilePath;

            isText && self.getUsedFiles(file, function (_rawFile, _filePath) {
                var _fileType = Utils.getFileType(_filePath),
                    _isPage = Utils.isPage(_filePath),

                    _baseName = _path.basename(_filePath),
                    _flattenDir = flattenMap[_fileType] || '';

                var _fileRela = (flatten ?
                            _path.relative(src, _path.resolve(src, _flattenDir, _baseName)) :
                            _path.relative(src, _filePath)
                    ),
                    _newFilePath = (allot ?
                            _path.resolve(src, _isPage ? pageAllotDir : staticAllotDir, _fileRela) :
                            _path.resolve(src, _fileRela)
                    ),
                    _newFile;

                if (allot && !_isPage && !fromCss && useStaticUrlHead && staticUrlHead) {
                    var _sp = staticUrlHead.charAt(staticUrlHead.length - 1) !== '/' ? '/' : '';
                    _newFile = staticUrlHead + _sp + _fileRela;
                } else {
                    _newFile = _path.relative(_path.dirname(newFilePath), _newFilePath);
                }

                var _hash = '';
                if (hashLink) {
                    _hash = hashCache[_filePath];
                    if (!_hash) {
                        _hash = hashCache[_filePath] = Utils.md5(_filePath, true);
                    }
                    _hash = '?v=' + _hash;
                }
                return Utils.replaceBackSlash(_newFile) + _hash;
            });

            file.path = newFilePath;

            return cb(null, file);
        });
    },
    excludeUnusedFiles: function (usedFiles) {
        return Through2.obj(function (file, enc, cb) {
            var filePath = Utils.replaceBackSlash(file.path),
                fileName = _path.basename(filePath);

            //console.log('================================================================================');
            //console.log('> FileLinker.excludeUnusedFiles - file:', filePath);
            if (fileName[0] !== '_' && (usedFiles === null || usedFiles.indexOf(filePath) >= 0)) {
                //console.log('  - passed.');
                this.push(file);
            }

            return cb();
        });
    },
    excludeEmptyDir: function () {
        return Through2.obj(function (file, enc, cb) {
            var filePath = Utils.replaceBackSlash(file.path);

            //console.log('================================================================================');
            //console.log('> FileLinker.excludeEmptyDir - file:', filePath);
            if (!file.isDirectory() || Utils.getFilesOfDir(filePath, '*', true).length) {
                //if (file.isDirectory()) {
                //    console.log('children:', Utils.getFilesOfDir(filePath, '*', true).length);
                //}
                //console.log('  - passed.');
                this.push(file);
            }

            return cb();
        });
    }
};

module.exports = FileLinker;
