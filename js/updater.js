/**
 * Created by krimeshu on 2016/5/11.
 */

var _fs = require('fs'),
    _path = require('path'),
    _request = require('request'),
    _progress = require('request-progress'),

    Utils = require('./utils.js'),
    Logger = require('./logger.js');

var VERSION_LIST_URL = 'https://github.com/Moonshell/front-custos-gui/raw/master/version-list.json';

var Updater = {
    checkForUpdate: function () {
        var self = this;
        self.downVerList(function () {
            self.checkVerPatch(function (patch) {
                if (patch) {
                    Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '发现可用更新补丁：', patch);
                    self.downPatch(patch, function (err) {

                    });
                } else {
                    Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '恭喜，您的版本暂时不需要更新~');
                }
            });
        });
    },
    checkVerPatch: function (callback) {
        var versionListPath = _path.resolve(updaterDir, 'version-list.json'),
            currentVersion = appPackageFile.version;
        try {
            var str = _fs.readFileSync(versionListPath, 'utf-8'),
                list = JSON.parse(str),
                curPatch = null;
            list.forEach(function (patch) {
                if (patch.from === currentVersion) {
                    curPatch = patch;
                }
            });
            callback && callback(curPatch);
        } catch (e) {
            var err = new Error('检查匹配的更新版本时出现异常：');
            err.detail = e;
            Logger.error(err);
        }
    },
    downVerList: function (callback) {
        var updaterDir = Utils.configDir('./fc-update');
        this._download('版本列表', VERSION_LIST_URL, updaterDir, callback);
    },
    downPatch: function (patch, callback) {
        var patchDir = _path.resolve(__dirname, '..');
        this._download('补丁文件', patch.url, patchDir, callback);
    },
    _download: function (name, url, saveDirPath, callback) {
        var baseName = String(url.split('/').pop()).split(/\?#/g)[0],
            savePath = _path.resolve(saveDirPath, baseName);
        Utils.makeSureDir(saveDirPath);

        var logId = Logger.genUniqueId();
        Logger.log('<hr/>');
        Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '开始加载' + name + '...');
        _progress(_request(url), {
            throttle: 100,
            delay: 0
        }).on('progress', function (state) {
            var progressText = [
                name + '加载中：',
                (state['percentage'] * 100).toFixed(2) + '%（',
                Utils.formatSize(state.size['transferred']),
                '/',
                Utils.formatSize(state.size['total']),
                '），速度：',
                Utils.formatSize(state.speed),
                '/s，时间：',
                state.time['elapsed'],
                's，预计剩余：',
                state.time['remaining'],
                's...'
            ];
            Logger.useId(logId);
            Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), progressText.join(''));
        }).on('error', function (e) {
            var err = new Error(name + '下载异常：');
            err.detail = e;
            Logger.error(err);
        }).on('end', function () {
            Logger.useId(logId);
            Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), name + '加载完毕。');
            callback && callback();
        }).pipe(_fs.createWriteStream(savePath));
    }
};

module.exports = Updater;