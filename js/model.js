/**
 * Created by krimeshu on 2016/3/12.
 */

var _fs = require('fs');

var Data = require('./data.js'),
    Logger = require('./logger.js'),
    Utils = require('./utils.js'),

    TaskList = require('../front-custos/script/task-list.js');

var lockedTasks = ['prepare_build', 'do_dist'],
    disabledTasks = ['do_upload'];

TaskList.forEach((task) => {
    if (lockedTasks.indexOf(task.name) >= 0) {
        task.locked = true;
    }
    if (disabledTasks.indexOf(task.name) >= 0) {
        task.disabled = true;
    }
});

var _this = module.exports = {
    allTasks: TaskList,
    _DEFAULT_THEME: 'Modern',
    allThemes: {
        'Modern': { primary: 'blue-grey', accent: 'red' },
        'Girl': { primary: 'pink', accent: 'red' },
        // 'Spring': { primary: 'teal', accent: 'green' },
        'Industry': { primary: 'indigo', accent: 'red' },
        'Orange': { primary: 'deep-orange', accent: 'blue' },
        'Coffee': { primary: 'brown', accent: 'deep-orange' },
        'Deep': { primary: 'deep-purple', accent: 'purple' }
    },
    templates: Data.getTemplates(),
    config: Data.loadConfig(),
    projList: Data.loadProjList(),
    curProj: Data.getNewOpt(),
    watchingProjIds: [],
    watchTaskRanges: {
        '': { name: '无限制' },
        'prepare_build': { name: '跳转构建之前' },
        'do_upload': { name: '开始上传之前' }
    },
    getTasksInRange: function (tasks, limit) {
        var pos = tasks.indexOf(limit);
        if (!limit || pos < 0) {
            return tasks.slice(0);
        } else {
            return tasks.slice(0, pos);
        }
    },
    // 更新过期的配置
    _updateOpts: function (opts) {
        // 更新 alOpt
        var alOpt = opts.alOpt;
        if (alOpt.hashLink == true) {
            alOpt.hashLink = 'AS_QUERY_STRING';
        } else if (alOpt.hashLink == false) {
            alOpt.hashLink = 'NO_HASH';
        }
    },
    selectCurProj: function (proj) {
        var opts = this.loadProjOptions(proj),
            id = proj.id,
            projName = proj.projName,
            projDir = proj.projDir;
        this._updateOpts(opts);
        Utils.clearObj(this.curProj);
        Utils.deepCopy(opts, this.curProj);
        Utils.deepCopy(proj, this.curProj);

        Logger.log('<hr/>');
        Logger.info('[时间: %s]', Utils.formatTime('HH:mm:ss.fff yyyy-MM-dd', new Date()));
        Logger.info('切换到项目：%c%s %c(%s)', 'color: white;', projName, 'color: #cccc81;', projDir);

        this.onCurrentChanged();

        // 记录上次操作的 Id
        this.config.lastWorkingId = id;
        Data.saveConfig(this.config);

        window.setTimeout(function () {
            scrollToItem(id);
        }, 100);
    },
    loadProjOptions: function (proj) {
        var projName = proj.projName,
            projDir = proj.projDir,
            pkg = Data.loadProjPackage(projName, projDir),
            opts = pkg.fcOpt || {},
            needsFields = Data.initOpt;
        Utils.fillObj(needsFields, opts);
        opts.version = pkg.version;
        opts.watchToRebuilding = !!pkg.watchToRebuilding;
        return opts;
    },
    getProjById: function (id) {
        var proj = null;
        this.projList && this.projList.forEach &&
            this.projList.forEach(function (_proj) {
                if (_proj.id === id) {
                    proj = _proj;
                }
            });
        return proj;
    },
    removeProjById: function (id, selectNext) {
        try {
            var projList = this.projList,
                proj = this.getProjById(id),
                pos = projList.indexOf(proj);
            if (pos < 0) {
                console.log('Model.removeProjById 异常：没有找到需要移除的项目！');
                return;
            }
            projList.splice(pos, 1);

            Data.saveProjList(projList);
            Utils.deepCopy(Data.getNewOpt(), this.curProj);

            if (selectNext) {
                if (pos >= projList.length - 1) {
                    pos = projList.length - 1;
                }
                if (pos >= 0) {
                    // 同一位置还有项目时，切换到该项目
                    proj = this.projList[pos];
                    this.selectCurProj(proj);
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    },
    updateProj: function (projWithOpts) {
        try {
            var id = projWithOpts.id,
                projName = projWithOpts.projName,
                projDir = projWithOpts.projDir,
                version = projWithOpts.version,
                watchToRebuilding = projWithOpts.watchToRebuilding,
                fcOpt = this.extractFcOpt(projWithOpts);
            this.updatePkg(projName, projDir, version, watchToRebuilding, fcOpt);

            var projList = this.projList,
                justProj = this.getProjById(id);
            justProj.projName = projName;
            justProj.projDir = projDir;
            Data.saveProjList(projList);

            return true;
        } catch (e) {
            return false;
        }
    },
    extractFcOpt: function (proj, _excludeFields) {
        var fcOpt = Utils.deepCopy(proj),
            excludeFields = _excludeFields || ['id', 'projName', 'projDir', 'srcDir', 'version', 'watchToRebuilding'];
        excludeFields && excludeFields.forEach(function (field) {
            delete fcOpt[field];
        });
        return fcOpt;
    },
    updatePkg: function (projName, projDir, version, watchToRebuilding, fcOpt) {
        var pkg = Data.loadProjPackage(projName, projDir);
        pkg.version = version;
        pkg.watchToRebuilding = watchToRebuilding;
        pkg.fcOpt = fcOpt;
        Data.saveProjPackage(pkg, projDir);
    }
};

var _onCurrentChangedCallbacks = [];
_this.onCurrentChanged = function (_func, _context) {
    if (_func) {
        _onCurrentChangedCallbacks.push({
            func: _func,
            context: _context
        });
        return;
    }
    _onCurrentChangedCallbacks.forEach(function (callback) {
        var func = callback.func,
            context = callback.context;
        typeof func === 'function' && func.call(context);
    });
};


// 滚动到id对应的列表项位置
var scrollToItem = function (id) {
    var listBox = document.querySelector('.list-box'),
        listItem = listBox.querySelector('.proj-list .proj-item[data-id="' + id + '"]');
    if (!listItem) {
        window.setTimeout(function () {
            scrollToItem(id);
        }, 100);
        return;
    }
    var scroll = listBox.querySelector('.list-scroll'),
        listBoxRect = listBox.getBoundingClientRect(),
        listItemRect = listItem.getBoundingClientRect(),
        alignWithTop = listItemRect.top < listBoxRect.top ? true :
            listItemRect.bottom > listBoxRect.bottom ? false : null;
    (scroll.scrollTop === 0) && (scroll.scrollTop = 1);  // 激活滚动条
    (alignWithTop !== null) && listItem.scrollIntoView(alignWithTop);
};
