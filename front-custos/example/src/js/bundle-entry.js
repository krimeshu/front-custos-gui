// 表明这个是入口文件，需要进行模块打包
'browserify entry';

var es6Tests = require('./lib/es6-tests.js');

es6Tests.test();
