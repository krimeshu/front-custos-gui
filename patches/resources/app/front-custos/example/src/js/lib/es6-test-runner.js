var windowConsole = null,
    fakeConsole = {
        _code: null,
        takeOver: function () {
            windowConsole = window.console;
            window.console = fakeConsole;
            document.write('<pre><code class="fake-console-output"></code></pre>');
            var codes = document.querySelectorAll('.fake-console-output');
            this._code = codes[codes.length - 1];
        },
        restore: function () {
            window.console = windowConsole;
        },
        log: function () {
            var args = [].slice.call(arguments, 0);
            windowConsole.log.apply(windowConsole, args);
            this._code.innerHTML += (args.join('') + '\n');
        },
        warn: function () {
            return this.log.apply(this, this.arguments);
        },
        error: function () {
            return this.log.apply(this, this.arguments);
        },
        dir: function () {
            return this.log.apply(this, this.arguments);
        }
    };

function ES6TestRunner(tests) {
    this.tests = tests;
}

ES6TestRunner.prototype.runTests = function () {
    var tests = this.tests,
        splitLine = new Array(41).join('=');
    console.log('es6 tests start:');
    fakeConsole.takeOver();
    for (var testName in tests) {
        if (tests.hasOwnProperty(testName)) {
            console.log('\n');
            console.log(splitLine);
            console.log('run "' + testName + '"');
            tests[testName]();
        }
    }
    fakeConsole.restore();
};

module.exports = ES6TestRunner;
