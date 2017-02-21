import ES6TestRunner from './es6-test-runner';

var testRunner = new ES6TestRunner({
    'test-let': function () {
        var a = [];
        for (let i = 0; i < 10; i++) {
            a[i] = function () {
                console.log(i);
            };
        }
        a[6](); // 6
    },
    'test-class': function () {
        class Animal {
            constructor() {
                this.type = 'animal';
            }

            says(say) {
                console.log(this.type + ' says ' + say);
            }
        }

        let animal = new Animal();
        animal.says('hello'); //animal says hello

        class Cat extends Animal {
            constructor() {
                super();
                this.type = 'cat';
            }
        }

        let cat = new Cat();
        cat.says('hello'); //cat says hello
    },
    'test-templateString': function () {
        var basket = {
            items: ['apple'],
            count: 1,
            onSale: 'banana'
        };
        var str = `
  There are <b>${basket.count}</b> items
   in your basket, <em>${basket.onSale}</em>
  are on sale!
  `;
        console.log(str);
    },
    'test-destructuring': function () {
        let dog = { type: 'animal', many: 2 };
        let {type, many} = dog;
        console.log(type, many);   //animal 2

        let cat = { type: "animal", many: 1 };
        let zoo = { cat, dog };
        console.log(zoo);  //Object {cat: {"type": "animal", "many": 1} dog: {"type": "animal", "many": 2}}
    },
    'test-defaultAndRest': function () {
        function animal(type = 'cat') {
            console.log(type);
        }

        animal();

        function animals(...types) {
            console.log(types);
        }

        animals('cat', 'dog', 'fish'); //["cat", "dog", "fish"]
    },
    'test-arrowFunction': function () {
        var asyncTask = {
            name: 'async task',
            run: function () {
                console.log(this.name + ': start...');
                setTimeout(() => {
                    console.log(this.name + ': complete.');
                }, 1000);
            }
        };
        asyncTask.run();
    }
});

export function test() {
    document.write('test in es6-tests.es6<br/>');
    testRunner.runTests();
}

export default testRunner;