/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js'),
    Logger = require('./logger.js'),
    Utils = require('./utils.js'),
    CustosProxy = require('./custos-proxy.js');

var _this = {
    allTasks: [
        {name: 'prepare_build', desc: '构建预准备', locked: true},
        {name: 'replace_const', desc: '替换定义的常量'},
        {name: 'compile_sass', desc: '编译SASS文件'},
        {name: 'prefix_crafter', desc: '添加CSS3前缀'},
        {name: 'sprite_crafter', desc: '自动合并雪碧图'},
        {name: 'run_csso', desc: '压缩样式'},
        {name: 'join_include', desc: '合并包含的文件'},
        {name: 'run_browserify', desc: '通过browserify打包脚本'},
        {name: 'allot_link', desc: '分发关联文件'},
        {name: 'optimize_image', desc: '压缩图片'},
        {name: 'do_dist', desc: '输出文件', locked: true},
        {name: 'do_upload', desc: '上传文件', disabled: true}
    ],
    fillAndReorderTasks: function (tasks) {
        var _tasks = [];
        for (var i = 0, task; task = this.allTasks[i]; i++) {
            var pos = tasks.indexOf(task.name);
            if (!task.disabled && (pos >= 0 || task.locked)) {
                _tasks.push(task.name);
            }
        }
        var _args = [0, tasks.length].concat(_tasks);
        tasks.splice.apply(tasks, _args);
    },
    allThemes: {
        'default': {primary: 'blue-grey', accent: 'red'},
        'pink': {primary: 'pink', accent: 'red'},
        'indigo': {primary: 'indigo', accent: 'pink'},
        'orange': {primary: 'deep-orange', accent: 'blue'}
    },
    templates: Data.getTemplates(),
    config: Data.loadConfig(),
    projList: Data.loadProjList(),
    curProj: Data.getNewOpt(),
    watchingProjIds: [],
    selectCurProj: function (proj) {
        var opts = this.loadProjOptions(proj),
            id = proj.id,
            projName = proj.projName,
            projDir = proj.projDir;
        Utils.clearObj(this.curProj);
        Utils.deepCopy(opts, this.curProj);
        Utils.deepCopy(proj, this.curProj);

        Logger.log('<hr/>');
        Logger.info('[时间: %s]', Utils.formatTime('HH:mm:ss.fff yyyy-MM-dd', new Date()));
        Logger.info('切换到项目：%c%s %c(%s)', 'color: white;', projName, 'color: #cccc81;', projDir);

        // 检查是否监听自动构建
        if (this.curProj.watchToRebuilding) {
            CustosProxy.watch(this.curProj);
        }

        // 记录上次操作的 Id
        this.config.lastWorkingId = id;
        Data.saveConfig(this.config);

        scrollToItem(id);
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
    removeProjById: function (id) {
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

            if (pos >= projList.length - 1) {
                pos = projList.length - 1;
            }
            if (pos >= 0) {
                // 同一位置还有项目时，切换到该项目
                proj = this.projList[pos];
                this.selectCurProj(proj);
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
    var listBoxRect = listBox.getBoundingClientRect(),
        listItemRect = listItem.getBoundingClientRect(),
        alignWithTop = listItemRect.bottom < listBoxRect.top ? true :
            listItemRect.top > listBoxRect.bottom ? false : null;
    (alignWithTop !== null) ? listItem.scrollIntoView(alignWithTop) :
        (listBox.querySelector('.list-scroll').scrollTop = 1);  // 激活滚动条
};

for (var p in _this) {
    if (_this.hasOwnProperty(p)) {
        module.exports[p] = _this[p];
    }
}