var windowConsole = null,
    fakeConsole = {
        _code: null,
        takeOver: function () {
            windowConsole = window.console;
            window.console = fakeConsole;
            document.write('<pre><code class="fake-console-output"></code></pre>');
            this._code = document.querySelector('.fake-console-output');
        },
        log: function () {
            var args = [].slice.call(arguments, 0);
            windowConsole.log.apply(windowConsole, args);
            this._code.innerHTML += (args.join('') + '\n');
        }
    };

function ES6TestRunner(tests) {
    fakeConsole.takeOver();
    this.tests = tests;
}

ES6TestRunner.prototype.runTests = function () {
    var tests = this.tests,
        splitLine = new Array(41).join('=');
    console.log('es6 tests start:');
    for (var testName in tests) {
        if (tests.hasOwnProperty(testName)) {
            console.log('\n');
            console.log(splitLine);
            console.log('run "' + testName + '"');
            tests[testName]();
        }
    }
};

module.exports = ES6TestRunner;
