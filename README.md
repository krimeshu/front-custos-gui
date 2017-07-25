<p align="center">
	<img src="https://github.com/krimeshu/front-custos-gui/raw/master/tea-time.png" width="80"/>
	<br/>
	<strong>Front Custos GUI</strong>
</p>

基于 electron + gulp 的 Web 前端开发常用任务流的可视化配置工具，无需安装其他环境即可直接使用。

> `Front Custos` (= *FRONT-end CUStomize Tasks Orgnizing Scheduler*, lol)。

## 安装方法

### 1. 下载 release 版本

下载完成后，解压即可直接打开运行。

[https://github.com/krimeshu/front-custos-gui/releases](https://github.com/krimeshu/front-custos-gui/releases)

> 暂时只提供 **Win32-x64** 版本，其他平台架构参考下面步骤手动构建打包。

### 2. 手动构建编译

```bash
git clone https://github.com/krimeshu/front-custos-gui.git
cd front-custos-gui
npm run build
```

完成后，执行 ```npm start``` 即可启动开发调试版。

> 已测试支持 **Win32 (x86&x64)**, **OS X (x64)**，其他情况需要自行验证，如遇到问题欢迎联系或留言。

### 3. 打包发布版

根据自己的操作系统平台与架构，执行对应的打包命令。打包完成的发布版会保存在 `front-custos-gui` 相邻的 `front-custos-gui-dist` 目录内。

```base
npm run dist-win64
npm run dist-win32
npm run dist-mac64
npm run dist-mac32
```

> 其它平台打包命令可参考 `electron-packager` 文档，自行配置。

## 使用方法

![screenshot-gui](https://github.com/krimeshu/front-custos-gui/raw/master/screenshot-gui.png)

将需要处理的项目目录加入到左侧列表，在 **任务列表** 内勾选需要执行的任务，根据项目情况微调 **任务配置** 内的相关参数后，点击执行构建 (或全局快捷键 **CmdOrCtrl+Alt+B**) 即可。

## 主要功能

### SASS 编译

启用 **compile_sass** 任务后，项目目录内的 "*.scss" 文件就会被编译成 "*.css" 文件，保存在同一目录下（注意，若之前有同名 css 文件将会被覆盖）。

```css
article {
  width: 800px;
  background: darken(#FFF, 20%);	/* 调用了 SASS 的 darken 函数 */
}
```

编译后生成的样式代码：

```css
article {
  width: 800px;
  background: #cccccc; 
}
```

### CSS 样式前缀处理

启用 **prefix_crafter** 任务后，生成的 "*.css" 文件内需要添加浏览器前缀的样式将会被自动处理，无需再手动添加不同浏览器前缀了。对应浏览器范围可在 **任务配置** 页卡内进行配置。

```css
.example {
  display: flex;
  animation: zoomIn 100ms ease;
}

@keyframes zoomIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
```

以目标浏览器 `Android > 2.3, iOS > 6.0` 的配置处理后 (其他配置可参考 [browserlist](https://github.com/ai/browserslist)):

```css
.example {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-animation: zoomIn 100ms ease;
  animation: zoomIn 100ms ease
}

@-webkit-keyframes zoomIn {
  0% {
    -webkit-transform: scale(0);
    transform: scale(0)
  }
  to {
    -webkit-transform: scale(1);
    transform: scale(1)
  }
}

@keyframes zoomIn {
  0% {
    -webkit-transform: scale(0);
    transform: scale(0)
  }
  to {
    -webkit-transform: scale(1);
    transform: scale(1)
  }
}
```

### ES6 代码转译和打包

有两个任务可供选择，**run\_babel** 和 **rollup_bundle**。

**run\_babel** 任务会处理项目内所有 "\*.js" 和 "\*.es6" 文件，将其中的 ES6 语法部分转译成多数浏览器支持的等效代码，不会打包脚本，需要配合 **run\_browserify** 进行打包。

使用 **rollup_bundle** 任务的话，配合其中的 `babel`、`common-js`、`vue` 等插件，实现更丰富的 ES6 转译、组件转换和脚本打包的完整流程。

相关插件和打包的入口脚本可以在 **任务配置** 页卡内设置， 如果不想手动配置，也可启用 **find\_bundle\_entry** 任务。该任务将检测页面内引用的脚本，自动标记为打包任务的入口脚本。

此外，**babel** 相关任务默认加入了 `react` 插件，支持将 jsx 语法的 DOM 代码转换为浏览器能识别的代码。

### 雪碧图合成

要使用此功能，在项目任务列表中，勾选 **sprite_crafter** 任务。

然后修改项目的样式代码，在需要合成雪碧图的图片地址后面，加上`#sc`或`#sc=组名`的标记即可。

```css
body { 
  background: url('../images/main-bg.png#sc'); 
}
```

被标记的图片将自动合并在同组雪碧图内（`#sc`等效于`#sc=default`）。

若背景图素材为高清图片，可配置相应的像素密度参数，如：

> 为 **375px** 虚拟视口宽度（iPhone6尺寸）制作的 **750px** 设计稿，像素密度即为 **750px / 375px = 2**。

非高清素材，像素密度直接填写 **1** 即可。

若页面使用了`rem`适配设备尺寸，雪碧图宽高也需要转换成`rem`单位时，可配置`rem`像素比参数。如：

> 默认`html`的`font-size: 20px;`，`rem`像素比即为 **20**。

## 其他功能

### 脚本&样式文件压缩

**run\_uglify** 与 **run\_csso** 任务分别是脚本和样式的压缩任务。

但是需要注意，它们可能会损坏其它任务的 **sourcemap** 文件。

所以使用 **rollup** 或 **prefix\_crafter** 任务的时候，建议启用它们内部的 **uglify** 或 **cssnano** 插件来处理脚本和样式的压缩。

### 图片文件压缩

启用 **optimize_image** 任务即可，项目源文件不会被影响，处理后的文件将放入输出文件夹。

> 使用 `gulp-imagemin`，结合 `gifsicle`, `jpegtran`, `pngquant`, `svgo` 的常用配置处理 **gif**, **jpg**, **png**, **svg** 文件。

### 文件内容并入

要使用此功能，在项目任务列表中，勾选 **join_include** 任务。

#### **I. 文本文件处理**

在相应位置输入`#include('被并入文件相对路径')`的语句，即可将被并入文件的内容插入到所在位置。

> 可注释此语句，避免`.js`或`.css`文件的语法校验错误 (不影响文件并入效果)：

```javascript
//#include('b.js')
/*#include('b.js')*/
```

等价于：

```
#include('b.js')
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

### 链接文件

有时候，我们还需要将本地重构完毕的页面，针对不同的资源服务器域名，进行引用链接的替换、并加入文件版本相关的指纹参数等操作。

为了避免这类重复且容易疏漏的问题，可以勾选工具中的 **allot_link** 任务，让工具自动进行处理。

工具在任务中会自动匹配识别`html`页面标签的相关资源属性，和`css`样式文件内`url()`中的资源属性，将它们替换成最终链接。

对于无法自动识别的链接（如`js`脚本文件内某个文件资源地址的字符串、`html`页面文件内非常见的资源属性），可以使用`#link()`语句进行标记，工具就能识别后进行处理。如：

```javascript
var appLogoSrc = '#link("../images/app-logo.png")',
	appLogoDOM = document.getElementById('img_appLogo');

appLogoDOM.src = appLogoSrc;
```

没有被直接或间接引用到的文件，将被自动忽略，不放入生成目录内。