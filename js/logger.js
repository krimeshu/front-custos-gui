/**
 * Created by krimeshu on 2016/3/13.
 */
const remote = require('electron').remote;

var console = {
    _logList: null,
    _jsonViewer: null,
    _pluginMenuItems: [],
    _menu: null,
    nextId: null,
    clear: function () {
        var logList = this._logList;
        logList.innerHTML = '';
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
        var logList = this._logList,
            nextId = this.nextId || '',
            existed = nextId && document.getElementById(nextId);
        this.nextId = null;
        var li = existed || document.createElement('li');
        li.innerHTML = item.text;
        li.className = item.type;
        if (!existed) {
            li.id = nextId;
            logList.appendChild(li);
            window.setTimeout(function () {
                li.scrollIntoView();
                li = null;
            }, 10);
        }
    },
    _format: function (args) {
        var formatStr = args[0];
        if (typeof (formatStr) !== 'string') {
            formatStr = this._stringify(formatStr);
        }
        var res = [];
        var formats = formatStr.split('%');
        res.push(formats[0]);
        var offset = 1,
            type,
            arg;
        if (formats.length > 1) {
            for (var i = offset, f; f = formats[i]; i++ , offset++) {
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
                            res.push(this._stringify(arg));
                        } catch (ex) {
                            res.push('');
                        }
                        break;
                    case 'O':
                    case 'o':
                        try {
                            res.push(this._stringify(arg));
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
            res.push(this._stringify(restArg));
        }
        res = '<span>' + res.join('') + '</span>';
        res = res.replace(/\n/g, '<br/>');
        return res;
    },
    _stringify: function (arg) {
        var type = typeof (arg),
            jsonViewer = this._jsonViewer;
        switch (type) {
            case 'string':
                return arg;
            case 'object':
                return jsonViewer.toJSON(arg);
            default:
                return String(arg);
        }
    },
    _showCalendar: function () {
        var FooCalendar = require('./foo-calendar.js'),
            res = FooCalendar.runIt();

        console.info('[程序员老黄历]');
        console.log(res.date);
        res.good.forEach(function (event, index) {
            console.warn('%s%c | %s %c<small>%s</small>', index === 0 ? '宜' : '　', 'color: white;', event.name, 'color: gray;', event.good);
        });
        res.bad.forEach(function (event, index) {
            console.warn('%s%c | %s %c<small>%s</small>', index === 0 ? '忌' : '　', 'color: white;', event.name, 'color: gray;', event.bad);
        });
        console.warn('座位朝向：%c面向<ins>%s</ins>写代码，BUG最少', 'color: white;', res.direction);
        console.warn('今日宜饮：%c%s', 'color: white;', res.drink.join('，'));
        console.warn('女神亲近指数：%c%s', 'color: white;', res.goddes);
    },
    _init: function () {
        let $box = $('.log-box'),
            $list = $box.find('.log-list');

        this._logList = $list[0];
        // JSON 展示
        this._jsonViewer = new JSONViewer({
            eventHandler: $list[0],
            indentSize: 16,
            expand: 1,
            theme: 'dark'
        });

        // 右键菜单
        this._generateMenu();
        $box.on('contextmenu', (ev) => {
            this._menu.popup(remote.getCurrentWindow())
        });
        this._showCalendar();
    },
    _generateMenu: function () {
        const Menu = remote.Menu;
        let template = [];
        template.push({
            label: '查看日历',
            click: () => {
                this.log('<hr/>');
                this._showCalendar();
            }
        });
        let pluginMenuItems = this._pluginMenuItems;
        if (pluginMenuItems.length) {
            template.push({type: 'separator'});
            template = template.concat(pluginMenuItems);
        }
        template.push({type: 'separator'});
        template.push({
            label: '清空',
            click: () => {
                this.clear();
            }
        });
        this._menu = Menu.buildFromTemplate(template);
    },
    registerMenuItem: function (label, click) {
        this._pluginMenuItems.push({label, click});
        this._generateMenu();
    }
};

console._init();

module.exports = console;


