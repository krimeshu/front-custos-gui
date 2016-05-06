/**
 * Created by krimeshu on 2016/1/10.
 */

var _os = require('os'),
    _path = require('path'),

    gulp = null,
    runSequenceUseGulp = null,
    runSequence = require('run-sequence'),

    Utils = require('./script/utils.js'),
    Timer = require('./script/timer.js'),
    DependencyInjector = require('./script/dependency-injector.js'),
    ConstReplacer = require('./script/const-replacer.js'),
    FileIncluder = require('./script/file-includer.js'),
    FileLinker = require('./script/file-linker.js'),
    FileUploader = require('./script/file-uploader.js'),
    BrowserifyProxy = require('./script/browserify-proxy.js'),
    SpriteCrafterProxy = require('./script/sprite-crafter-proxy.js'),
    PrefixCrafterProxy = require('./script/prefix-crafter-proxy.js'),

    console = global.console;

var config = {delUnusedFiles: true},
    params = {},
    running = false,
    injector = new DependencyInjector();

module.exports = {
    // 注册相关gulp任务、run-sequence插件
    registerTasks: function (_gulp) {
        gulp = _gulp;
        runSequenceUseGulp = runSequence.use(gulp);

        for (var taskName in tasks) {
            if (!tasks.hasOwnProperty(taskName)) {
                continue;
            }
            gulp.task(taskName, tasks[taskName]);
        }
    },
    // 设置通用配置
    config: function (_config) {
        config = _config;
    },
    // 接管console
    takeOverConsole: function (_console) {
        if (_console.log && _console.info && _console.warn && _console.error) {
            console = _console;
        }
    },
    // 是否任务中
    isRunning: function () {
        return running;
    },
    // 根据项目配置计算出项目源目录
    getSrcDir: function (params) {
        var projDir = params.projDir || params.srcDir,
            innerSrcDir = params.innerSrcDir || '';
        return innerSrcDir ? _path.resolve(projDir, innerSrcDir) : projDir;
    },
    // 根据项目配置计算出项目输出目录
    getDistDir: function (params, outputDir) {
        var projDir = params.projDir || params.srcDir,
            projName = _path.basename(params.projDir),
            innerDistDir = params.innerDistDir || '';
        return innerDistDir ? _path.resolve(projDir, innerDistDir) : _path.resolve(outputDir, projName);
    },
    // 直接执行任务
    runTasks: function (_params, cb) {
        if (running) {
            return;
        }
        params = _params;
        var tasks = params.tasks || [];
        tasks.push(function () {
            running = false;
            cb && cb();
        });
        running = true;
        runSequenceUseGulp.apply(null, tasks);
    },
    // 开始处理并执行任务
    process: function (_params, cb) {
        if (running) {
            return;
        }

        params = _params;
        // 处理项目基本配置
        var projDir = params.projDir || params.srcDir,
            projName = _path.basename(params.projDir),
            version = params.version || '';

        if (!projDir) {
            console.error(Utils.formatTime('[HH:mm:ss.fff]'), '开始任务前，请指定一个项目目录。');
            return;
        }

        // 处理项目源、构建、发布目录路径
        var buildDir = _path.resolve(_os.tmpdir(), 'FC_BuildDir', projName),
            srcDir = this.getSrcDir(params),
            distDir = this.getDistDir(params, config.outputDir);

        params.projName = projName;
        params.buildDir = buildDir;
        params.srcDir = srcDir;
        params.distDir = !params.keepOldCopy ? distDir : _path.resolve(distDir, version);

        // 错误集合
        params.errors = [];

        // 生成项目常量并替换参数中的项目常量
        var constFields = {
            PROJECT: Utils.replaceBackSlash(buildDir),
            PROJECT_NAME: projName,
            VERSION: version
        };
        var replacer = new ConstReplacer(constFields);
        replacer.doReplace(params);
        params.constFields = constFields;

        injector.registerMap(params);
        injector.registerMap({
            params: params,
            console: console
        });

        var timer = new Timer();
        console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + projName + ' 任务开始……');
        this.runTasks(params, function () {
            console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + projName + ' 任务结束。（共计' + timer.getTime() + 'ms）');
            cb && cb();
        });
    }
};

var LazyLoadPlugins = {
    _cached: {},
    get del() {
        return this._cached['del'] || (this._cached['del'] = require('del'));
    },
    get pngquant() {
        return this._cached['pngquant'] || (this._cached['pngquant'] = require('imagemin-pngquant'));
    },
    get plumber() {
        return this._cached['plumber'] || (this._cached['plumber'] = require('gulp-plumber'));
    },
    get cache() {
        return this._cached['cache'] || (this._cached['cache'] = require('gulp-cache'));
    },
    get csso() {
        return this._cached['csso'] || (this._cached['csso'] = require('gulp-csso'));
    },
    get imagemin() {
        return this._cached['imagemin'] || (this._cached['imagemin'] = require('gulp-imagemin'));
    },
    get sass() {
        return this._cached['sass'] || (this._cached['sass'] = require('gulp-sass'));
    }
};

