/**
 * Created by krimeshu on 2016/5/11.
 */

var fs = require('fs'),
    path = require('path'),
    childProcess = require('child_process');

module.exports = {
    getPatches: function () {
        var dirPath = path.resolve(__dirname, '../'),
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
    wrapCallback: function (callback, context) {
        return function () {
            typeof callback === 'function' && callback.apply(context, arguments || []);
        }
    },
    checkLocalPatch: function (callback) {
        var applyCallback = this.wrapCallback(callback, this);
        var patches = this.getPatches();
        if (!patches || !patches.length) {
            applyCallback(0);
        }
        var currentVersion = appPackageFile.version,
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
        var applyCallback = this.wrapCallback(callback, this);
        var cp = childProcess.spawn('7z', ['e', patchPath, '-y']);
        cp.stdout.on('data', function (data) {
            // console.log(String(data));
        });
        cp.stderr.on('data', function (data) {
            // console.error(String(data));
        });
        cp.on('exit', function (code) {
            // console.log('7z child process exited with code ' + code);
            if (code === 0) {
                fs.unlink(patchPath);
            }
            applyCallback(code);
        });
    }
};