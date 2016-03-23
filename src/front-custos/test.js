/**
 * Created by shu on 2016/2/19.
 */

var gulp = require('gulp'),

    frontCustos = require('./');

frontCustos.registerTasks(gulp);
frontCustos.config({
    outputDir: './dist',
    htmlEnhanced: false,
    delUnusedFiles: true,
    uploadCallback: function (response) {
        return /^上传成功/.test(response);
    },
    flattenMap: {
        page: '',
        style: 'css',
        script: 'js',
        image: 'images',
        font: 'font',
        audio: 'audio',
        other: 'raw'
    },
    concurrentLimit: 1
});

frontCustos.process({
    srcDir: './example/',
    version: '0.1.0',
    keepOldCopy: false,
    scOpt: {
        "useRatio": 1,
        "useRem": 1
    },
    pcOpt: {
        "browsers": "Android > 2.3, iOS > 6.0",
        "compress": false
    },
    alOpt: {
        allot: true,
        pageDir: 'page/{PROJECT_NAME}',
        staticDir: 'static/{PROJECT_NAME}',
        staticUrlHead: 'http://static.foo.com/{PROJECT_NAME}',
        flatten: true,
        hashLink: true,
        useStaticUrlHead: true
    },
    upOpt: {
        uploadAll: false,
        page: 'http://test.oa.com/uploadDevFile.php',
        form: function (fileStream, relativeName, projectName) {
            var suffix = (relativeName.substr(relativeName.lastIndexOf('.'))),
                prefix = (relativeName.split('/').slice(0, -1));
            (['.html', '.shtml', '.php'].indexOf(suffix) < 0) && prefix.pop();
            prefix.splice(0, 0, projectName);
            return {
                'fileName': relativeName,
                'prefix': prefix.join('/'),
                'myfile': fileStream
            };
        }
    },
    tasks: [
        'prepare_build',
        'replace_const',
        'join_include',
        'sprite_crafter',
        'prefix_crafter',
        'allot_link',
        'optimize_image',
        'do_dist'
    ]
});


