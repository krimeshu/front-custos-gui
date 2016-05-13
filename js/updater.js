/**
 * Created by krimeshu on 2016/5/11.
 */

var Utils = require('./utils.js'),
    Logger = require('./logger.js'),

    PatchManager = require('./patch-manager.js');

var Updater = {
    checkForUpdate: function () {
        // PatchManager.downVerList(function () {
        //     PatchManager.checkVerPatch(function (patch) {
        //         if (patch) {
        //             Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '发现可用更新补丁：', patch);
        //             PatchManager.downPatch(patch, function (err) {
        //                 if (err) {
        //                     return;
        //                 }
        //                 PatchManager.checkLocalPatch(function (patch) {
        //                     if (!patch) {
        //                         return;
        //                     }
        //                     PatchManager.extractPatch(patch.path, function () {
        //
        //                     });
        //                 });
        //             });
        //         } else {
        //             Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), '恭喜，您的版本暂时不需要更新~');
        //         }
        //     });
        // });
        Logger.log('<hr/>');
        PatchManager.downVerList()
            .then(function () {
                return PatchManager.checkVerPatch();
            })
            .then(function (patch) {
                return PatchManager.downPatch(patch);
            })
            .then(function () {
                return PatchManager.checkLocalPatch();
            })
            .then(function (patch) {
                return PatchManager.extractPatch(patch.path)
            })
            .then(function () {
                Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '更新完毕，更新功能将在重启后生效。');
            })
            .catch(updateFailed);
        function updateFailed(errOrMsg) {
            var isError = errOrMsg instanceof Error;
            if (isError) {
                Logger.info(Utils.formatTime('[HH:mm:ss.fff]'), '更新失败：', errOrMsg);
            } else {
                Logger.log(Utils.formatTime('[HH:mm:ss.fff]'), errOrMsg);
            }
        }
    }
};

module.exports = Updater;