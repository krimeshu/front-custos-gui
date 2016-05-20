/**
 * Created by krimeshu on 2016/5/14.
 */

var gulp = require('gulp'),

    PluginLoader = require('./plugin-loader.js'),
    plugins = PluginLoader.plugins,
    
    ConsoleProxy = require('./console-proxy.js'),
    DependencyInjector = require('./dependency-injector.js'),
    TaskErrorHandler = require('./task-error-handler.js');

function TaskManager() {
    this._availableTasks = [];
    this._map = {};
    this._data = [];

    this._injector = new DependencyInjector({
        // 固定不变的依赖
        gulp: gulp
    });

    this._define('compile_sass', require('./tasks/compile-sass'), '编译SASS文件');
    this._define('run_babel', require('./tasks/run-babel'), '使用babel转换es6脚本');
    this._define('prepare_build', require('./tasks/prepare-build'), '准备项目构建', 'locked');
    this._define('replace_const', require('./tasks/replace-const'), '替换定义的常量');
    this._define('prefix_crafter', require('./tasks/prefix-crafter'), '添加CSS3前缀');
    this._define('sprite_crafter', require('./tasks/sprite-crafter'), '自动合并雪碧图');
    this._define('run_csso', require('./tasks/run-csso'), '压缩样式');
    this._define('join_include', require('./tasks/join-include'), '合并包含的文件');
    this._define('run_browserify', require('./tasks/run-browserify'), '通过browserify打包脚本');
    this._define('allot_link', require('./tasks/allot-link'), '分发关联文件');
    this._define('optimize_image', require('./tasks/optimize-image'), '压缩图片');
    this._define('do_dist', require('./tasks/do-dist'), '输出项目文件', 'locked');
    this._define('do_upload', require('./tasks/do-upload'), '上传文件', 'disabled');

    this._registerToGulp();
}

TaskManager.prototype = {
    get availableTasks() {
        return this._availableTasks;
    },
    _define: function (name, mod, desc, specProp) {
        if (typeof mod === 'function') {
            this._doDefine(name, mod);
        } else if (typeof mod === 'object') {
            for (var subName in mod) {
                if (mod.hasOwnProperty(subName)) {
                    this._doDefine(subName ? name + ':' + subName : name, mod[subName]);
                }
            }
        }
        var t = {
            name: name,
            desc: desc
        };
        specProp && (t[specProp] = true);
        this._availableTasks.push(t);
    },
    _doDefine: function (name, task) {
        if (this._map[name]) {
            throw new Error('任务“' + name + '”已存在，请勿重复定义');
        }
        var t = this._map[name] = {
            name: name,
            task: task
        };
        this._data.push(t);
    },
    _registerToGulp: function () {
        var injector = this._injector;
        this._data.forEach(function (t) {
            var name = t.name,
                task = t.task,
                funcWithDep = injector.analyseDependencies(task),
                errorHandler = TaskErrorHandler.create(name);
            gulp.task(name, function (done) {
                injector.registerMap({
                    // 每个任务中都会变化的依赖
                    errorHandler: errorHandler
                });
                var executor = injector.invoke(funcWithDep);
                return executor(done);
            });
        });
    },
    fillAndOrderTasks: function (tasks) {
        var _tasks = [],
            availableTasks = this.availableTasks;
        for (var i = 0, task; task = availableTasks[i]; i++) {
            var pos = tasks.indexOf(task.name);
            if (!task.disabled && (pos >= 0 || task.locked)) {
                _tasks.push(task.name);
            }
        }
        var _args = [0, tasks.length].concat(_tasks);
        tasks.splice.apply(tasks, _args);
    },
    runTasks: function (_params, _config) {
        var params = _params || {},
            config = _config || {},
            tasks = params.tasks || [];
        this._injector.registerMap({
            // 每次运行任务可能会变化的依赖
            console: ConsoleProxy.console,
            config: config,
            params: params
        });
        var runSequence = plugins.runSequence.use(gulp);
        runSequence.apply(null, tasks);
    }
};

module.exports = TaskManager;