/**
 * Created by krimeshu on 2015/11/2.
 */

var _fs = require('fs'),
    _utils = require('../utils.js'),
    _postcss = require('postcss'),
    //_unprefix = require('postcss-unprefix'),
    _autoprefixer = require('autoprefixer');

var DEFAULT_OPTION = {
    AUTOPREFIXER: {
        browsers: 'Android > 2.3, iOS > 6'
    }
};

exports.process = function (opt, cb) {
    var src = opt.src,
        //unprefix = opt.unprefix || false,
        browsers = opt.browsers || DEFAULT_OPTION.AUTOPREFIXER.browsers;

    var optForAP = {
        browsers: browsers
    };

    var cssFiles = _utils.getFilesOfDir(src, '.css', true),
        cssContents = {};

    cssFiles.forEach(function (cssFile) {
        cssContents[cssFile] = _fs.readdirSync(cssFile);
    });

    for (var file in cssContents) {
        var content = cssContents[file];
        //if (unprefix) {
        //    content = exports.unprefix(content);
        //}
        content = exports.addPrefix(content, optForAP);
        cssContents[file] = content;
    }

    cb(cssContents);
};

//exports.unprefix = function (content) {
//    return _postcss(_unprefix({})).process(content, {}).css;
//};

exports.addPrefix = function (content, options) {
    options = options || DEFAULT_OPTION.AUTOPREFIXER;
    return _postcss([_autoprefixer(options)]).process(content).css;
};

//console.log(exports.unprefix('.a { display:-webkit-box; -webkit-transform:translate3d(0,0,0); -webkit-transition:-webkit-transform; }'));
//console.log(exports.addPrefix('.a { display:flex; transform:translate3d(0,0,0); transition:transform; }'));
//console.log(exports.addPrefix(exports.unprefix('.a { display:-webkit-box; -webkit-transform:translate3d(0,0,0); -webkit-transition:-webkit-transform; }')));
