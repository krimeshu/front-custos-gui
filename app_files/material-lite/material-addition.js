/**
 * Created by krimeshu on 2015/8/31.
 */
(function () {
    var _this = window.MA = {};

    _this.select = function (selector, parent) {
        parent = parent || document;
        return parent.querySelector(selector);
    };

    _this.setText = function (obj, text) {
        if (typeof(obj) == 'string') {
            obj = _this.select(obj);
        }
        if (!obj) {
            return;
        }
        obj.value = text;
        this._dispatch(obj, 'input');
    };

    _this.setSelect = function (obj, checked) {
        if (typeof(obj) == 'string') {
            obj = _this.select(obj);
        }
        if (!obj) {
            return;
        }
        obj.checked = checked ? 'checked' : null;
        this._dispatch(obj, 'change');
    }

    _this._dispatch = function (obj, type) {
        var eventName = type;
        switch (type) {
            case 'input':
                eventName = 'TextEvent';
                break;
            case 'change':
            default:
                eventName = 'Event';
        }

        var event = document.createEvent(eventName);
        event.initEvent(type, true, true);
        obj.dispatchEvent(event);
    };

})();