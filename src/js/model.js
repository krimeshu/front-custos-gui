/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js'),
    Utils = require('./utils.js');

module.exports = {
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
                console.log('InfoBoxCtrl.removeProj 异常：没有找到需要移除的项目！');
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