
setTimeout(function () {

    var v = new Vue({
        el: '#list',
        data: {
            // keepPhpSsrDom: true, // [default: undefined]
            list: initData
        },
        methods: {
            showItemId: function (e) {
                var item = e.currentTarget,
                    id = item.getAttribute('data-id');
                alert(id);
            }
        },
        created: function () {
            var self = this;
            console.log('Vue #list created!', this);
            setTimeout(function () {
                console.log('Append data.');
                self.list = self.list.concat([
                    { text: '遗忘罪人' },
                    { text: '古之铁王' },
                    { text: '腐败物' },
                    { text: '爬虫守卫' }
                ]);
            }, 1000);
        }
    });
    setTimeout(function () {
        v.list = v.list.concat([
            { text: '灰烬审判者' }
        ]);
    }, 2000);

}, 1000);
