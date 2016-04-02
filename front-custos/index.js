/**
 * Created by krimeshu on 2016/1/10.
 */

var _os = require('os'),
    _path = require('path'),

    gulp = null,
    runSequenceUseGulp = null,

    runSequence = require('run-sequence'),
    del = require('del'),
    plumber = require('gulp-plumber'),
    cache = require('gulp-cache'),
    csso = require('gulp-csso'),
    imagemin = require('gulp-imagemin'),
    sass = require('gulp-sass'),
    pngquant = require('imagemin-pngquant'),

    Utils = require('./script/utils.js'),
    Timer = require('./script/timer.js'),
    ConstReplacer = require('./script/const-replacer.js'),
    FileIncluder = require('./script/file-includer.js'),
    FileLinker = require('./script/file-linker.js'),
    FileUploader = require('./script/file-uploader.js'),
    SpriteCrafterProxy = require('./script/sprite-crafter-proxy.js'),
    PrefixCrafterProxy = require('./script/prefix-crafter-proxy.js'),

    console = global.console;

module.exports = {
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
    config: function (_config) {
        config = _config;
    },
    takeOverConsole: function (_console) {
        if (_console.log && _console.info && _console.warn && _console.error) {
            console = _console;
        }
    },
    isRunning: function () {
        return running;
    },
    process: function (_params, cb) {
        if (running) {
            return;
        }
        running = true;

        params = _params;

        // 提取项目名称和构建、发布文件夹路径
        params.prjName = _path.basename(params.srcDir);
        params.buildDir = _path.resolve(_os.tmpdir(), 'FC_BuildDir', params.prjName);
        params.distDir = _path.resolve(config.outputDir, params.prjName);

        // 错误集合
        params.errors = [];

        // 生成项目常量并替换参数中的项目常量
        var constFields = {
            PROJECT: params.buildDir,
            PROJECT_NAME: params.prjName,
            VERSION: params.version
        }, replacer = new ConstReplacer(constFields);
        replacer.doReplace(params);
        params.constFields = constFields;

        // 保留旧版副本时，生成路径中加上版本号
        if (params.keepOldCopy) {
            params.distDir = _path.resolve(params.distDir, params.version);
        }

        var timer = new Timer();
        console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + params.prjName + ' 任务开始……');

        var tasks = params.tasks || [];
        tasks.push(function () {
            console.info(Utils.formatTime('[HH:mm:ss.fff]'), '项目 ' + params.prjName + ' 任务结束。（共计' + timer.getTime() + 'ms）');
            running = false;
            cb && cb();
        });
        runSequenceUseGulp.apply(null, tasks);
    }
};

