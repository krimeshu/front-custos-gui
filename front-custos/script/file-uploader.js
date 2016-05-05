/**
 * Created by krimeshu on 2016/3/1.
 */

var _os = require('os'),
    _fs = require('fs'),
    _path = require('path'),

    Through2 = require('through2'),
    Request = require('request'),

    Utils = require('./utils.js'),
    DependencyInjector = require('./dependency-injector.js');

var FileUploader = function (opts, onError) {
    var self = this,
        console = opts.console,
        forInjector = Utils.deepCopy(opts.forInjector),
        uploadAll = opts.uploadAll,
        uploadPage = opts.uploadPage,
        uploadForm = opts.uploadForm,
        uploadJudge = opts.uploadJudge,
        concurrentLimit = opts.concurrentLimit || 1;

    forInjector.console = console;
    self.forInjector = forInjector;
    self.uploadQueue = [];
    self.uploadAll = uploadAll;
    self.uploadPage = uploadPage;
    self.uploadForm = uploadForm;
    self.uploadJudge = uploadJudge;
    self.concurrentLimit = concurrentLimit;
    self.concurrentCount = 0;

    self.onError = onError;

    self._loadHistory();
};

FileUploader.prototype = {
    _getHistoryFilePath: function () {
        var self = this,
            forInjector = self.forInjector,
            projDir = forInjector.projDir,
            fileDir = Utils.configDir('./fc-upload-history'),
            fileName = Utils.md5(projDir);
        Utils.makeSureDir(fileDir);
        return _path.resolve(fileDir, fileName + '.json');
    },
    _loadHistory: function () {
        var self = this,
            forInjector = self.forInjector,
            projDir = forInjector.projDir,
            filePath = self._getHistoryFilePath(),
            history = {
                projDir: projDir,
                data: {}
            };
        try {
            var fileContent = _fs.existsSync(filePath) ?
                _fs.readFileSync(filePath).toString() :
                JSON.stringify(history);
            history = JSON.parse(fileContent);
        } catch (e) {
            console.log('FileUploader - 解析上传历史文件时出现异常：\n', e);
        }
        self._history = history;
    },
    _saveHistory: function () {
        var self = this,
            filePath = self._getHistoryFilePath(),
            history = self._history;
        try {
            var fileContent = JSON.stringify(history);
            _fs.writeFileSync(filePath, fileContent)
        } catch (e) {
            console.log('FileUploader - 保存上传历史文件时出现异常。\n', e);
        }
    },
    _isFileUnchanged: function (filePath) {
        var self = this,
            history = self._history || {},
            data = history.data,
            currentHash = Utils.md5(filePath, true),
            historyHash = data[filePath];
        return currentHash === historyHash;
    },
    _updateFileHash: function (filePath) {
        var self = this,
            history = self._history || {},
            data = history.data,
            currentHash = Utils.md5(filePath, true);
        data[filePath] = currentHash;
        self._saveHistory();
    },
    appendFile: function () {
        var self = this;

        self.uploadQueue = [];
        return Through2.obj(function (file, enc, cb) {
            //console.log('FileUploader - appendFile: ', file.path);
            if (!file.isDirectory()) {
                self.uploadQueue.push(file.path);
            }

            this.push(file);

            cb();
        }).resume();
    },
    start: function (onProgress, onComplete) {
        var self = this,
            forInjector = self.forInjector,
            uploadAll = self.uploadAll,
            uploadForm = self.uploadForm,
            uploadJudge = self.uploadJudge,
            uploadQueue = self.uploadQueue,

            onError = self.onError;

        uploadForm = Utils.tryParseFunction(uploadForm);
        uploadJudge = Utils.tryParseFunction(uploadJudge);

        var results = self.uploadResult = {
            succeed: [],
            failed: [],
            unchanged: [],
            totalCount: uploadQueue.length
        };

        if (!uploadAll) {
            uploadQueue.forEach(function (filePath) {
                if (self._isFileUnchanged(filePath)) {
                    results.unchanged.push(filePath);
                }
            });
            results.unchanged.forEach(function (filePath) {
                var pos = uploadQueue.indexOf(filePath);
                uploadQueue.splice(pos, 1);
            });
        }

        results.queue = uploadQueue;

        var injector = new DependencyInjector(forInjector);
        injector.registerMap({
            uploadQueue: uploadQueue,
            results: results
        });

        if (uploadQueue.length <= 0) {
            onComplete && injector.invoke(onComplete);
        } else {
            uploadQueue.forEach(function (filePath) {
                var results = self.uploadResult,
                    uploadPage = self.uploadPage,
                    forInjector = self.forInjector,
                    distDir = forInjector.distDir;

                var fileStream = _fs.createReadStream(filePath);

                var formMap = null,
                    formPreview = {},
                    sp = (uploadPage && uploadPage.indexOf('?') < 0 ? '?' : '&');

                var _upload = function (done) {

                    if (!uploadPage) {
                        _onFailed(new Error('未指定上传页面地址'), undefined, done);
                        return;
                    }
                    
                    uploadPage += sp + 't=' + new Date().getTime();
                    injector.registerMap(forInjector);
                    injector.registerMap({
                        filePath: filePath,
                        fileStream: fileStream
                    });

                    var err = null;
                    try {
                        formMap = uploadForm && injector.invoke(uploadForm);
                    } catch (e) {
                        err = new Error('表单脚本执行失败');
                        err.detailError = e;
                        _onFailed(err, undefined, done);
                        return;
                    }
                    if (!formMap) {
                        _onFailed(new Error('未指定表单内容'), undefined, done);
                        return;
                    }

                    var key, value, type;
                    for (key in formMap) {
                        if (formMap.hasOwnProperty(key)) {
                            value = formMap[key];
                            type = typeof (value);
                            if (type !== 'object' && type !== 'function') {
                                formPreview[key] = value;
                            }
                        }
                    }

                    var request = Request({
                        url: uploadPage,
                        method: 'POST',
                        timeout: 10000,
                        headers: {
                            connection: 'keep-alive'
                        }
                    }, function (err, msg, response) {
                        injector.registerMap({
                            filePath: filePath,
                            fileStream: fileStream,
                            response: response
                        });
                        var judgeResult = false;
                        try {
                            judgeResult = (!uploadJudge || injector.invoke(uploadJudge));
                        } catch (e) {
                            err = new Error('上传结果判断脚本执行异常');
                            err.detailError = e;
                        }
                        if (!err && judgeResult) {
                            _onSucceed(response, done);
                        } else {
                            _onFailed(err, response, done);
                        }
                        try {
                            onProgress && injector.invoke(onProgress);
                        } catch (e) {
                            var ex = new Error('上传进度脚本执行异常');
                            ex.detailError = e;
                            onError && onError(ex);
                        }
                    });
                    var form = request.form();
                    for (key in formMap) {
                        if (formMap.hasOwnProperty(key)) {
                            value = formMap[key];
                            form.append(key, value);
                        }
                    }
                    try {
                        onProgress && injector.invoke(onProgress);
                    } catch (e) {
                        var ex = new Error('上传进度脚本执行异常');
                        ex.detailError = e;
                        onError && onError(ex);
                    }
                }, _onSucceed = function (response, done) {
                    self._updateFileHash(filePath);
                    formPreview.file = _path.relative(distDir, filePath);
                    response !== undefined && (formPreview.response = response);
                    results.succeed.push(formPreview);
                    _checkNext(done);
                }, _onFailed = function (err, response, done) {
                    err !== undefined && (formPreview.error = err);
                    formPreview.file = _path.relative(distDir, filePath);
                    response !== undefined && (formPreview.response = response);
                    results.failed.push(formPreview);
                    _checkNext(done);
                }, _checkNext = function (done) {
                    fileStream.close();
                    if (results.succeed.length + results.failed.length >= results.queue.length) {
                        try {
                            onComplete && injector.invoke(onComplete);
                        } catch (e) {
                            var ex = new Error('上传完成脚本执行异常');
                            ex.detailError = e;
                            onError && onError(ex);
                        }
                    }
                    done();
                };

                self.doUpload(_upload);
            });
        }
    },
    doUpload: function (_upload) {
        var self = this,
            concurrentLimit = self.concurrentLimit,
            concurrentCount = self.concurrentCount;
        if (concurrentCount < concurrentLimit) {
            self.concurrentCount++;
            _upload(function () {
                self.concurrentCount--;
            });
        } else {
            setTimeout(function () {
                self.doUpload(_upload);
            }, 200);
        }
    }
};

module.exports = FileUploader;
