/**
 * Created by krimeshu on 2016/4/28.
 */

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('./utils.js');

module.exports = {
    checkForMigration: checkForMigration
};

// 检测当前目录的配置和项目列表文件，迁移到个人目录
function checkForMigration() {
    var oldConfigPath = _path.resolve(__dirname, '../fc-config.json'),
        newConfigPath = Utils.configDir('./fc-config.json');
    if (_fs.existsSync(oldConfigPath)) {
        copySync(oldConfigPath, newConfigPath);
        _fs.unlinkSync(oldConfigPath);
    }
    var oldProjListPath = _path.resolve(__dirname, '../fc-project-list.json'),
        newProjListPath = Utils.configDir('./fc-project-list.json');
    if (_fs.existsSync(oldProjListPath)) {
        copySync(oldProjListPath, newProjListPath);
        _fs.unlinkSync(oldProjListPath);
    }
    var oldTemplatePath = _path.resolve(__dirname, '../fc-template'),
        newTemplatePath = Utils.configDir('./fc-template');
    if (_fs.existsSync(oldTemplatePath)) {
        exists(oldTemplatePath, newTemplatePath, function () {
            copyDir(oldTemplatePath, newTemplatePath, function () {
                rmdirSync(oldTemplatePath);
            });
        });
    }
    var oldUploadHistory = _path.resolve(__dirname, '../FC_UploadHistory'),
        newUploadHistory = Utils.configDir('./fc-upload-history');
    if (_fs.existsSync(oldUploadHistory)) {
        exists(oldUploadHistory, newUploadHistory, function () {
            copyDir(oldUploadHistory, newUploadHistory, function () {
                rmdirSync(oldUploadHistory);
            });
        });
    }
}

function copySync(src, dst) {
    _fs.writeFileSync(dst, _fs.readFileSync(src));
}

/*
 * 复制目录中的所有文件包括子目录
 * @param{ String } 需要复制的目录
 * @param{ String } 复制到指定的目录
 */
var copyDir = function (src, dst, callback) {
    // 读取目录中的所有文件/目录
    _fs.readdir(src, function (err, paths) {
        if (err) {
            throw err;
        }
        paths.forEach(function (path) {
            var _src = src + '/' + path,
                _dst = dst + '/' + path,
                readable, writable;
            _fs.stat(_src, function (err, st) {
                if (err) {
                    throw err;
                }
                // 判断是否为文件
                if (st.isFile()) {
                    // 创建读取流
                    readable = _fs.createReadStream(_src);
                    // 创建写入流
                    writable = _fs.createWriteStream(_dst);
                    readable.on('close', function () {
                        callback && callback();
                    });
                    // 通过管道来传输流
                    readable.pipe(writable);
                }
                // 如果是目录则递归调用自身
                else if (st.isDirectory()) {
                    exists(_src, _dst, function (src, dst) {
                        copyDir(src, dst, callback);
                    });
                }
            });
        });
    });
};

// 在复制目录前需要判断该目录是否存在，不存在需要先创建目录
var exists = function (src, dst, callback) {
    _fs.exists(dst, function (exists) {
        // 已存在
        if (exists) {
            callback && callback(src, dst);
        }
        // 不存在
        else {
            _fs.mkdir(dst, function () {
                callback && callback(src, dst);
            });
        }
    });
};


var rmdirSync = (function () {
    function iterator(url, dirs) {
        var stat = _fs.statSync(url);
        if (stat.isDirectory()) {
            dirs.unshift(url);//收集目录
            inner(url, dirs);
        } else if (stat.isFile()) {
            _fs.unlinkSync(url);//直接删除文件
        }
    }

    function inner(path, dirs) {
        var arr = _fs.readdirSync(path);
        for (var i = 0, el; el = arr[i++];) {
            iterator(path + "/" + el, dirs);
        }
    }

    return function (dir, cb) {
        cb = cb || function () {
            };
        var dirs = [];

        try {
            iterator(dir, dirs);
            for (var i = 0, el; el = dirs[i++];) {
                _fs.rmdirSync(el);//一次性删除所有收集到的目录
            }
            cb();
        } catch (e) {//如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
            e.code === "ENOENT" ? cb() : cb(e);
        }
    }
})();
