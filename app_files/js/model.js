/**
 * Created by krimeshu on 2016/3/12.
 */

var Data = require('./data.js');

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
    }
};