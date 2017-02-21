var fs = require('fs'),
    path = require('path'),
    process = require('process'),

    gulp = require('gulp'),
    copyDir = require('copy-dir'),
    del = require('del'),
    electronPackage = require('electron/package.json'),
    rebuild = require('electron-rebuild').default;

// pull the electron version from the package.json file
var electronVersion = electronPackage.version;

gulp.task('rebuild', function (done) {
    var arch = process.arch;
    console.log('Rebuilding...');
    var nodeSassDir = path.resolve('./node_modules/node-sass'),
        binDir = path.resolve(nodeSassDir, 'bin'),
        buildDir = path.resolve(nodeSassDir, 'build'),
        vendorDir = path.resolve(nodeSassDir, 'vendor');
    rebuild(__dirname, electronVersion, arch, ['node-sass'], true)
        .then(function () {
            console.log('Rebuild successful!');
            return true;
        })
        .then(function () {
            console.log('Copying node-sass rebuilt to vendor dir...');
            fs.readdirSync(binDir).forEach(function (fileName) {
                console.log(fileName);
                var filePath = path.resolve(binDir, fileName);
                if (!fs.statSync(filePath).isDirectory()) {
                    return;
                }
                var nodeFilePath = path.resolve(filePath, 'node-sass.node');
                if (!fs.existsSync(nodeFilePath)) {
                    return;
                }
                fs.renameSync(nodeFilePath, path.resolve(filePath, 'binding.node'));
            });
            copyDir.sync(
                binDir,
                vendorDir
            );
            console.log('Copy finished.');
        })
        .then(function () {
            console.log('Cleaning build directory...');
            del([buildDir]).then(function () {
                console.log('Clean build directory finished.');
                done();
            });
        })
        .catch(function (e) {
            console.error('Rebuilding modules against Electron didn\'t work: ' + e);
        });
});