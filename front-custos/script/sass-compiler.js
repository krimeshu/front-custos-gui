/**
 * Created by krimeshu on 2016/4/1.
 */

var sass = require('node-sass');

var SassCompiler = function (onError) {
    var self = this;
    self.onError = onError;
};

SassCompiler.prototype = {
    handleFile: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
            return cb(null, file);
        }).resume;
    }
};

module.exports = SassCompiler;