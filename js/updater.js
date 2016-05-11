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

var updaterDir = Utils.configDir('./fc-update');
Utils.makeSureDir(updaterDir);

var Updater = {
    checkForUpdate: function () {
        var self = this;
        self.downVerList(function () {
            self.checkVerPatch(function (patch) {
                if (patch) {
                    Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '发现可用更新补丁：', patch);
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
        var versionListPath = _path.resolve(updaterDir, 'version-list.json'),
            logId = Logger.genUniqueId();
        Logger.log('<hr/>');
        Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '开始加载版本列表文件...');
        _progress(_request(VERSION_LIST_URL), {
            throttle: 100,
            delay: 0
        }).on('progress', function (state) {
            // The state is an object that looks like this:
            // {
            //     percentage: 0.5,            // Overall percentage (between 0 to 1)
            //     speed: 554732,              // The download speed in bytes/sec
            //     size: {
            //         total: 90044871,        // The total payload size in bytes
            //         transferred: 27610959   // The transferred payload size in bytes
            //     },
            //     time: {
            //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
            //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
            //     }
            // }
            var progressText = [
                '版本列表加载中：',
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
            var err = new Error('版本列表文件下载出现异常：');
            err.detail = e;
            Logger.error(err);
        }).on('end', function () {
            Logger.useId(logId);
            Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '版本列表文件加载完毕。');
            callback && callback();
        }).pipe(_fs.createWriteStream(versionListPath));
    }
};

module.exports = Updater;