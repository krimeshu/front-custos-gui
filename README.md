# front-custos-gui

`Front Custos` *(`Front Custom Tasks Custos`)* ———— “前端定制任务管家”。

根据日常项目中的常见的前端开发需求，基于`gulp`任务流程、各种处理模块，提供快速创建、管理、运行前端自动任务的辅助工具。

![screenshot-gui](https://github.com/krimeshu/front-custos-gui/raw/master/screenshot-gui.png)

## 一、使用方法

### 1. 直接下载 release 中最新打包好的发布版本，解压后使用。

> 暂时只提供 win32-x64 版本。

### 2. 手动构建编译。

```bash
git clone https://github.com/krimeshu/front-custos-gui.git
cd front-custos-gui
npm run install-dev
```

完成后，需要打开工具时，执行 ```npm start``` 即可。

### 3. 打包发布版本。

```base
npm run dist-win64
npm run dist-win32
```

其它平台可以自己编写 ```electron-packager``` 命令进行打包。

## 二、主要任务说明

* **compile_sass**

将目录中的`.sass`和`.scss`编译成浏览器支持的`.css`样式文件。

* **run_babel**

将项目中的`.es6`编译成`.js`的`es5`代码。

* **prepare_build**

将源目录中的文件转到构建目录，开始后续需要避免对源文件影响的任务。

* **replace_const**

其它任务开始之前，将各类文件中的`{PROJECT}`、`{PROJECT_NAME}`、`{VERSION}`等常量替换成相应的值。

* **prefix_crafter**

根据设定的浏览器范围，处理构建目录中的`.css`文件，自动添加各类浏览器的样式前缀。

* **sprite_crafter**

检测构建目录中的`.css`文件，根据背景图片地址的标记，自动合成输出雪碧图，并替换覆盖`.css`文件内的相关样式。

* **run_csso**

优化构建目录中的`.css`文件，删除空白、换行符等字符，缩减`.css`文件内容。

* **join_include**

处理构建目录中，使用`#include(...)`标记的文件文件合并语句，常用于文件内容并入、图片转`base64`字符串。

* **rollup_bundle**

根据工具中的配置，使用`rollup`对各个入口脚本进行打包处理.

* **run_browserify**

寻找构建目录中标记为入口模块的`.js`脚本文件，使用`browserify`进行打包处理。

* **allot_link**

分发构建目录中的文件，可根据配置将页面文件和静态资源文件分发到不同的目录下，并简化较深的目录层级，将文件内容中旧地址替换为处理后的新地址。

过程中，还可将相对资源文件路径，自动补全为带域名的完整链接。

再根据各页面使用到的文件链接关系，删减没有使用到的资源文件。

## 三、使用方法

### 1. 雪碧图合成

要使用此功能，在项目任务列表中，勾选`sprite_crafter`。

然后打开项目的`.css`文件，在需要合成雪碧图的图片地址后面，加上`#sc`或`#sc=组名`的标记即可。如：`body { background: url('../images/main-bg.png#sc'); }`

若背景图素材为高清图片，可配置相应的像素密度参数，如：为 **375px** 虚拟视口宽度（iPhone6尺寸）制作的 **750px** 设计稿，像素密度为 **750px / 375px = 2**。非高清素材，像素密度填写 **1** 即可。

若页面使用了`rem`适配设备尺寸，雪碧图宽高也需要转换成`rem`单位时，可再配置`rem`像素比参数。如：默认`html`的`font-size: 20px;`，`rem`像素比即为 **20**。

### 2. 文件内容并入

要使用此功能，在项目任务列表中，勾选`join_include`。

#### **I. 文本文件处理**

在相应位置输入`#include('被并入文件相对路径')`的语句，即可将被并入文件的内容插入到所在位置。

也可以在注释中使用此语句：`//#include('b.js');`或`/*#include('b.js')*/`，避免`.js`或`.css`文件的语法校验错误。

```html
<body>
<script>
	// 一些预处理，直接从JS文件中提出，并入页面内
	//#include('js/_init.js');
</script>
</body>
```

#### **II. 图片文件处理**

除了网页、脚本、样式等文本文件之外，也可以对图片文件使用此语句：`#include('../images/icon-ok.gif')`，即可将图片转为`Base64`编码的`dataURI`插入到所在位置，如：

```html
<img class="small-icon" src="#include('images/icon-ok.gif')"/>
```

#### **III. 字符串行内转义**

当需要在脚本语句中，将某个文件的内容作为字符串来使用时，可能会碰到换行符等特殊符号将字符串截断的问题。此时可以在语句中加入`_inlineString`参数，构建程序在处理过程中将把这些符号进行转移，确保字符串格式正确。如：

```javascript
var styleText = '#include("../css/top-bar.css", {"_inlineString": true})',
	styleDOM = document.createElement('STYLE');

styleDOM.innerHTML = styleText;
document.body.appendChild(styleDOM);
```

#### **IV. 碎片并入**

当只需要引入某个文件的部分内容时，可以在被引入文件内加入碎片段落的起止注释标记`fragBegin`和`fragEnd`，引入的文件内使用`_fragName`指定对应的碎片段落名即可。如，有一个`_ads.html`，里面分别有页首、页尾的广告，分别需要加入到`index.html`等其它页面的两个不同位置：

```html
<!-- _ads.html 文件内容： -->

<!-- fragBegin: headerAd -->
<p>我是头部广告的内容</p>
<!-- fragEnd: headerAd -->

<!-- fragBegin: footerAd -->
<p>我是尾部广告的内容</p>
<!-- fragEnd: footerAd -->
```

```html
<!-- index.html 文件内容 -->

<body>
#include('_ads.html', {"_fragName": "headerAd"})
<main>页面内容</main>
#include('_ads.html', {"_fragName": "footerAd"})
</body>
```

#### **V. 其它自定义参数**

除了预留的几个参数字段外，还可以加入其它参数，从引用文件传入被引用文件。如，有一个`_top.html`，分别被`index.html`和`login.html`引用，但其中的`.title`需要显示不同的页面名字：

```html
<!-- _top.html 文件内容 -->
<p class="title">#pageName#</p>

<!-- index.html 文件内容 -->
#include("_top.html", {"pageName": "首页"})

<!-- login.html 文件内容 -->
#include("_top.html", {"pageName": "登录页"})
```

### 3. 打包脚本

对于页面逻辑达到一定规模的页面，会开始有编写模块化脚本的需要，以便于日后进行迭代维护。

由于暂时还没能踏入HTTP2的时代，模块化的脚本在上线前还需要进行打包合并的工作，处理成最终文件再进行上线。

为了合并这些模块脚本，除了通过传统方式的`window`命名空间，配合`#include()`语句实现之外，我们还可以使用`CommonJS`标准编写脚本模块，然后通过`browserify`来对脚本进行打包。

具体只需要在任务列表中勾选`run_browserify`，再在打包脚本的入口文件内加入标记：`Browserify Entry` 即可。如：

```javascript
/* a.js 文件内容 */

'browserify entry';

var b = require('./b.js');
```

**注：** 也可使用注释的形式进行标记，如：`// Browserify entry`或`/* Browserify Entry */`。

### 4. 链接文件地址

有时候，我们还需要将本地重构完毕的页面，针对不同的资源服务器域名，进行引用链接的替换、并加入文件版本相关的指纹参数等操作。

为了避免这类重复且容易疏漏的问题，可以勾选工具中的`allot_link`任务，让工具自动进行处理。

工具在任务中会自动匹配识别`html`页面标签的相关资源属性，和`css`样式文件内`url()`中的资源属性，将它们替换成最终链接。

对于无法自动识别的链接（如`js`脚本文件内某个文件资源地址的字符串、`html`页面文件内非常见的资源属性），可以使用`#link()`语句进行标记，工具就能识别后进行处理。如：

```javascript
var appLogoSrc = '#link("../images/app-logo.png")',
	appLogoDOM = document.getElementById('img_appLogo');

appLogoDOM.src = appLogoSrc;
```

**注：** 所有链接文件路径都请使用相对于当前标记文件的路径，`js`脚本中也是（而非相对被引用页面的路径）