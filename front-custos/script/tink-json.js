/**
 * Created by krimeshu on 2016/4/8.
 */

var TinkJSON = function (opts) {
    opts = opts || {};
    this.beautify = !!opts.beautify;
};

var prototype = TinkJSON.prototype = {};

/**
 * JSON解析（浏览器自带JSON解析出错时使用）
 * @param json
 * @returns {*}
 */
prototype.fromJSON = function (json) {
    try {
        return new Function('return ' + json)();
    } catch (e) {
        return null;
    }
};

/**
 * JSON编码
 * @param target 当前需要处理的对象
 * @param _unfinished 还在处理中的对象
 */
prototype.toJSON = function (target, _unfinished) {
    var self = this,
        buffer = [],
        type = Object.prototype.toString.call(target),
        unfinished = _unfinished || [];
    if (unfinished.indexOf(target) >= 0) {
        throw new Error('Converting circular structure to JSON');
    }
    unfinished.push(target);
    switch (type) {
        case '[object Function]':
            // 函数不编码
            break;
        case '[object Array]':
            buffer.push('[');
            for (var i = 0, l = target.length; i < l; i++) {
                buffer.push(self.toJSON(target[i], unfinished));
                buffer.push(',');
            }
            if (buffer[buffer.length - 1] == ',') {
                buffer.pop();
            }
            buffer.push(']');
            break;
        case '[object Object]':
            buffer.push('{');
            for (var k in target) {
                if (target.hasOwnProperty(k)) {
                    buffer.push('"');
                    buffer.push(k);
                    buffer.push('":');
                    buffer.push(self.toJSON(target[k], unfinished));
                    buffer.push(',');
                }
            }
            if (buffer[buffer.length - 1] == ',') {
                buffer.pop();
            }
            buffer.push('}');
            break;
        case '[object String]':
            buffer.push('"');
            buffer.push(target.replace(/"/g, '\\"'));
            buffer.push('"');
            break;
        default:
            buffer.push(String(target));
            break;
    }
    unfinished.pop();
    return buffer.join('');
};


module.exports = TinkJSON;