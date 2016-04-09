/**
 * Created by krimeshu on 2016/4/8.
 */

var TinkJSON = function (opts) {
    opts = opts || {};
    this.beautify = !!opts.beautify;
    this.indentSize = (opts.indentSize | 0) || 2;
};

TinkJSON.prototype = {
    getType: function (target) {
        return Object.prototype.toString.call(target);
    },
    makeSpace: function (length) {
        return new Array(length + 1).join(' ');
    },
    fromJSON: function (json) {
        try {
            return new Function('return ' + json)();
        } catch (e) {
            return null;
        }
    },
    toJSON: function (target, _depth, _unfinished) {
        var self = this,
            depth = _depth || 0,
            unfinished = _unfinished || [],
            buffer = [],

            beautify = self.beautify,
            indentSize = self.indentSize,

            type = self.getType(target),
            indentStr = self.makeSpace(indentSize * depth),
            subIndentStr = self.makeSpace(indentSize * depth + indentSize),

            baseType, arrayType, objectType,
            keys, key,
            i, l;

        if (unfinished.indexOf(target) >= 0) {
            throw new Error('Converting circular structure to JSON');
        }
        unfinished.push(target);
        switch (type) {
            case '[object Function]':
                // 函数不编码
                break;
            case '[object Object]':
                objectType = type;
                break;
            case '[object Array]':
                arrayType = type;
                break;
            case '[object String]':
                baseType = type;
                break;
            default:
                if (typeof target === 'object') {
                    objectType = type;
                } else {
                    baseType = type;
                }
                break;
        }
        if (baseType) {
            if (typeof target === 'string') {
                buffer.push('"');
                buffer.push(target.replace(/"/g, '\\"'));
                buffer.push('"');
            } else {
                buffer.push(String(target));
            }
        } else if (arrayType) {
            beautify && depth > 0 && buffer.push(indentStr);
            buffer.push('[');
            beautify && buffer.push('\n');
            for (i = 0, l = target.length - 1; i <= l; i++) {
                beautify && buffer.push(subIndentStr);
                buffer.push(self.toJSON(target[i], depth + 1, unfinished));
                i < l && buffer.push(',');
                beautify && buffer.push('\n');
            }
            beautify && buffer.push(indentStr);
            buffer.push(']');
        } else if (objectType) {
            beautify && depth > 0 && buffer.push(indentStr);
            buffer.push('{');
            beautify && buffer.push('\n');
            keys = [];
            for (key in target) {
                if (target.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            for (i = 0, l = keys.length - 1; i <= l; i++) {
                key = keys[i];
                beautify && buffer.push(subIndentStr);
                buffer.push('"');
                buffer.push(key.replace(/"/g, '\\"'));
                buffer.push('":');
                buffer.push(self.toJSON(target[key], depth + 1, unfinished));
                i < l && buffer.push(',');
                beautify && buffer.push('\n');
            }
            beautify && buffer.push(indentStr);
            buffer.push('}');
        }
        unfinished.pop();
        return buffer.join('');
    }
};


module.exports = TinkJSON;