/**
 * Created by krimeshu on 2016/2/16.
 */

var Through2 = require('through2');

var PrefixCrafterProxy = {
    process: function (pcOpt, errorHandler) {
        var PrefixCrafter = require('./prefix-crafter.js');
        return Through2.obj(function (file, enc, cb) {
            if (file.isDirectory()) {
                return cb(null, file);
            }

            var content = String(file.contents);
            //if (pcOpt.update) {
            //    content = PrefixCrafter.unprefix(content);
            //}
            try {
                content = PrefixCrafter.addPrefix(content, pcOpt);
            } catch (e) {
                if (e.source) {
                    delete e.source;
                }
                if (e.input && e.input.source) {
                    delete e.input.source;
                }
                var err = new Error('样式前缀处理异常');
                err.detailError = e;
                errorHandler && errorHandler(err);
            }

            file.contents = new Buffer(content);

            return cb(null, file);
        });
    }
};

module.exports = PrefixCrafterProxy;
