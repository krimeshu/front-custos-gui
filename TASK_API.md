# 添加新任务的步骤

## 在 task-manager 中添加任务信息和任务入口

打开 `front-custos/script/task-list.js`，按照已有格式和顺序，加入任务名、入口和简介信息。

## 编写任务入口和任务插件代码

在 `front-custos/script/tasks` 中创建任务入口脚本，实现任务主要流程的逻辑。

在 `front-custos/script/plugins` 中创建任务插件脚本，做任务处理的具体逻辑。

### 任务入口内加入任务插件

任务入口脚本中需要引入 `front-custos/script/plugin-loader.js` 插件加载类，然后调用其中的 `add` 函数将插件添加到插件加载类的管理列表中。

### 任务入口中可用的注入的参数依赖

任务入口对外 `module.exports` 的形式是一个函数生成器，参数列表可以使用一系列注册的依赖参数。

* gulp 即gulp
* taskName 任务名
* console 命令行
* params 项目参数
* config 全局配置
* errorHandler 错误处理器

### 任务入口脚本基本思路

函数生成器返回一个用于 gulp 任务的处理函数，参数为完成任务时的 done 回调函数。

任务入口脚本调用任务插件，通过 `gulp.src()`、`gulp.pipe()`、`gulp.on('end', ...)` 处理任务流程，过程中可以调用 `console.log` 等函数输出相关信息。

任务结束后执行 `done()` 即可。

### 任务插件具体处理方式

任务插件通过 `through2` 处理 `gulp` 文件流中的文件，将处理完成的内容交给任务入口脚本，给下一步任务使用。

任务具体逻辑在插件中实现，对于任务入口脚本尽可能相对透明。

### 完成

完成上述步骤后，工具中勾选开启任务，即可执行相应任务逻辑了。