/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js'),
    Utils = require('./utils.js');

module.exports = {
    allTasks: [
        {name: 'prepare_build', desc: '构建预准备', locked: true},
        {name: 'replace_const', desc: '替换定义的常量'},
        {name: 'compile_sass', desc: '编译SASS文件'},
        {name: 'join_include', desc: '合并包含的文件'},
        {name: 'sprite_crafter', desc: '自动合并雪碧图'},
        {name: 'prefix_crafter', desc: '添加CSS3前缀'},
        {name: 'allot_link', desc: '分发关联文件'},
        {name: 'run_csso', desc: '压缩样式'},
        {name: 'optimize_image', desc: '压缩图片'},
        {name: 'do_dist', desc: '输出文件', locked: true},
        {name: 'do_upload', desc: '上传文件', locked: true}
    ],
    allThemes: {
        'default': {primary: 'blue-grey', accent: 'red'},
        'pink': {primary: 'pink', accent: 'red'},
        'indigo': {primary: 'indigo', accent: 'pink'},
        'orange': {primary: 'deep-orange', accent: 'blue'}
    },
    templates: Data.getTemplates(),
    config: Data.loadConfig(),
    projList: Data.loadProjList(),
    curProj: Data.getInitOpt(),
    watchingProjIds: [],
    loadCurProj: function (proj) {
        var opts = this.loadProjOptions(proj);
        Utils.deepCopy(opts, this.curProj);
        Utils.deepCopy(proj, this.curProj);
    },
    loadProjOptions: function (proj) {
        var projName = proj.projName,
            srcDir = proj.srcDir,
            pkg = Data.loadProjPackage(projName, srcDir),
            opts = pkg.fcOpt || {};
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
            Utils.deepCopy(Data.getInitOpt(), this.curProj);
            return true;
        } catch (e) {
            return false;
        }
    },
    updateProj: function (projWithOpts) {
        try {
            var id = projWithOpts.id,
                projName = projWithOpts.projName,
                srcDir = projWithOpts.srcDir,
                version = projWithOpts.version,
                watchToRebuilding = projWithOpts.watchToRebuilding,
                fcOpt = this.extractFcOpt(projWithOpts, ['id', 'projName', 'srcDir', 'version']);
            this.updatePkg(projName, srcDir, version, watchToRebuilding, fcOpt);

            var projList = this.projList,
                justProj = this.getProjById(id);
            justProj.projName = projName;
            justProj.srcDir = srcDir;
            Data.saveProjList(projList);

            return true;
        } catch (e) {
            return false;
        }
    },
    extractFcOpt: function (proj, excludeFields) {
        var fcOpt = Utils.deepCopy(proj);
        excludeFields && excludeFields.forEach(function (field) {
            delete fcOpt[field];
        });
        return fcOpt;
    },
    updatePkg: function (projName, srcDir, version, watchToRebuilding, fcOpt) {
        var pkg = Data.loadProjPackage(projName, srcDir);
        pkg.version = version;
        pkg.watchToRebuilding = watchToRebuilding;
        pkg.fcOpt = fcOpt;
        Data.saveProjPackage(pkg, srcDir);
    }
};