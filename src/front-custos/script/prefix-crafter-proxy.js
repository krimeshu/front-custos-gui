/**
 * Created by krimeshu on 2016/2/16.
 */

var Through2 = require('through2'),
    PrefixCrafter = require('./prefix-crafter.js');

var PrefixCrafterProxy = {
    process: function (pcOpt){
        return Through2.obj(function (file, enc, cb) {
            if (file.isDirectory()) {
                return cb(null, file);
            }

            var content = String(file.contents);
            //if (pcOpt.update) {
            //    content = PrefixCrafter.unprefix(content);
            //}
            content = PrefixCrafter.addPrefix(content, pcOpt);

            file.contents = new Buffer(content);

            return cb(null, file);
        });
    }
};

module.exports = PrefixCrafterProxy;
