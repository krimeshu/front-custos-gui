(function () {
    var str = ['<em>write here from: "#from#"</em><br/><br/>'];

    // 这样就可以将文件内容并入行内字符串
    var fileContent = '#include("../js/bundle-entry.js", {"_inlineString": true})';

    str.push('<strong>bundle-entry.js</strong>:<br/><pre><code>');
    str.push(fileContent);
    str.push('</code></pre>');

    document.write(str.join(''));
})();