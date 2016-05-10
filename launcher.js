/**
 * Created by krimeshu on 2016/5/10.
 */

var fs = require('fs'),
    path = require('path');

var LaunchState = {
    start: function () {
        require('./main');
    },
    getPatches: function () {
        var dirPath = __dirname,
            children = fs.readdirSync(dirPath),
            patches = [];
        children.forEach(function (child) {
            var ms = /^patch_([\n\.]+)_([\n\.]+)\.zip$/i.exec(child);
            if (!ms) {
                return;
            }
            var fromVersion = ms[1],
                toVersion = ms[2],
                childPath = path.resolve(dirPath, child),
                childStat = fs.statSync(childPath);
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
    checkForPatch: function (callback) {
        var patches = this.getPatches();
        var applyCallback = (function (context) {
            return function () {
                typeof callback === 'function' && callback.apply(context, arguments || []);
            }
        })(this);
        if (!patches || !patches.length) {
            applyCallback(0);
        }
        var packageFile = require('./package.json'),
            currentVersion = packageFile.version,
            currentPatch = null;
        patches.forEach(function (patch) {
            if (patch.from === currentVersion) {
                currentPatch = patch;
            }
        });
        if (!currentPatch) {
            applyCallback(-1);
        } else {
            this.extractPatch(currentPatch.path, function () {
                applyCallback(1);
            });
        }
    },
    extractPatch: function (patchPath, callback) {
        var applyCallback = (function (context) {
            return function () {
                typeof callback === 'function' && callback.apply(context, arguments || []);
            }
        })(this);
        // Todo: 解压补丁包
        applyCallback();
    }
};

LaunchState.checkForPatch(function () {
    this.start();
});
