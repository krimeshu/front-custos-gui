/**
 * Created by krimeshu on 2016/4/13.
 */

var DependencyInjector = function (map) {
    this.argMap = {};
    map && this.registerMap(map);
};

DependencyInjector.prototype = {
    'registerMap': function (map) {
        var argMap = this.argMap;
        for (var k in map) {
            if (map.hasOwnProperty(k)) {
                argMap[k] = map[k];
            }
        }
    },
    'unregisterMap': function (map) {
        var argMap = this.argMap;
        for (var k in map) {
            if (map.hasOwnProperty(k)) {
                delete argMap[k];
            }
        }
    },
    'queryAvailableArguments': function () {
        var argMap = this.argMap,
            argNames = [];
        for (var k in argMap) {
            if (argMap.hasOwnProperty(k)) {
                argNames.push(k);
            }
        }
        return argNames;
    },
    'analyseDependencies': function (func) {
        var type = Object.prototype.toString.call(func),
            funcDepArr = null;
        switch (type) {
            case '[object Array]':
                funcDepArr = func;
                for (var i = 0, e = func.length - 1; i <= e; i++) {
                    if ((i < e && typeof(func[i]) !== 'string') ||
                        (i === e && typeof(func[i]) !== 'function')) {
                        // 格式不符合
                        funcDepArr = null;
                        break;
                    }
                }
                break;
            case '[object Function]':
                // 通过反射解析参数表
                var args = func.toString().match(/^\s*function\s*[^\(]*\(\s*([^\)]*)\)/m)[1];
                funcDepArr = args.replace(/\s/g, '').split(',');
                funcDepArr.push(func);
                break;
        }
        return funcDepArr;
    },
    'invoke': function (func, scope) {
        var args = [],
            argMap = this.argMap,
            funcDepArr = this.analyseDependencies(func),
            err;
        if (!funcDepArr) {
            err = new Error('函数依赖解析失败');
            err.targetFunction = func;
            throw err;
        }
        var depCount = funcDepArr.length - 1;
        func = funcDepArr[depCount];
        for (var i = 0, dep; i < depCount; i++) {
            dep = funcDepArr[i];
            if (!argMap.hasOwnProperty(dep)) {
                err = new Error('未知依赖参数名: ' + dep);
                err.targetFunction = func;
                err.dependencyName = dep;
                throw err;
            }
            args.push(argMap[dep]);
        }
        return func.apply(scope || this, args);
    }
};

module.exports = DependencyInjector;