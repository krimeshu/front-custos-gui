/**
 * Created by krimeshu on 2016/1/10.
 */

var Utils = require('../front-custos/script/utils.js'),
    _this = Utils.deepCopy(Utils);

module.exports = _this;

// DOM相关
(function (_parent) {

    var _this = _parent.DomHelper = _parent.dom = {};

    /**
     * 判断某个元素是否符合某个选择器
     * @param el 目标元素
     * @param selector 选择器
     * @returns {*} 是否符合
     */
    function isThis(el, selector) {
        var _matches = (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector);

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
    }

    _this.isThis = isThis;

    /**
     * 向上寻找符合selector的元素
     * @param el 目标元素
     * @param selector 选择器
     * @param excludeThis 是否包括自己
     * @returns 符合选择器的元素
     */
    function refluxToFind(el, selector, excludeThis) {
        if (!excludeThis && isThis(el, selector)) {
            return el;
        } else if (el.parentNode) {
            return refluxToFind(el.parentNode, selector);
        } else {
            return null;
        }
    }

    _this.refluxToFind = refluxToFind;
})(_this);

(function () {
    _this.playSE = function (seName) {
        var se = document.querySelector('audio[data-se="' + seName + '"]');
        se && se.play();
    };
})(_this);