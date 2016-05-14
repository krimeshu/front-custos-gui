/**
 * Created by krimeshu on 2016/5/14.
 */

var Utils = require('./utils.js'),
    ConsoleProxy = require('./console-proxy.js');

module.exports = {
    _errors: [],
    getErrorRecords: function () {
        return this._errors;
    },
    clearErrorRecords: function () {
        var self = this,
            errors = self._errors;
        errors.splice(0, errors.length);
    },
    create: function (taskName) {
        var self = this;
        return function (err) {
            var errWrap = {
                text: taskName + ' 异常: ',
                err: err
            }, console = ConsoleProxy.console;
            self._errors.push(errWrap);
            console.error(Utils.formatTime('[HH:mm:ss.fff]'), errWrap.text, errWrap.err);
        };
    }
};