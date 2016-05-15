/**
 * Created by krimeshu on 2016/2/16.
 */

var _path = require('path');

var Through2 = require('through2'),

    FileCache = require('./file-cache.js');

var SpriteCrafterProxy = {
    analyseUsedImageMap: function (files, maps) {
        var SpriteCrafter = require('./sprite-crafter.js');
        return Through2.obj(function (file, enc, cb) {
            if (file.isDirectory()) {
                return cb(null, file);
            }

            //console.log('================================================================================');
            //console.log('> SpriteCrafterProxy - file:', file.path);

            var content = String(file.contents);
            SpriteCrafter.buildMap(file.path, content, maps);

            files.push(file.path);

            file.content = new Buffer(content);

            return cb(null, file);
        });
    },
    process: function (opt, cb) {
        var SpriteCrafter = require('./sprite-crafter.js');

        var src = opt.src,
            cssFiles = opt.files,
            maps = opt.maps,
            fileCache = new FileCache(),
            useRatio = opt.useRatio || 2,
            useRem = opt.useRem || 10,
            outputDir = opt.outputDir || '',

            spriteImages = {},
            spriteImagesTotal = 0,
            handleCount = 0;

        for (var cssFile in maps) {
            var map = maps[cssFile];
            for (var str in map) {
                var item = map[str],
                    truePath = item.truePath,
                    spriteName = item.spriteName,
                    spriteImage = spriteImages[spriteName];
                if (!spriteImage) {
                    spriteImage = spriteImages[spriteName] = [];
                    spriteImagesTotal++;
                }
                if (spriteImage.indexOf(truePath) < 0) {
                    spriteImage.push(truePath);
                }
            }
        }

        if (!spriteImagesTotal) {
            cb();
            return;
        }

        for (var spriteImageName in spriteImages) {
            var spriteImage = spriteImages[spriteImageName],
                distDir = _path.resolve(src, outputDir),
                distImg = _path.resolve(distDir, 'sc_img_' + spriteImageName + '.png');
            SpriteCrafter.joinImages({
                srcImg: spriteImage,
                distImg: distImg,
                fileCache: fileCache
            }, function (spriteData) {
                cssFiles.forEach(function (cssFile) {
                    var rawContent = fileCache.get(cssFile),
                        map = maps[cssFile],
                        newContent = SpriteCrafter.replaceStyle(cssFile, rawContent, map, spriteData, useRatio, useRem);
                    fileCache.set(cssFile, newContent);
                });
                handleCount++;
                if (handleCount >= spriteImagesTotal) {
                    fileCache.output();
                    fileCache.clear();
                    cb();
                }
            });
        }
    }
};

module.exports = SpriteCrafterProxy;
