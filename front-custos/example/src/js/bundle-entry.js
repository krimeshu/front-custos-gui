// 表明这个是入口文件，需要进行模块打包
'browserify entry';

var es6Tests = require('./lib/es6-tests.js');
// import es6Tests from 'lib/es6-tests';

es6Tests.test();

// import { foo } from './lib/small-module';
// foo();