var getTaskErrorHander = function (taskName) {
    return function (err) {
        var errWrap = {
            text: taskName + ' 异常: ',
            err: err
        };
        params.errors.push(errWrap);
        console.error(Utils.formatTime('[HH:mm:ss.fff]'), errWrap.text, errWrap.err);
    };
};

var tasks = {
    // 准备构建环境：
    // - 清理构建文件夹
    // - 复制源文件到构建文件夹
    'prepare_build': function (done) {
        var srcDir = params.srcDir,
            buildDir = params.buildDir,

            errorHandler = getTaskErrorHander('prepare_build');

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务开始……');
        var afterClean = function () {
            gulp.src([_path.resolve(srcDir, '**/*'), '!*___jb_tmp___'])
                .pipe(LazyLoadPlugins.plumber({
                    'errorHandler': errorHandler
                }))
                .pipe(gulp.dest(buildDir))
                .on('end', function () {
                    // 预处理脚本
                    var preprocessing;
                    try {
                        preprocessing = Utils.tryParseFunction(params.preprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的预处理脚本格式有误，请检查相关配置。');
                    }
                    try {
                        preprocessing && injector.invoke(preprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的预处理将本执行异常：', e);
                    }
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
        };
        var cleanFailed = function (e) {
            var err = new Error('输出目录清理失败，请检查浏览器是否占用目录');
            err.detail = e;
            errorHandler(err);

            afterClean();
        };
        LazyLoadPlugins.del([_path.resolve(buildDir, '**/*')], {force: true}).then(afterClean).catch(cleanFailed);
    },
    // 替换常量：
    // - 替换常见常量（项目路径、项目名字等）
    'replace_const': function (done) {
        var buildDir = params.buildDir,
            pattern = _path.resolve(buildDir, '**/*@(.js|.css|.scss|.html|.shtml|.php)'),
            constFields = params.constFields;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'replace_const 任务开始……');

        var replacer = new ConstReplacer(constFields);
        //replacer.doReplace(params);
        gulp.src(pattern)
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': getTaskErrorHander('replace_const')
            }))
            .pipe(replacer.handleFile())
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'replace_const 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 编译SASS:
    // - 通过 gulp-sass (基于 node-sass) 编译 scss 文件
    'compile_sass': function (done) {
        var buildDir = params.buildDir,
            pattern = _path.resolve(buildDir, '**/*@(.scss)');

        var errorHandler = getTaskErrorHander('compile_sass');

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'compile_sass 任务开始……');
        gulp.src(pattern)
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(LazyLoadPlugins.sass().on('error', function () {
                // errorHandler(err);
                this.emit('end');
            }))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'compile_sass 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 使用Browserify打包JS:
    'run_browserify': function (done) {
        var buildDir = params.buildDir,
            pattern = _path.resolve(buildDir, '**/*@(.js)');

        var errorHandler = getTaskErrorHander('run_browserify'),
            browserify = new BrowserifyProxy(errorHandler);

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_browserify 任务开始……');
        gulp.src(pattern)
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(browserify.findEntryFiles())
            .pipe(browserify.handleFile())
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_browserify 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 合并文件：
    // - 根据 #include 包含关系，合并涉及到的文件
    'join_include': function (done) {
        var buildDir = params.buildDir;
        var errorHandler = getTaskErrorHander('join_include'),
            includer = new FileIncluder(errorHandler);

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'join_include 任务开始……');
        var fileList = includer.analyseDepRelation(buildDir);
        gulp.src(fileList, {base: buildDir})
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(includer.handleFile())
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'join_include 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 雪碧图处理：
    // - 使用 Sprite Crafter（基于 spritesmith）解析CSS，自动合并雪碧图
    'sprite_crafter': function (done) {
        var buildDir = params.buildDir,
            pattern = _path.resolve(buildDir, '**/*@(.css)'),
            scOpt = params.scOpt;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'sprite_crafter 任务开始……');
        var files = [],
            maps = {};
        scOpt.src = buildDir;
        gulp.src(pattern)
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': getTaskErrorHander('sprite_crafter')
            }))
            .pipe(SpriteCrafterProxy.analyseUsedImageMap(files, maps))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                scOpt.files = files;
                scOpt.maps = maps;
                SpriteCrafterProxy.process(scOpt, function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'sprite_crafter 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
            });
    },
    // 前缀处理：
    // - 使用 Prefix Crafter（基于 autoprefixer）处理CSS，自动添加需要的浏览器前缀
    'prefix_crafter': function (done) {
        var buildDir = params.buildDir,
            pattern = _path.resolve(buildDir, '**/*@(.css)'),
            pcOpt = params.pcOpt,

            errorHandler = getTaskErrorHander('prefix_crafter');

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prefix_crafter 任务开始……');
        gulp.src(pattern)
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(PrefixCrafterProxy.process(pcOpt, errorHandler))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prefix_crafter 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 分发链接：
    // - 根据文件类型分发文件到不同的目录
    // - 根据 #link 语法、CSS中 url() 匹配和 HTML 解析，自动提取并替换静态资源的链接
    'allot_link': function (done) {
        var buildDir = params.buildDir,
            alOpt = params.alOpt,

            htmlEnhanced = config.htmlEnhanced,
            flattenMap = config.flattenMap;

        alOpt.src = buildDir;
        alOpt.flattenMap = flattenMap;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'allot_link 任务开始……');

        var errorHandler = getTaskErrorHander('allot_link'),
            linker = new FileLinker({
                htmlEnhanced: htmlEnhanced
            }, errorHandler);
        var fileAllotMap = {},                               // 用于记录文件分发前后的路径关系
            usedFiles = linker.analyseDepRelation(buildDir); //记录分发前的文件依赖表
        // 1. 将构建文件夹中的文件进行分发和重链接，生成到分发文件夹中
        gulp.src(_path.resolve(buildDir, '**/*'))
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(linker.handleFile(alOpt, fileAllotMap))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                // 2. 更新分发后的使用文件依赖关系表
                var recycledFiles = [],
                    allotedUsedFiles = [];
                for (var oldFile in fileAllotMap) {
                    if (fileAllotMap.hasOwnProperty(oldFile)) {
                        var newFile = fileAllotMap[oldFile];
                        oldFile !== newFile && recycledFiles.push(oldFile);
                    }
                }
                usedFiles.forEach(function (filePath) {
                    filePath = fileAllotMap[filePath] || filePath;
                    allotedUsedFiles.push(filePath);
                });
                params.usedFiles = allotedUsedFiles;

                //console.log('recycledFiles:', recycledFiles);
                //console.log('allotedUsedFiles:', allotedUsedFiles);
                // 3. 清空构建文件夹的过期旧文件
                var afterClean = function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'allot_link 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                };
                var cleanFailed = function (e) {
                    var err = new Error('输出目录清理失败，请检查浏览器是否占用目录');
                    err.detail = e;
                    errorHandler(err);

                    afterClean();
                };
                LazyLoadPlugins.del(recycledFiles, {force: true}).then(afterClean).catch(cleanFailed);
            });
    },
    // 压缩CSS
    'run_csso': function (done) {
        var buildDir = params.buildDir;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_csso 任务开始……');
        gulp.src(_path.resolve(buildDir, '**/*.css'))
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': getTaskErrorHander('run_csso')
            }))
            .pipe(LazyLoadPlugins.csso({
                restructure: false,
                sourceMap: false,
                debug: false
            }))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'run_csso 任务结束。（' + timer.getTime() + 'ms）');
                done();
            });
    },
    // 优化图片：
    // - Png图片有损压缩（PngQuant）
    // - Jpg图片转为渐进式
    // - Gif图片转为隔行加载
    'optimize_image': function (done) {
        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'optimize_image 任务开始……');

        runSequenceUseGulp(['optimize_image:png', 'optimize_image:other'], function () {
            logId && console.useId && console.useId(logId);
            console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'optimize_image 任务结束。（' + timer.getTime() + 'ms）');
            done();
        });
    },
    'optimize_image:png': function (done) {
        var buildDir = params.buildDir;

        gulp.src(_path.resolve(buildDir, '**/*.png'))
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': getTaskErrorHander('optimize_image:png')
            }))
            .pipe(LazyLoadPlugins.cache(LazyLoadPlugins.pngquant({
                quality: '50-80',
                speed: 4
            })(), {
                fileCache: new LazyLoadPlugins.cache.Cache({cacheDirName: 'imagemin-cache'})
            }))
            .pipe(gulp.dest(buildDir))
            .on('end', done);
    },
    'optimize_image:other': function (done) {
        var buildDir = params.buildDir;

        gulp.src(_path.resolve(buildDir, '**/*.{jpg,gif}'))
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': getTaskErrorHander('optimize_image:other')
            }))
            .pipe(LazyLoadPlugins.cache(LazyLoadPlugins.imagemin({
                progressive: true,
                interlaced: true
            }), {
                fileCache: new LazyLoadPlugins.cache.Cache({cacheDirName: 'imagemin-cache'})
            }))
            .pipe(gulp.dest(buildDir))
            .on('end', done);
    },
    // 发布：
    // - 清理发布文件夹
    // - 将构建文件夹中的文件发布到发布文件夹
    'do_dist': function (done) {
        var buildDir = params.buildDir,
            distDir = params.distDir,
            usedFiles = params.usedFiles,

            htmlEnhanced = config.htmlEnhanced,
            delUnusedFiles = config.delUnusedFiles;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_dist 任务开始……');

        var errorHandler = getTaskErrorHander('do_dist'),
            linker = new FileLinker({
                htmlEnhanced: htmlEnhanced                                 // php代码处理有误，关闭 cheerio 解析
            }, errorHandler);

        //console.log('usedFiles:', usedFiles);
        if (delUnusedFiles) {
            if (!usedFiles) {
                usedFiles = params.usedFiles = linker.analyseDepRelation(buildDir);
            }
        } else {
            usedFiles = null;
        }

        var afterClean = function () {
            gulp.src(_path.resolve(buildDir, '**/*'))
                .pipe(LazyLoadPlugins.plumber({
                    'errorHandler': errorHandler
                }))
                .pipe(linker.excludeUnusedFiles(usedFiles))
                .pipe(linker.excludeEmptyDir())
                .pipe(gulp.dest(distDir))
                .on('end', function () {
                    // 后处理脚本
                    var postprocessing;
                    try {
                        postprocessing = Utils.tryParseFunction(params.postprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的后处理脚本格式有误，请检查相关配置。');
                    }
                    try {
                        postprocessing && injector.invoke(postprocessing);
                    } catch (e) {
                        console.error(Utils.formatTime('[HH:mm:ss.fff]'), '项目的后处理将本执行异常：', e);
                    }
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_dist 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
        };
        var cleanFailed = function (e) {
            var err = new Error('输出目录清理失败，请检查浏览器是否占用目录');
            err.detail = e;
            errorHandler(err);

            afterClean();
        };
        LazyLoadPlugins.del([_path.resolve(distDir, '**/*')], {force: true}).then(afterClean).catch(cleanFailed);
    },
    // 上传：
    // - 将发布文件夹中的文件发到测试服务器
    'do_upload': function (done) {
        var distDir = params.distDir,

            upOpt = params.upOpt,

            uploadAll = upOpt.uploadAll,
            uploadPage = upOpt.page,
            uploadForm = upOpt.form,
            uploadJudge = upOpt.judge,

            concurrentLimit = config.concurrentLimit | 0,

            errorHandler = getTaskErrorHander('do_upload');

        if (concurrentLimit < 1) {
            concurrentLimit = Infinity;
        }

        var uploader = new FileUploader({
            console: console,
            forInjector: params,

            uploadAll: uploadAll,
            uploadPage: uploadPage,
            uploadForm: uploadForm,
            uploadJudge: uploadJudge,
            concurrentLimit: concurrentLimit
        }, errorHandler);

        var timer = new Timer();
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_upload 任务开始……');

        gulp.src(_path.resolve(distDir, '**/*'))
            .pipe(LazyLoadPlugins.plumber({
                'errorHandler': errorHandler
            }))
            .pipe(uploader.appendFile())
            .on('end', function () {
                var logId = console.genUniqueId && console.genUniqueId();
                uploader.start(function onProgress(results) {
                    // 完成一个文件时
                    var succeedCount = results.succeed.length,
                        failedCount = results.failed.length,
                        queueCount = results.queue.length,
                        info = 'do_upload 任务进度：' + succeedCount + '/' + queueCount +
                            (failedCount ? ', 失败：' + failedCount : '');
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), info);
                    //console.log('服务器回复：', response);
                }, function onComplete(results) {
                    // 完成所有文件时
                    var succeedCount = results.succeed.length,
                        failedCount = results.failed.length,
                        queueCount = results.queue.length,
                        unchangedCount = results.unchanged.length,
                        totalCount = results.totalCount,
                        resText = 'do_upload 任务结束' +
                            (queueCount ? '，上传' + queueCount + '个文件' : '') +
                            (succeedCount ? '，成功' + succeedCount + '个' : '') +
                            (failedCount ? '，失败' + failedCount + '个' : '') +
                            '。总计' + totalCount + '个文件' +
                            (unchangedCount === totalCount ? '，无任何文件变更' :
                                (unchangedCount ? '，其中' + unchangedCount + '个无变更' : '')) +
                            '。';
                    logId && console.useId && console.useId(logId);
                    console.info(Utils.formatTime('[HH:mm:ss.fff]'), resText + '（' + timer.getTime() + 'ms）');
                    if (succeedCount) {
                        console.log(succeedCount, '个文件上传成功：', results.succeed);
                    }
                    if (failedCount) {
                        console.log(failedCount, '个文件上传失败：', results.failed);
                    }
                    done();
                });
            });
    }
};
