function ES6TestRunner(tests) {
    this.tests = tests;
}

ES6TestRunner.prototype.runTests = function () {
    var tests = this.tests,
        splitLine = new Array(41).join('=');
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
