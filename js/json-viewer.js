/**
 * JSON 对象转为可视化易读的 HTML 代码的工具类
 * Ver 1.0.0 (20160404)
 * Created by krimeshu on 2016/4/2.
 */

var JSONViewer = function (opts) {
    var eventHandler = this._getUsefulDOM(opts.eventHandler),
        indentSize = opts.indentSize,
        expand = opts.expand,
        quoteKeys = opts.quoteKeys,
        theme = opts.theme,
        rowClass = ['json-viewer-row'];
    this.indentSize = indentSize === undefined ? 14 : indentSize | 0;
    this.expand = expand | 0;
    this.quoteKeys = !!quoteKeys;
    typeof (theme) === 'string' && rowClass.push('theme-' + theme);
    this.rowClass = rowClass.join(' ');
    this.setEventHandler(eventHandler);
};

JSONViewer.prototype = {
    _getUsefulDOM: function (unknown) {
        if (this._isDOM(unknown) ||
            (unknown.length && typeof(unknown.append) === 'function')) {
            return unknown;
        }
        return (document.querySelector && document.querySelector(unknown)) ||
            document.getElementById(unknown);
    },
    _isDOM: ( typeof HTMLElement === 'object' ) ?
        function (unknown) {
            return unknown instanceof HTMLElement;
        } :
        function (unknown) {
            return (unknown && typeof unknown === 'object'
            && unknown.nodeType === 1 && typeof unknown.nodeName === 'string');
        },
    _isThis: function (el, selector) {
        var _matches = (el.matches || el.matchesSelector
        || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector);
        if (_matches) {
            return _matches.call(el, selector);
        } else if (el.parentNode) {
            var nodes = el.parentNode.querySelectorAll(selector);
            for (var i = nodes.length; i--;)
                if (nodes[i] === el) {
                    return true;
                }
            return false;
        }
        return false;
    },
    _refluxToFind: function (el, selector, excludeThis) {
        if (!excludeThis && this._isThis(el, selector)) {
            return el;
        } else if (el.parentNode) {
            return this._refluxToFind(el.parentNode, selector);
        } else {
            return null;
        }
    },
    // _findPrevSibling: function (elem) {
    //     while (elem = elem.previousSibling) {
    //         if (elem.nodeType === 1) {
    //             return elem;
    //         }
    //     }
    //     return null;
    // },
    _findNextSibling: function (elem) {
        while (elem = elem.nextSibling) {
            if (elem.nodeType === 1) {
                return elem;
            }
        }
        return null;
    },
    setEventHandler: function (eventHandler) {
        var self = this;
        if (this.eventHandler && this.eventListener) {
            this.eventHandler.removeEventListener('click', this.eventListener);
        }
        this.eventHandler = eventHandler;
        this.eventListener = function (e) {
            var target = e.target,
                row = target && self._refluxToFind(target, '.json-viewer-row'),
                isEmpty = row && self._isThis(row, '.empty'),
                isCollapsed = row && self._isThis(row, '.collapsed'),
                members = row && self._findNextSibling(row),
                afterMembers = members && self._findNextSibling(members);
            if (!isEmpty && members && afterMembers &&
                self._isThis(members, '.json-viewer-array-members,.json-viewer-object-members') &&
                self._isThis(afterMembers, '.json-viewer-after-array-members,.json-viewer-after-object-members')) {
                if (isCollapsed) {
                    row.classList.remove('collapsed');
                    members.classList.remove('collapsed');
                    afterMembers.classList.remove('collapsed');
                } else {
                    row.classList.add('collapsed');
                    members.classList.add('collapsed');
                    afterMembers.classList.add('collapsed');
                }
            }
        };
        this.eventHandler.addEventListener('click', this.eventListener);
    },
    toJSON: function (target, _depth, _unfinished, _isLast, _keyName) {
        var buffer = [],
            type = Object.prototype.toString.call(target),
            unfinished = _unfinished || [],
            depth = _depth | 0,
            indentSize = this.indentSize | 0,
            expand = this.expand | 0,
            rowClass = this.rowClass || 'json-viewer-row',
            isEmpty,
            collapseClass,
            child,
            baseType,
            objectType,
            i, l;
        if (unfinished.indexOf(target) >= 0) {
            throw new Error('Converting circular structure to JSON');
        }
        unfinished.push(target);
        switch (type) {
            case '[object Function]':
                // 函数不编码
                break;
            case '[object String]':
                baseType = 'string';
                break;
            case '[object Number]':
                baseType = 'number';
                break;
            case '[object Boolean]':
                baseType = 'boolean';
                break;
            case '[object Null]':
                baseType = 'null';
                break;
            case '[object Undefined]':
                baseType = 'undefined';
                break;
            case '[object Array]':
                isEmpty = target.length ? '' : ' empty';
                collapseClass = ((expand > 0 && depth >= expand) || isEmpty) ? ' collapsed' : '';
                buffer.push('<div class="' + rowClass + collapseClass + isEmpty + '">');
                _keyName && this._tryPrependKey(buffer, _keyName);
                buffer.push('<div class="json-viewer-bracket">[</div>');
                buffer.push('<div class="json-viewer-collapse-tag json-viewer-ellipsis">...</div>');
                buffer.push('<div class="json-viewer-collapse-tag json-viewer-bracket">]</div>');
                buffer.push('</div>');      // <div class="json-viewer-row">
                buffer.push('<div class="json-viewer-array-members' + collapseClass + '" style="padding-left:' + indentSize + 'px;">');
                for (i = 0, l = target.length - 1; i <= l; i++) {
                    child = this.toJSON(target[i], depth + 1, unfinished, i < l);
                    buffer.push(child);
                }
                buffer.push('</div>');      // <div class="json-viewer-array-members">
                buffer.push('<div class="json-viewer-after-array-members ' + rowClass + collapseClass + '">');
                buffer.push('<div class="json-viewer-bracket">]</div>');
                if (_isLast) {
                    buffer.push('<div class="json-viewer-comma">, </div>');
                }
                buffer.push('</div>');      // <div class="json-viewer-row">
                break;
            case '[object Object]':
                objectType = true;
                break;
            default:
                if (typeof(target) === 'object') {
                    objectType = true;
                } else {
                    baseType = 'value';
                }
                break;
        }
        if (objectType) {
            var keys = [];
            for (var k in target) {
                if (target.hasOwnProperty(k)) {
                    keys.push(k);
                }
            }
            // Error 特殊处理
            if (target.message && keys.indexOf('message') < 0
                && !Object.getOwnPropertyDescriptor(target, 'message').enumerable) {
                keys.splice(0, 0, 'message');
            }
            isEmpty = keys.length ? '' : ' empty';
            collapseClass = ((expand > 0 && depth >= expand) || isEmpty) ? ' collapsed' : '';
            buffer.push('<div class="' + rowClass + collapseClass + isEmpty + '">');
            _keyName && this._tryPrependKey(buffer, _keyName);
            buffer.push('<div class="json-viewer-bracket">{</div>');
            buffer.push('<div class="json-viewer-collapse-tag json-viewer-ellipsis">...</div>');
            buffer.push('<div class="json-viewer-collapse-tag json-viewer-bracket">}</div>');
            buffer.push('</div>');  // <div class="json-viewer-row">
            buffer.push('<div class="json-viewer-object-members' + collapseClass + '" style="padding-left:' + indentSize + 'px;">');
            for (i = 0, l = keys.length - 1; i <= l; i++) {
                k = keys[i];
                child = this.toJSON(target[k], depth + 1, unfinished, i < l, k);
                buffer.push(child);
            }
            buffer.push('</div>');      // <div class="json-viewer-object-members">
            buffer.push('<div class="json-viewer-after-object-members ' + rowClass + collapseClass + '">');
            buffer.push('<div class="json-viewer-bracket">}</div>');
            if (_isLast) {
                buffer.push('<div class="json-viewer-comma">, </div>');
            }
            buffer.push('</div>');      // <div class="json-viewer-row">
        }
        if (baseType) {
            buffer.push('<div class="' + rowClass + '">');
            _keyName && this._tryPrependKey(buffer, _keyName);
            buffer.push('<div class="json-viewer-' + baseType + '">');
            if (baseType === 'string') {
                buffer.push('"');
                buffer.push(target.replace(/"/g, '\\"'));
                buffer.push('"');
            } else {
                buffer.push(String(target));
            }
            buffer.push('</div>');
            if (_isLast) {
                buffer.push('<div class="json-viewer-comma">, </div>');
            }
            buffer.push('</div>');  // <div class="json-viewer-row">
        }
        unfinished.pop();
        return buffer.join('');
    },
    _tryPrependKey: function (buffer, key) {
        var quoteKeys = !!this.quoteKeys;
        buffer.push('<div class="json-viewer-key">');
        quoteKeys && buffer.push('"');
        buffer.push(quoteKeys ? key.replace(/"/g, '\\"') : key);
        quoteKeys && buffer.push('"');
        buffer.push('</div><div class="json-viewer-comma">: </div>');
    }
};
