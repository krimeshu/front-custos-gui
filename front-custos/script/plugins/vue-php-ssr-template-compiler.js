/**
 * Created by krimeshu on 2017/2/9.
 */

var Through2 = require('through2'),
    Cheerio = require('cheerio');

var _fs = require('fs'),
    _path = require('path'),

    Utils = require('../utils.js');

/**
 * Vue-PHP模板转译器
 * @param onError 异常处理函数
 * @constructor
 */
var VuePhpSsrTemplateCompiler = function (onError) {
    this.onError = onError;
};

VuePhpSsrTemplateCompiler.prototype = {
    _regTag: /<vue-php-ssr-template>([^\u0000]*?)<\/vue-php-ssr-template>/gi,
    _regForProp: /^\s*\(\s*([^\s]*?)\s*,\s*([^\s]*?)\s*\)\s*in\s*([^\s]*?)\s*$/gi,
    _regForMustache: /{{([^\u0000]*?)}}/gi,
    _regSplit: /[\s\+\-\*\/&\^\|\[\]\(\)\{\}=\!~\?:]/,
    _regPreserve: /(true|false|null)/,
    handleFile: function () {
        var self = this;
        return Through2.obj(function (file, enc, cb) {
            var filePath = file.path,
                isDir = file.isDirectory(),
                isText = !isDir && Utils.isText(filePath),
                content = isText ? String(file.contents) : file.contents;

            if (isText) {
                content = self.analyseDom(content);
                file.contents = new Buffer(content);
            }

            return cb(null, file);
        });
    },
    // 通过解析DOM元素中的属性来获取标记的模板
    analyseDom: function (content) {
        var self = this,
            mark = '<!-- vue-php-ssr-template -->',
            reg = new RegExp(self._regTag),
            newContent = content,
            match;

        // 处理 <vue-php-ssr-template/> 标签
        while ((match = reg.exec(content)) !== null) {
            var _rawStr = match[0],
                _rawTpl = match[1];

            var $ = Cheerio.load(_rawTpl, {
                recognizeSelfClosing: true,
                normalizeWhitespace: false,
                lowerCaseTags: false,
                lowerCaseAttributeNames: false,
                recognizeSelfClosing: true,
                decodeEntities: false
            });

            // 选出带有 v-for 属性的元素，开始处理成 PHP 模板
            $('[v-for]').each(function () {
                var $this = $(this),
                    forProp = $this.attr('v-for'),
                    regForProp = new RegExp(self._regForProp),
                    forPropMatch = regForProp.exec(forProp);
                if (forPropMatch === null || forPropMatch.length < 3) {
                    return;
                }
                var keyName = forPropMatch[1],
                    valueName = forPropMatch[2],
                    listName = forPropMatch[3];
                $this.before('<?php foreach ($' + listName + ' as $' + keyName + ' => $' + valueName + ') { ?>')
                    .after('<?php } ?>');
                $this.removeAttr('v-for');
                // console.log('found v-for');
            });
            $('[clear-before-render]').attr('v-if', 'false').removeAttr('clear-before-render');
            $('[v-cloak]').removeAttr('v-cloak');

            var _phpTpl = $.html(),
                _newPhpTpl = _phpTpl;
            // console.log('html:', _phpTpl);
            {
                // 将 Mustache 处理成 PHP echo
                let reg = new RegExp(self._regForMustache),
                    match;
                while ((match = reg.exec(_phpTpl)) !== null) {
                    let _rawStr = match[0],
                        _rawExp = match[1],
                        _isSplit = new RegExp(self._regSplit),
                        _isPreserve = new RegExp(self._regPreserve);
                    let _newStr = '',
                        _varBuffer = [];
                    // 简单分词
                    for (let i = 0, l = _rawExp.length; i < l; i++) {
                        let c = _rawExp[i],
                            isVBC = !_isSplit.test(c);
                        if (isVBC) {
                            _varBuffer.push(c);
                        }
                        if (!isVBC || i + 1 >= l) {
                            if (_varBuffer.length) {
                                // 待输出的变量名
                                let _varName = _varBuffer.join('');
                                _varBuffer = [];
                                // 转换字段名
                                _varName = _varName.split('.').map(function (f, i) {
                                    if (i > 0) {
                                        return '[\'' + f.replace(/'/g, '\\\'') + '\']';
                                    }
                                    return f.replace(/^\s*/, '');
                                }).join('');
                                // 是否合法变量名
                                let isPreserve = _isPreserve.test(_varName);
                                if (/^[_\$a-z]/i.test(_varName) && !isPreserve) {
                                    _varName = '$' + _varName;
                                }
                                if (isPreserve) {
                                    _varName = _varName.toUpperCase();
                                }
                                _newStr += _varName;
                            }
                            if (!isVBC) {
                                // 待输出的分隔符
                                _newStr += c;
                            }
                        }
                    }
                    let _newExp = '<?php echo ' + _newStr + '; ?>';
                    let _pattern = _rawStr.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1'),
                        _reg = new RegExp(_pattern, 'g');
                    _newPhpTpl = _newPhpTpl.replace(_reg, _newExp.replace(/\u0024([\$`&'])/g, '$$$$$1'));
                }
            }

            {
                // 将处理完的脚本，结合原始脚本，一起替换到新文本内容中
                let _pattern = _rawStr.replace(/([\^\$\(\)\*\+\.\[\]\?\\\{}\|])/g, '\\$1'),
                    _reg = new RegExp(_pattern, 'g'),
                    _newTpl = mark + _newPhpTpl + _rawTpl + mark;
                newContent = newContent.replace(_reg, _newTpl.replace(/\u0024([$`&'])/g, '$$$$$1'));
            }
        }

        return newContent;
    }
};

module.exports = VuePhpSsrTemplateCompiler;
