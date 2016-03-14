/**
 * Created by krimeshu on 2015/9/18.
 */

var _spritesmith = require('spritesmith'),
    _fs = require('fs'),
    _path = require('path'),

    Utils = require('./utils.js'),
    FileCache = require('./file-cache.js');

var ruleJson = {
    "css": {
        check: function (file) {
            return _path.extname(file) === '.css';
        },
        reg: /background(?:\-image)?:[^;}]*?url\(['"]?(.+?)#sc(=(.*?))?['"]?\)[^;}]*[;}]/gi,
        m: [0, 1, 3]
    }
};

var cacheMap = {};

function process(opt, cb) {
    var src = opt.src,
        files = opt.files || [],
        fileCache = new FileCache(),
        useRatio = opt.useRatio || 2,
        useRem = opt.useRem || 10,
        outputDir = opt.outputDir || '';

    var cssFiles = files,
        maps = {};

    cssFiles.forEach(function (cssFile) {
        var content = fileCache.get(cssFile);
        if (!content) {
            return;
        }
        buildMap(cssFile, content, maps);
    });

    var spriteImages = {},
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
        joinImages({
            srcImg: spriteImage,
            distImg: distImg,
            fileCache: fileCache
        }, function (spriteData) {
            cssFiles.forEach(function (cssFile) {
                var rawContent = fileCache.get(cssFile),
                    map = maps[cssFile];
                fileCache.set(cssFile, replaceStyle(cssFile, rawContent, map, spriteData, useRatio, useRem));
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

function buildMap(cssFile, content, maps) {
    var DEFAULT_SPRITE_NAME = 'default';

    for (var name in ruleJson) {
        var rule = ruleJson[name], m;
        if (!rule.check(cssFile)) {
            continue;
        }

        var map = (maps[cssFile] = maps[cssFile] || {});
        rule.reg.lastIndex = 0;
        while (m = rule.reg.exec(content)) {
            var matchStr = m[rule.m[0]] || rule.m[0],
                matchPath = m[rule.m[1]] || rule.m[1],
                spriteName = m[rule.m[2]] || DEFAULT_SPRITE_NAME;

            if (/^(http|https|data):/.test(matchPath)) {
                continue;
            }

            if (!Utils.isImage(matchPath) || map[matchStr]) {
                continue;
            }

            var cssDir = _path.dirname(cssFile),
                imgPath = _path.resolve(cssDir, matchPath);
            if (_fs.existsSync(imgPath)) {
                map[matchStr] = {
                    matchPath: matchPath,
                    truePath: imgPath,
                    spriteName: spriteName
                };
            }
        }
    }
}

function joinImages(opt, cb) {
    var srcImg = opt.srcImg,
        distImg = opt.distImg,
        fileCache = opt.fileCache,
        distDir = _path.dirname(distImg),

        extName = _path.extname(distImg),
        baseName = _path.basename(distImg, extName),
        mapFile = _path.resolve(distDir, baseName + '.map'),    // 文件映射缓存

        res = {};

    if (cacheMap[mapFile]) {
        var map = cacheMap[mapFile],
            stamp = map['stamp'],
            data = map['data'],
            imgBuffer = map['imgBuffer'],
            visited = {},
            changed = false;


        for (var i = 0, len = srcImg.length; i < len; i++) {
            var img = srcImg[i],
                s = stamp[img];
            if (!s) {
                changed = true;
                break;
            }
            visited[img] = true;
            var md5 = Utils.md5(img, true);
            if (s != md5) {
                changed = true;
                break;
            }
        }
        for (var img in stamp) {
            if (!visited[img]) {
                changed = true;
                break;
            }
        }
        if (!changed && imgBuffer) {
            res = data;
            res.noChange = true;
            fileCache.set(distImg, imgBuffer);
            cb(res);
            return;
        }
    }
    _spritesmith.run({
        src: srcImg,
        padding: 10
    }, function (err, result) {
        if (err) {
            throw err;
        }

        var img = result['image'],
            cod = result['coordinates'],
            prop = result['properties'];

        Utils.makeSureDir(distDir);
        fileCache.set(distImg, img);

        res.baseWidth = prop.width;
        res.baseHeight = prop.height;
        res.baseImage = distImg;
        res.spriteItems = cod;

        var stamp = {},
            data = res;
        for (var i = 0, len = srcImg.length; i < len; i++) {
            var imgFile = srcImg[i],
                md5 = Utils.md5(imgFile, true);
            stamp[imgFile] = md5;
        }
        cacheMap[mapFile] = {
            stamp: stamp,
            data: data,
            imgBuffer: img
        };

        cb(res);
    });
}

function replaceStyle(cssFile, rawContent, map, spriteData, useRatio, useRem) {
    var cssDir = _path.dirname(cssFile),
        image = spriteData.baseImage,
        width = spriteData.baseWidth,
        height = spriteData.baseHeight,
        items = spriteData.spriteItems,
        relaImg = _path.relative(cssDir, image),
        newContent = rawContent,
        t = useRatio * useRem;
    var css = [
        'background: url("' + relaImg.replace(/\\/g, '/') + '") ', // 0
        '0', // 1
        useRem > 1 ? 'rem ' : 'px ',
        '0', // 3
        useRem > 1 ? 'rem; ' : 'px; ',
        'background-size: ' + (width / t) + (useRem > 1 ? 'rem ' : 'px ') + (height / t) + (useRem > 1 ? 'rem; ' : 'px; '),
        'width: ',
        '0', // 7
        useRem > 1 ? 'rem; ' : 'px; ',
        'height: ',
        '0', // 10
        useRem > 1 ? 'rem;' : 'px;'
    ];
    for (var str in map) {
        var item = map[str],
            imgPath = item.truePath,
            data = items[imgPath];
        if (!data) {
            continue;
        }
        css[1] = (-data.x / t);
        css[3] = (-data.y / t);
        css[7] = (data.width / t);
        css[10] = (data.height / t);
        var replacePattern = str.replace(/([\^\$\(\)\*\+\-\.\[\]\?\\\{}\|])/g, '\\$1'),
            prepareReg = new RegExp('(' + replacePattern + '[^\\}]*?)background\\-size:[^;]*?;', 'g'),
            replaceReg = new RegExp(replacePattern, 'g'),
            replaceStyle = css.join('');
        newContent = newContent.replace(prepareReg, '$1').replace(replaceReg, replaceStyle);
    }
    return newContent;
}

module.exports = {
    buildMap: buildMap,
    process: process,
    joinImages: joinImages,
    replaceStyle: replaceStyle
};
