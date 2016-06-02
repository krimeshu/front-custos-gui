/**
 * Created by krimeshu on 2016/4/5.
 */

var _path = require('path'),
    _browserify = require('browserify'),

    Through2 = require('through2');

var BrowserifyProxy = function (onError) {
    var self = this;
    self.onError = onError;
};

BrowserifyProxy.prototype = {
    reg: new RegExp('(^|\n)\\s*((/\\*|\'|")\\s*browserify\\s+entry\\s*(\\*/|\';?|";?)|//\\s*browserify\\s+entry)\\s*($|\r?\n)', 'i'),
    findEntryFiles: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
            try {
                var filePath = file.path,
                    baseName = _path.basename(filePath);

                if (file.isDirectory() || baseName.charAt(0) === '_') {
                    return cb();
                }

                var content = String(file.contents);
                if (!self.reg.test(content)) {
                    return cb();
                }

            } catch (e) {
                self.onError && self.onError(e);
                return cb();
            }
            return cb(null, file);
        }).resume();
    },
    handleFile: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
            console.log('================================================================================');
            console.log('> BrowserifyProxy.handleFile - file:', file.path);
            var errReturned = false;
            _browserify(file.path).bundle(function (err, res) {
                console.log('> BrowserifyProxy.handleFile.bundle - file:', file.path);
                err && self.onError && self.onError(err);
                res && (file.contents = new Buffer(String(res).replace(self.reg, '\n')));
                !errReturned && cb(null, file);
                errReturned = true;
            });
        }).resume();
    }
};

module.exports = BrowserifyProxy;
