/**
 * Created by krimeshu on 2016/5/15.
 */

var _fs = require('fs'),
    _path = require('path');

module.exports = {
    getCompiledPathFromOriginal: function (originalFilePath) {
        var dirName = _path.dirname(originalFilePath),
            extName = _path.extname(originalFilePath),
            originalBaseName = _path.basename(originalFilePath, extName),
            compiledFilePath = null;
        switch (extName) {
            case '.es6':
            case '.coffee':
            case '.ts':
                compiledFilePath = _path.resolve(dirName, originalBaseName + '.js');
                break;
            case '.sass':
            case '.scss':
                compiledFilePath = _path.resolve(dirName, originalBaseName + '.css');
                break;
            case '.js':
            default:
                compiledFilePath = _path.resolve(dirName, originalBaseName + '.compiled' + extName);
                break;
        }
        return compiledFilePath;
    },
    getOriginalPathFromCompiled: function (compiledFilePath) {
        var dirName = _path.dirname(compiledFilePath),
            extName = _path.extname(compiledFilePath),
            compiledBaseName = _path.basename(compiledFilePath, extName),
            originalFilePath = null,

            regCompiled = /\.compiled$/,
            fileName = null;
        if (regCompiled.test(compiledBaseName)) {
            originalFilePath = _path.resolve(dirName, compiledBaseName.replace(regCompiled, '') + extName);
        } else {
            switch (extName) {
                case '.js':
                    fileName = compiledBaseName + '.es6';
                    if (this._existsFileUnderDirIgnoreCase(dirName, fileName)) {
                        originalFilePath = _path.resolve(dirName, fileName);
                        break;
                    }
                    fileName = compiledBaseName + '.coffee';
                    if (this._existsFileUnderDirIgnoreCase(dirName, fileName)) {
                        originalFilePath = _path.resolve(dirName, fileName);
                        break;
                    }
                    fileName = compiledBaseName + '.ts';
                    if (this._existsFileUnderDirIgnoreCase(dirName, fileName)) {
                        originalFilePath = _path.resolve(dirName, fileName);
                        break;
                    }
                    break;
                case '.css':
                    fileName = compiledBaseName + '.sass';
                    if (this._existsFileUnderDirIgnoreCase(dirName, fileName)) {
                        originalFilePath = _path.resolve(dirName, fileName);
                        break;
                    }
                    fileName = compiledBaseName + '.scss';
                    if (this._existsFileUnderDirIgnoreCase(dirName, fileName)) {
                        originalFilePath = _path.resolve(dirName, fileName);
                        break;
                    }
                    break;
            }
        }
        return originalFilePath;
    },
    _existsFileUnderDirIgnoreCase: function (dirPath, fileName) {
        var children = _fs.readdirSync(dirPath);
        fileName = fileName.toLowerCase();
        for (var i = 0, l = children.length; i < l; i++) {
            var child = children[i];
            if (child.toLowerCase() === fileName) {
                return true;
            }
        }
        return false;
    }
};
