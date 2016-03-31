/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js'),
    Utils = require('./utils.js');

module.exports = {
    allTasks: [
        {name: 'prepare_build', desc: '构建预准备', locked: true},
        {name: 'replace_const', desc: '替换定义的常量'},
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
                projList = this.projList,
                proj = this.getProjById(id),

                fcOpt = Utils.deepCopy(this.curProj),
                projName = fcOpt.projName,
                srcDir = fcOpt.srcDir,
                version = fcOpt.version,
                pkg = Data.loadProjPackage(projName, srcDir);

            delete fcOpt.id;
            delete fcOpt.projName;
            delete fcOpt.srcDir;
            delete fcOpt.version;

            proj.projName = projName;
            proj.srcDir = srcDir;
            pkg.fcOpt = fcOpt;
            pkg.version = version;

            Data.saveProjList(projList);
            Data.saveProjPackage(pkg, srcDir);
            return true;
        } catch (e) {
            return false;
        }
    }
};