/**
 * Created by shu on 2016/2/19.
 */

var gulp = require('gulp'),

    frontCustos = require('./'),
    packageOptions = require('./example/package.json'),
    fcOptions = packageOptions.fcOpt;

fcOptions['projDir'] = './example';

frontCustos.registerTasks(gulp);
frontCustos.config({
    outputDir: './example/dist',
    htmlEnhanced: false,
    delUnusedFiles: true,
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

frontCustos.process(fcOptions);


