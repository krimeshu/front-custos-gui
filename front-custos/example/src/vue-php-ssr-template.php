<!DOCTYPE html>
<html lang="zh-cmn-Hans">
<head>
    <meta charset="utf-8"/>
    <title>测试 Vue-PHP 服务端模板</title>
</head>
<body>
    <?php $list = array(
        array("text" => "墓王尼特"),
        array("text" => "魔女伊扎里斯"),
        array("text" => "神王葛温"),
        array("text" => "不知名的矮人")
    ); ?>
    <ul id="list">
        <vue-php-ssr-template>
            <li v-for="(id, item) in list" 
                @click="showItemId" 
                data-id="{{id}}">
                <span>{{item.text}}</span>
            </li>
        </vue-php-ssr-template>
    </ul>
    <script src="./js/vue-php-ssr-template.js"></script>
</body>
</html>