'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.test = test;

var _es6TestRunner = require('./es6-test-runner');

var _es6TestRunner2 = _interopRequireDefault(_es6TestRunner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var testRunner = new _es6TestRunner2.default({
    'test-let': function testLet() {
        var a = [];

        var _loop = function _loop(i) {
            a[i] = function () {
                console.log(i);
            };
        };

        for (var i = 0; i < 10; i++) {
            _loop(i);
        }
        a[6](); // 6
    },
    'test-class': function testClass() {
        var Animal = function () {
            function Animal() {
                _classCallCheck(this, Animal);

                this.type = 'animal';
            }

            _createClass(Animal, [{
                key: 'says',
                value: function says(say) {
                    console.log(this.type + ' says ' + say);
                }
            }]);

            return Animal;
        }();

        var animal = new Animal();
        animal.says('hello'); //animal says hello

        var Cat = function (_Animal) {
            _inherits(Cat, _Animal);

            function Cat() {
                _classCallCheck(this, Cat);

                var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Cat).call(this));

                _this.type = 'cat';
                return _this;
            }

            return Cat;
        }(Animal);

        var cat = new Cat();
        cat.says('hello'); //cat says hello
    },
    'test-templateString': function testTemplateString() {
        var basket = {
            items: ['apple'],
            count: 1,
            onSale: 'banana'
        };
        var str = '\n  There are <b>' + basket.count + '</b> items\n   in your basket, <em>' + basket.onSale + '</em>\n  are on sale!\n  ';
        console.log(str);
    },
    'test-destructuring': function testDestructuring() {
        var dog = { type: 'animal', many: 2 };
        var type = dog.type;
        var many = dog.many;

        console.log(type, many); //animal 2

        var cat = { type: "animal", many: 1 };
        var zoo = { cat: cat, dog: dog };
        console.log(zoo); //Object {cat: {"type": "animal", "many": 1} dog: {"type": "animal", "many": 2}}
    },
    'test-defaultAndRest': function testDefaultAndRest() {
        function animal() {
            var type = arguments.length <= 0 || arguments[0] === undefined ? 'cat' : arguments[0];

            console.log(type);
        }

        animal();

        function animals() {
            for (var _len = arguments.length, types = Array(_len), _key = 0; _key < _len; _key++) {
                types[_key] = arguments[_key];
            }

            console.log(types);
        }

        animals('cat', 'dog', 'fish'); //["cat", "dog", "fish"]
    },
    'test-arrowFunction': function testArrowFunction() {
        var asyncTask = {
            name: 'async task',
            run: function run() {
                var _this2 = this;

                console.log(this.name + ': start...');
                setTimeout(function () {
                    console.log(_this2.name + ': complete.');
                }, 1000);
            }
        };
        asyncTask.run();
    }
});

function test() {
    testRunner.runTests();
}