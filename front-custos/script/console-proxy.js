/**
 * Created by krimeshu on 2016/5/14.
 */

var console = global.console;

module.exports = {
    get console() {
        return console;
    },
    takeOverConsole: function (_console) {
        if (_console.log && _console.info && _console.warn && _console.error) {
            console = _console;
        }
    }
};
