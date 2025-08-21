// devtools.js
// 这个脚本的唯一工作就是创建面板。

try {
  chrome.devtools.panels.create(
    "API \u63a5\u53e3\u76d1\u542c\u5668", // "API 接口监听器" 的 Unicode 编码
    "icons/icon16.png",
    "panel.html",
    null
  );
} catch (e) {
  console.error(e);
}
