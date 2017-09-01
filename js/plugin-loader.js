var fs = require('fs');
var path = require('path');

module.exports = {
    console: console,
    loadPlugins: function () {
        var self = this;
        var homeDir = process.env.HOME || process.env.USERPROFILE || '~';
        var pluginDir = homeDir + '/FrontCustos/fc-plugin';
        if (!fs.existsSync(pluginDir)) {
            return;
        }
        fs.readdirSync(pluginDir).forEach(function (childName) {
            var childPath = path.join(pluginDir, childName);
            if (fs.statSync(childPath).isDirectory()) {
                // 目录的情况下，寻找目录内的 main.js
                childPath = path.join(childPath, '/main.js');
                if (fs.existsSync(childPath)) {
                    self.execPlugin(childName, childPath);
                }
            } else if (/\.js$/.test(childPath)) {
                self.execPlugin(childName, childPath);
            }
        });
    },
    execPlugin: function (pluginName, pluginPath) {
        try {
            var pluginScript = fs.readFileSync(pluginPath);
            var wrapper = new Function('console', 'require', 'return function () {\n' + pluginScript + '\n};');
            var invoker = wrapper(this.console, require);
            invoker();
        } catch (ex) {
            this.console.error('插件 [' + pluginName + '] 执行异常：', ex);
        }
    }
};