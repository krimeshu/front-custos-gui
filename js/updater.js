/**
 * Created by krimeshu on 2016/5/11.
 */

var Utils = require('./utils.js'),
    Logger = require('./logger.js'),

    PatchManager = require('./patch-manager.js');

var Updater = {
    checkForUpdate: function (opts) {
        var quiet = opts.quiet,
            autoUpdate = opts.autoUpdate;
        !quiet && Logger.log('<hr/>');
        return PatchManager.downVerList(quiet)
            .then(PatchManager.checkVerPatch.bind(PatchManager))
            .then(function (availPatch) {
                if (!availPatch) return;
                if (autoUpdate) {
                    return Updater.doUpdate(availPatch);
                } else {
                    Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '检测到可更新版本，<a id="btn_uploadNow">立即更新</a>。');
                    document.addEventListener('click', function (e) {
                        if (e.target.id != 'btn_uploadNow') return;
                        Updater.doUpdate(availPatch);
                    });
                }
            })
            .catch(function (errOrMsg) {
                var isError = errOrMsg instanceof Error;
                if (isError) {
                    Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '更新检测失败：', errOrMsg);
                } else {
                    !quiet && Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), errOrMsg);
                }
            });
    },
    doUpdate: function (availPatch) {
        return PatchManager.downPatch(availPatch)
            .then(PatchManager.checkLocalPatch.bind(PatchManager))
            .then(PatchManager.extractPatch.bind(PatchManager))
            .then(function () {
                Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '更新完毕，更新功能将在重启后生效。<a href="javascript:window.location.reload();">立即重启</a>');
            })
            .catch(function (errOrMsg) {
                var isError = errOrMsg instanceof Error;
                if (isError) {
                    Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '更新失败：', errOrMsg);
                } else {
                    Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), errOrMsg);
                }
            });
    }
};

module.exports = Updater;