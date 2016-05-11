const mainWindow = require('electron').remote.getCurrentWindow();

exports.setProxy = function (proxyRule) {
    let ses = mainWindow.webContents.session;
    ses.setProxy({
        pacScript: '',
        proxyRules: proxyRule
    }, function () {
        console.log('proxy used.');
    });
};
