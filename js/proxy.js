require('request');

process.env.http_proxy = "http://proxy.tencent.com:8080";
process.env.https_proxy = "https://proxy.tencent.com:8080";

var http = require('http');
var https = require('https');
var HttpsProxyAgent = require('https-proxy-agent');

function monkeyPatch(_module, functionName, newFunction) {
    _module[functionName] = newFunction.bind(undefined, _module[functionName]);
}

monkeyPatch(http, "request", function (originalRequest, options, callback) {
    // the change to options propagates to the caller, but it doesn't matter
    var httpProxy = process.env.http_proxy;
    if (!options.agent && httpProxy) {
        console.log("Using HTTP proxy: " + httpProxy);

        options.agent = new HttpsProxyAgent(httpProxy);
    }
    return originalRequest(options, callback);
});

monkeyPatch(https, "request", function (originalRequest, options, callback) {
    // the change to options propagates to the caller, but it doesn't matter
    var httpsProxy = process.env.https_proxy;
    if (!options.agent && httpsProxy) {
        console.log("Using HTTPS proxy: " + httpsProxy);

        options.agent = new HttpsProxyAgent(httpsProxy);
    }
    return originalRequest(options, callback);
});

