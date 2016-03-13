/**
 * Created by krimeshu on 2016/2/16.
 */

var Timer = function () {
    this.start();
};

Timer.prototype = {
    start: function () {
        this._startTime = new Date();
        this._stopTime = null;
    },
    stop: function () {
        this._stopTime = new Date();
    },
    getTime: function () {
        var start = this._startTime.getTime(),
            end = (this._stopTime || new Date()).getTime();
        return end - start;
    }
};

module.exports = Timer;
