/**
 * Created by krimeshu on 2016/2/18.
 */

var Utils = require('../utils.js');

var Through2 = require('through2');

var ConstReplacer = function (constFields) {
    this.constFields = constFields;

    var regs = this.constRegs = {},
        reg;

    for (var key in constFields) {
        if (!constFields.hasOwnProperty(key)) {
            continue;
        }
        reg = new RegExp('\\{' + key + '\\}', 'g');
        regs[key] = reg;
    }
};

ConstReplacer.prototype = {
    doReplace: function (raw) {
        if (typeof(raw) === 'string') {
            return this._doReplace(raw);
        }
        if (typeof(raw) === 'object') {
            for (var key in raw) {
                if (!raw.hasOwnProperty(key)) {
                    continue;
                }
                raw[key] = this.doReplace(raw[key]);
            }
        }
        return raw;
    },
    _doReplace: function (raw) {
        var constFields = this.constFields,
            constRegs = this.constRegs,
            res = raw;

        if (typeof(raw) !== 'string') {
            return raw;
        }

        // 特殊匹配：~/ = {PROJECT}/
        var projectPath = String(constFields['PROJECT']),
            val, reg;
        if (projectPath) {
            reg = /([('"]\s*)~([/|\\])/g;
            val = projectPath;
            res = res.replace(reg, '$1' + val.replace(/\u0024([$`&'])/g, '$$$$$1') + '$2');
        }
        for (var key in constFields) {
            if (!constFields.hasOwnProperty(key)) {
                continue;
            }
            val = String(constFields[key]);
            reg = constRegs[key];
            res = res.replace(reg, val.replace(/\u0024([$`&'])/g, '$$$$$1'));
        }
        return res;
    },
    handleFile: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
            var filePath = file.path,
                isDir = file.isDirectory(),
                isText = !isDir && Utils.isText(filePath),
                content = isText ? String(file.contents) : file.contents;

            if (isText) {
                content = self._doReplace(content);
                file.contents = new Buffer(content);
            }

            return cb(null, file);
        });
    }
};

module.exports = ConstReplacer;
