/**
 * Created by krimeshu on 2016/5/11.
 */

var _fs = require('fs'),
    _path = require('path'),
    _request = require('request'),
    _progress = require('request-progress'),

    _childProcess = require('child_process');

var Utils = require('./utils.js'),
    Logger = require('./logger.js');

var VERSION_LIST_URL = 'https://github.com/Moonshell/front-custos-gui/raw/master/version-list.json';

module.exports = {
    // 获取本地已有的补丁包列表
    getLocalPatches: function () {
        var dirPath = _path.resolve(__dirname, '../'),
            children = _fs.readdirSync(dirPath),
            patches = [];
        children.forEach(function (child) {
            var ms = /^patch_([0-9\.]+)_([0-9\.]+)\.7z/i.exec(child);
            if (!ms) {
                return;
            }
            var fromVersion = ms[1],
                toVersion = ms[2],
                childPath = _path.resolve(dirPath, child),
                childStat = _fs.statSync(childPath);
            if (childStat.isDirectory()) {
                return;
            }
            patches.push({
                from: fromVersion,
                to: toVersion,
                path: childPath
            });
        });
        return patches;
    },
    // 检查是否有可用的本地补丁包
    checkLocalPatch: function () {
        return new Promise((resolve, reject)=> {
            var patches = this.getLocalPatches(),
                currentVersion = appPackageFile.version,
                currentPatch = null;
            if (!patches || !patches.length) {
                reject(new Error('未找到可用的本地补丁包。'));
                return;
            }
            patches.forEach(function (patch) {
                if (patch.from === currentVersion) {
                    currentPatch = patch;
                }
            });
            resolve(currentPatch);
        });
    },
    // 解压补丁包
    extractPatch: function (patch) {
        return new Promise((resolve, reject)=> {
            var appRootPath = _path.resolve('./'),
                dirPath = _path.resolve(__dirname, '../'),
                _7zPath = _path.relative(appRootPath, _path.resolve(dirPath, '7z')),
                patchPath = patch.path,
                args = ['x', _path.relative(appRootPath, patchPath), '-y'],
                cp = _childProcess.spawn(_7zPath, args, {
                    cwd: appRootPath
                }),
                console = Logger;
            console.info(appRootPath);
            console.log('%c$ %c' + _7zPath + ' ' + args.join(' '), 'color: #7c7c7c;', 'color: white;');
            cp.stdout.on('data', function (data) {
                console.log(String(data));
            });
            cp.stderr.on('data', function (data) {
                console.error(String(data));
            });
            cp.on('exit', function (code) {
                console.log('7z child process exited with code ' + code);
                if (code === 0) {
                    _fs.unlink(patchPath);
                    resolve();
                } else {
                    reject(new Error('补丁包解压异常，状态码：' + code));
                }
            });
        });
    },
    // 下载在线版本列表
    downVerList: function () {
        return new Promise((resolve)=> {
            var updaterDir = Utils.configDir('./fc-update');
            this._download('版本列表', VERSION_LIST_URL, updaterDir, ()=> {
                resolve();
            });
        });
    },
    // 检查在线版本列表中是否有可用补丁
    checkVerPatch: function () {
        return new Promise((resolve, reject)=> {
            var updaterDir = Utils.configDir('./fc-update'),
                versionListPath = _path.resolve(updaterDir, 'version-list.json'),
                currentVersion = appPackageFile.version;
            try {
                var str = _fs.readFileSync(versionListPath, 'utf-8'),
                    verList = JSON.parse(str),
                    latest = verList['latest'],
                    patches = verList['patches'],
                    curPatch = null;
                patches.forEach(function (patch) {
                    if (patch.from === currentVersion) {
                        curPatch = patch;
                    }
                });
                if (curPatch) {
                    resolve(curPatch);
                } else {
                    if (this._compareVer(currentVersion, latest.version) >= 0) {
                        reject('恭喜，您已经是最新版本了！');
                    } else {
                        reject('抱歉，您的版本太旧，未找到匹配补丁，请直接下载程序本体包：' +
                            '<a href="javascript: windowCtrl.openExternal(\'' + latest.url + '\');">点击访问下载页</a>');
                    }
                }
            } catch (e) {
                var err = new Error('检查匹配的更新版本时出现异常：');
                err.detail = e;
                reject(err);
            }
        });
    },
    // 下载补丁
    downPatch: function (patch) {
        return new Promise((resolve)=> {
            var patchDir = _path.resolve(__dirname, '..');
            this._download('补丁文件', patch.url, patchDir, ()=> {
                resolve();
            });
        });
    },
    // 下载文件并进度提示
    _download: function (name, url, saveDirPath, callback) {
        var baseName = String(url.split('/').pop()).split(/\?#/g)[0],
            savePath = _path.resolve(saveDirPath, baseName);
        Utils.makeSureDir(saveDirPath);

        var logId = Logger.genUniqueId();
        Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '开始下载' + name + '……');
        _progress(_request(url), {
            throttle: 100,
            delay: 0
        }).on('progress', function (state) {
            var progressText = [
                name + '下载中：',
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
                's。'
            ];
            Logger.useId(logId);
            Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), progressText.join(''));
        }).on('error', function (e) {
            var err = new Error(name + '下载异常：');
            err.detail = e;
            Logger.error(err);
        }).on('end', function () {
            Logger.useId(logId);
            Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), name + '下载完毕。');
            callback && callback();
        }).pipe(_fs.createWriteStream(savePath));
    },
    // 版本比较
    _compareVer: function (ver1, ver2) {
        var ver1Arr = ver1.split('.'),
            ver2Arr = ver2.split('.'),
            pos = 0,
            len = Math.max(ver1Arr.length, ver2Arr.length),
            sub;
        while (pos < len && !(sub = ver1Arr[pos] - ver2Arr[pos])) {
            pos++;
        }
        return Number(sub + new Array(len - pos).join('0'));
    }
};