/**
 * Created by krimeshu on 2016/3/13.
 */

module.exports = {
    logList: document.querySelector('.log-box .log-list'),
    clear: function () {
        var logList = this.logList;
        logList.html();
    },
    log: function () {
        var text = this._format(arguments);
        this._append({
            text: text,
            type: 'literal'
        });
    },
    info: function () {
        var text = this._format(arguments);
        this._append({
            text: text,
            type: 'info'
        });
    },
    warn: function () {
        var text = this._format(arguments);
        this._append({
            text: text,
            type: 'warn'
        });
    },
    error: function () {
        var text = this._format(arguments);
        this._append({
            text: text,
            type: 'error'
        });
    },
    _append: function (item) {
        var logList = this.logList;
        var li = document.createElement('li');
        li.innerHTML = item.text;
        li.className = item.type;
        logList.appendChild(li);
        li.scrollIntoView();
    },
    _format: function (args) {
        var formatStr = args[0];
        if (typeof(formatStr) != 'string') {
            formatStr = JSON.stringify(formatStr);
        }
        var res = [];
        var formats = formatStr.split('%');
        res.push(formats[0]);
        var offset = 1;
        if (formats.length > 1) {
            for (var i = offset, f; f = formats[i]; i++, offset++) {
                var type = f[0];
                var arg = args[offset];
                switch (type) {
                    case '%':
                        res.push('%');
                        break;
                    case 'c':
                        res.push('</span><span style="' + arg + '">');
                        break;
                    case 'd':
                    case 'i':
                        try {
                            res.push(String(parseInt(arg)));
                        } catch (ex) {
                            res.push('NaN');
                        }
                        break;
                    case 'f':
                        try {
                            res.push(String(parseFloat(arg)));
                        } catch (ex) {
                            res.push('NaN');
                        }
                        break;
                    case 's':
                        try {
                            res.push(String(arg));
                        } catch (ex) {
                            res.push('');
                        }
                        break;
                    case 'O':
                    case 'o':
                        try {
                            res.push(JSON.stringify(arg));
                        } catch (ex) {
                            res.push('');
                        }
                        break;
                }
                res.push(f.substr(1));
            }
        }
        for (var len = args.length; offset < len; offset++) {
            res.push(' ' + JSON.stringify(args[offset]));
        }
        res = '<span>' + res.join('') + '</span>';
        res = res.replace(/\n/g, '<br/>');
        return res;
    }
};