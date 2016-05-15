/**
 * Created by krimeshu on 2016/1/10.
 */

var fs = require('fs'),
    path = require('path');

var utils = {
    makeDirs: function (dirPath, mod) {
        if (!dirPath) {
            return false;
        }
        var parent = path.dirname(dirPath);
        if (!fs.existsSync(parent)) {
            this.makeDirs(parent, mod);
        }
        fs.mkdirSync(dirPath, mod);
        return true;
    },
    makeSureDir: function (dirPath) {
        if (!fs.existsSync(dirPath)) {
            this.makeDirs(dirPath, 511); // 511 = 0777
        }
    },
    _textExtNames: ['.php', '.html', '.js', '.css', '.coffee', '.scss'],
    isText: function (file) {
        var extName = path.extname(file).toLowerCase();
        return this._textExtNames.indexOf(extName) >= 0;
    }
};

var FileCache = function () {
    this.clear();
};

FileCache.prototype = {
    get: function (file) {
        var content = this._contents[file];
        if (content === undefined) {
            content = utils.isText(file) ?
                fs.readFileSync(file).toString() :
                fs.readFileSync(file);
            this.set(file, content);
        }
        return content;
    },
    set: function (file, content) {
        this._contents[file] = content;
        return content;
    },
    eachFile: function (cb) {
        var contents = this._contents;
        for (var file in contents) {
            if (!contents.hasOwnProperty(file)) {
                continue;
            }
            cb(file, contents[file]);
        }
    },
    output: function () {
        this.eachFile(function (file, content) {
            //console.log('output: ', file);
            var distFile = file,
                distFileDir = path.dirname(distFile);
            utils.makeSureDir(distFileDir);
            if (utils.isText(distFile)) {
                fs.writeFileSync(distFile, content);
            } else {
                fs.writeFileSync(distFile, content, 'binary');
            }
        });
    },
    clear: function () {
        delete this._contents;
        this._contents = {};
    }
};

module.exports = FileCache;