var config = {delUnusedFiles: true},
    params = {},
    running = false;

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
            buildDir = params.buildDir;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务开始……');
        del([_path.resolve(buildDir, '**/*')], {force: true}).then(function () {
            gulp.src(_path.resolve(srcDir, '**/*'))
                .pipe(plumber({
                    'errorHandler': getTaskErrorHander('prepare_build')
                }))
                .pipe(gulp.dest(buildDir))
                .on('end', function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prepare_build 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
        });
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
            .pipe(plumber({
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
            .pipe(sass().on('error', errorHandler))
            .pipe(gulp.dest(buildDir))
            .on('end', function () {
                logId && console.useId && console.useId(logId);
                console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'compile_sass 任务结束。（' + timer.getTime() + 'ms）');
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
            .pipe(plumber({
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
            .pipe(plumber({
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
            pcOpt = params.pcOpt;

        var timer = new Timer();
        var logId = console.genUniqueId && console.genUniqueId();
        logId && console.useId && console.useId(logId);
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'prefix_crafter 任务开始……');
        gulp.src(pattern)
            .pipe(plumber({
                'errorHandler': getTaskErrorHander('prefix_crafter')
            }))
            .pipe(PrefixCrafterProxy.process(pcOpt))
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
            .pipe(plumber({
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
                del(recycledFiles, {force: true}).then(function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'allot_link 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
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
            .pipe(plumber({
                'errorHandler': getTaskErrorHander('run_csso')
            }))
            .pipe(csso({
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
            .pipe(plumber({
                'errorHandler': getTaskErrorHander('optimize_image:png')
            }))
            .pipe(cache(pngquant({
                quality: '65-80',
                speed: 4
            })(), {
                fileCache: new cache.Cache({cacheDirName: 'imagemin-cache'})
            }))
            .pipe(gulp.dest(buildDir))
            .on('end', done);
    },
    'optimize_image:other': function (done) {
        var buildDir = params.buildDir;

        gulp.src(_path.resolve(buildDir, '**/*.{jpg,gif}'))
            .pipe(plumber({
                'errorHandler': getTaskErrorHander('optimize_image:other')
            }))
            .pipe(cache(imagemin({
                progressive: true,
                interlaced: true
            }), {
                fileCache: new cache.Cache({cacheDirName: 'imagemin-cache'})
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

        del([_path.resolve(distDir, '**/*')], {force: true}).then(function () {
            gulp.src(_path.resolve(buildDir, '**/*'))
                .pipe(plumber({
                    'errorHandler': errorHandler
                }))
                .pipe(linker.excludeUnusedFiles(usedFiles))
                .pipe(linker.excludeEmptyDir())
                .pipe(gulp.dest(distDir))
                .on('end', function () {
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_dist 任务结束。（' + timer.getTime() + 'ms）');
                    done();
                });
        });
    },
    // 上传：
    // - 将发布文件夹中的文件发到测试服务器
    'do_upload': function (done) {
        var prjName = params.prjName,
            distDir = params.distDir,

            alOpt = params.alOpt,
            pageDir = alOpt.pageDir,
            staticDir = alOpt.staticDir,

            upOpt = params.upOpt,

            uploadAll = upOpt.uploadAll,
            uploadPage = upOpt.page,
            uploadForm = upOpt.form,

            uploadCallback = config.uploadCallback,
            concurrentLimit = config.concurrentLimit | 0;

        if (typeof uploadCallback === 'string') {
            uploadCallback = new Function('return ' + uploadCallback)();
        }

        if (concurrentLimit < 1) {
            concurrentLimit = Infinity;
        }

        var uploader = new FileUploader({
            projectName: prjName,
            pageDir: alOpt.allot ? _path.resolve(distDir, pageDir) : distDir,
            staticDir: alOpt.allot ? _path.resolve(distDir, staticDir) : distDir,
            uploadAll: uploadAll,
            uploadPage: uploadPage,
            uploadForm: uploadForm,
            concurrentLimit: concurrentLimit
        });

        var timer = new Timer();
        console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_upload 任务开始……');

        gulp.src(_path.resolve(distDir, '**/*'))
            .pipe(plumber({
                'errorHandler': getTaskErrorHander('do_upload')
            }))
            .pipe(uploader.appendFile())
            .on('end', function () {
                var logId = console.genUniqueId && console.genUniqueId();
                uploader.start(function onProgress(err, filePath, response, results) {
                    // 完成一个文件时
                    var sof = !err && uploadCallback(response),

                    //relativePath = _path.relative(distDir, filePath),
                        succeedCount = results.succeed.length + sof,
                        failedCount = results.failed.length + !sof,
                        queueCount = results.queue.length;
                    logId && console.useId && console.useId(logId);
                    console.log(Utils.formatTime('[HH:mm:ss.fff]'), 'do_upload 任务进度：' +
                        queueCount + '/' + succeedCount + '/' + failedCount);
                    //console.log('服务器回复：', response);
                    return sof;
                }, function onComplete(results) {
                    // 完成所有文件时
                    var succeedCount = results.succeed.length,
                        failedCount = results.failed.length,
                        queueCount = results.queue.length,
                        unchangedCount = results.unchanged.length,
                        totalCount = results.totalCount,
                        resText = '，上传' + queueCount + '个文件，成功' + succeedCount + '个' +
                            (failedCount ? '，失败' + failedCount + '个' : '') +
                            '。总共' + totalCount + '个文件' +
                            (unchangedCount ? '，其中' + unchangedCount + '个无变更。' : '。');
                    logId && console.useId && console.useId(logId);
                    console.info(Utils.formatTime('[HH:mm:ss.fff]'), 'do_upload 任务结束' + resText + '（' + timer.getTime() + 'ms）');
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
