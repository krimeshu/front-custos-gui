/**
 * Created by krimeshu on 2016/3/13.
 */

module.exports = {
    logList: document.querySelector('.log-box .log-list'),
    nextId: null,
    clear: function () {
        var logList = this.logList;
        logList.html();
    },
    useId: function (id) {
        this.nextId = id;
        return this;
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
    genUniqueId: function () {
        var id = this._generateId();
        while (document.getElementById(id)) {
            id = this._generateId();
        }
        return id;
    },
    _generateId: function () {
        return '_log_text_' + new Date().getTime() + Math.random();
    },
    _append: function (item) {
        var logList = this.logList,
            nextId = this.nextId || '',
            existed = nextId && document.getElementById(nextId);
        this.nextId = null;
        var li = existed || document.createElement('li');
        li.innerHTML = item.text;
        li.className = item.type;
        if (!existed) {
            li.id = nextId;
            logList.appendChild(li);
            li.scrollIntoView();
        }
    },
    _format: function (args) {
        var formatStr = args[0];
        if (typeof(formatStr) !== 'string') {
            formatStr = JSON.stringify(formatStr);
        }
        var res = [];
        var formats = formatStr.split('%');
        res.push(formats[0]);
        var offset = 1,
            type,
            arg;
        if (formats.length > 1) {
            for (var i = offset, f; f = formats[i]; i++, offset++) {
                type = f[0];
                arg = args[offset];
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
                            res.push(parseString(arg));
                        } catch (ex) {
                            res.push('');
                        }
                        break;
                    case 'O':
                    case 'o':
                        try {
                            res.push(parseString(arg));
                        } catch (ex) {
                            res.push('');
                        }
                        break;
                }
                res.push(f.substr(1));
            }
        }
        for (var len = args.length, restArg; offset < len; offset++) {
            restArg = args[offset];
            res.push(' ');
            res.push(parseString(restArg));
        }
        res = '<span>' + res.join('') + '</span>';
        res = res.replace(/\n/g, '<br/>');
        return res;
    }
};

// var JSONFormatter = require('json-formatter-js/src/index.js');

var parseString = function (arg) {
    var type = typeof(arg);
    switch (type) {
        case 'string':
            return arg;
        case 'object':
            var id = module.exports.genUniqueId();
            window.setTimeout(function () {
                var formatter = new JSONFormatter(arg, 0);
                document.getElementById(id).appendChild(formatter.render());
            }, 0);
            return '<em id="' + id + '" class="json-holder"></em>';
        default:
            return String(arg);
    }
};

// ----------------------------------------

var console = module.exports,
    FooCalendar = require('./foo-calendar.js');

console.info('[程序员老黄历]');
console.log(FooCalendar.date);
FooCalendar.good.forEach(function (event, index) {
    console.warn('%s%c | %s %c<small>%s</small>', index === 0 ? '宜' : '&nbsp;&nbsp;', 'color: white;', event.name, 'color: gray;', event.good);
});
FooCalendar.bad.forEach(function (event, index) {
    console.warn('%s%c | %s %c<small>%s</small>', index === 0 ? '忌' : '&nbsp;&nbsp;', 'color: white;', event.name, 'color: gray;', event.bad);
});
console.warn('座位朝向：%c面向<ins>%s</ins>写代码，BUG最少', 'color: white;', FooCalendar.direction);
console.warn('今日宜饮：%c%s', 'color: white;', FooCalendar.drink.join('，'));
console.warn('女神亲近指数：%c%s', 'color: white;', FooCalendar.goddes);

