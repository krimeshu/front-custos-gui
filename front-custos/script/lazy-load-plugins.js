/**
 * Created by krimeshu on 2016/5/14.
 */

module.exports = {
    _cached: {},
    get gulp() {
        return this._cached['gulp'];
    },
    set gulp(gulp) {
        this._cached['gulp'] = gulp;
    },
    get runSequence() {
        return this._cached['run-sequence'] || (this._cached['run-sequence'] = require('run-sequence'));
    },
    get del() {
        return this._cached['del'] || (this._cached['del'] = require('del'));
    },
    get pngquant() {
        return this._cached['pngquant'] || (this._cached['pngquant'] = require('imagemin-pngquant'));
    },
    get plumber() {
        return this._cached['plumber'] || (this._cached['plumber'] = require('gulp-plumber'));
    },
    get cache() {
        return this._cached['cache'] || (this._cached['cache'] = require('gulp-cache'));
    },
    get csso() {
        return this._cached['csso'] || (this._cached['csso'] = require('gulp-csso'));
    },
    get imagemin() {
        return this._cached['imagemin'] || (this._cached['imagemin'] = require('gulp-imagemin'));
    },
    get sass() {
        return this._cached['sass'] || (this._cached['sass'] = require('gulp-sass'));
    }
};