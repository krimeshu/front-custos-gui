/**
 * Created by krimeshu on 2016/1/10.
 */

var _fs = require('fs'),
    _path = require('path'),
    _crypto = require('crypto');

exports.deepCopy = function (origin, _copy) {
    var self = arguments.callee,
        type = Object.prototype.toString.call(origin),
        copy = origin;
    switch (type) {
        case '[object Object]':
            copy = _copy || {};
            for (var k in origin) {
                if (origin.hasOwnProperty(k)) {
                    copy[k] = self(origin[k]);
                }
            }
            break;
        case '[object Array]':
            copy = _copy || [];
            for (var i = 0, l = origin.length; i < l; i++) {
                copy[i] = self(origin[i]);
            }
            break;
        case '[object Function]':
            copy = new Function(origin.toString());
            break;
    }
    return copy;
};

//计算16位md5
exports.md5 = function (key, isFile) {
    var md5 = _crypto.createHash('md5');
    key = isFile ? _fs.readFileSync(key) : key;
    md5.update(key);
    return md5.digest('hex').substr(8, 16);
};

exports.formatTime = function (format, time) {
    time = time || new Date();

    var year = time.getFullYear(),
        month = time.getMonth() + 1,
        date = time.getDate(),
        hour = time.getHours(),
        hour2 = hour % 12,
        minute = time.getMinutes(),
        second = time.getSeconds(),
        ms = time.getMilliseconds();

    var _year = format.match(/y+/),
        _month = format.match(/M+/),
        _date = format.match(/d+/),
        _hour = format.match(/H+/),
        _hour2 = format.match(/h+/),
        _minute = format.match(/m+/),
        _second = format.match(/s+/),
        _ms = format.match(/f+/);

    var w, res = format;

    if (_year) {
        w = _year[0] || 'yyyy';
        res = res.replace(w, ('' + year).substr(-w.length));
    }
    if (_month) {
        w = _month[0] || 'MM';
        res = res.replace(w, ('0' + month).substr(-w.length));
    }
    if (_date) {
        w = _date[0] || 'dd';
        res = res.replace(w, ('0' + date).substr(-w.length));
    }
    if (_hour) {
        w = _hour[0] || 'HH';
        res = res.replace(w, ('0' + hour).substr(-w.length));
    }
    if (_hour2) {
        w = _hour2[0] || 'hh';
        res = res.replace(w, ('0' + hour2).substr(-w.length));
    }
    if (_minute) {
        w = _minute[0] || 'mm';
        res = res.replace(w, ('0' + minute).substr(-w.length));
    }
    if (_second) {
        w = _second[0] || 'ss';
        res = res.replace(w, ('0' + second).substr(-w.length));
    }
    if (_ms) {
        w = _ms[0] || 'fff';
        res = res.replace(w, ('00' + ms).substr(-w.length));
    }
    return res;
};

// 文件夹相关 ST
exports.makeDirs = function (dirPath, mod) {
    if (!dirPath) {
        return false;
    }
    var parent = _path.dirname(dirPath);
    if (!_fs.existsSync(parent)) {
        exports.makeDirs(parent, mod);
    }
    _fs.mkdirSync(dirPath, mod);
    return true;
};

exports.makeSureDir = function (dirPath) {
    if (!_fs.existsSync(dirPath)) {
        exports.makeDirs(dirPath, 511); // 511 = 0777
    }
};

exports.getFilesOfDir = function (dir, pat, rec) {
    try {
        var files = [],
            children = _fs.readdirSync(dir);

        if (typeof(pat) === 'string') {
            pat = pat.split('|');
        }

        for (var i = 0; i < children.length; i++) {
            var child = children[i],
                fp = _path.resolve(dir, child),
                stat = _fs.statSync(fp);
            if (stat.isFile()) {
                var ext = _path.extname(fp),
                    basename = _path.basename(fp);
                if (pat[0] === '*' ||                               // Any
                    (pat.indexOf && pat.indexOf(ext) >= 0) ||       // Array
                    (pat.test && pat.test(basename))) {             // RegExp
                    files.push(fp);
                }
            } else if (stat.isDirectory() && child.charAt(0) !== '_' && rec) {
                files = files.concat(exports.getFilesOfDir(fp, pat, rec));
            }
        }
        return files;
    } catch (e) {
        return [];
    }
};
// 文件夹相关 ED


// 格式验证相关 ST
exports.getFileType = function (file) {
    var extName = _path.extname(file).toLowerCase(),
        fileTypes = exports.getFileType._fileTypes || (
                exports.getFileType._fileTypes = {
                    page: ['.php', '.html', '.shtml'],
                    style: ['.css', '.sass', '.scss'],
                    script: ['.js', '.coffee'],
                    image: ['.jpg', '.jpeg', '.png', '.gif'],
                    font: ['.eot', '.svg', '.ttf', '.woff', '.woff2'],
                    audio: ['.mp3', '.wav', '.ogg']
                }
            );
    for (var type in fileTypes) {
        if (!fileTypes.hasOwnProperty(type)) {
            continue;
        }
        if (fileTypes[type].indexOf(extName) >= 0) {
            return type;
        }
    }
    return 'other';
};
exports.isText = function (file) {
    var type = exports.getFileType(file);
    return type === 'page' || type === 'style' || type === 'script';
};
exports.isPage = function (file) {
    var type = exports.getFileType(file);
    return type === 'page';
};
exports.isStyle = function (file) {
    var type = exports.getFileType(file);
    return type === 'style';
};
exports.isScript = function (file) {
    var type = exports.getFileType(file);
    return type === 'script';
};
exports.isImage = function (file) {
    var type = exports.getFileType(file);
    return type === 'image';
};
exports.isFont = function (file) {
    var type = exports.getFileType(file);
    return type === 'font';
};
exports.isAudio = function (file) {
    var type = exports.getFileType(file);
    return type === 'audio';
};
// 格式验证相关 ED

exports.countLineNumber = function (content, match) {
    var index = match.index,
        row = 1;
    for (var i = 0, len = content.length; i < index && i < len; i++) {
        if (content.charAt(i) === '\n') {
            row++;
        }
    }
    return row;
};