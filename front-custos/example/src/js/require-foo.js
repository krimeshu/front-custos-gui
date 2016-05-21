'use strict';
'browserify entry';

var _moduleFoo = require('./module-foo');

var _moduleFoo2 = _interopRequireDefault(_moduleFoo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_moduleFoo2.default.hello();