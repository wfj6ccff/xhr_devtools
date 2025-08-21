<!-- 项目徽章区域 -->
<p align="left">
  <img src="https://img.shields.io/badge/Language-JavaScript-yellow?style=flat-square" alt="JavaScript">
  <img src="https://img.shields.io/badge/Chrome%20Extension-%F0%9F%94%8E-blue?style=flat-square" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/DevTools%20API-%F0%9F%94%A7-brightgreen?style=flat-square" alt="DevTools API">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

# API 接口监听器（xhr_devtools）

一个为开发者设计的安全、无侵入式 Chrome 浏览器扩展，用于监控特定 API 网络响应，并支持将数据转发到可配置端点。  
本工具基于 DevTools 面板开发，保证在任何网站运行时都不影响页面功能和样式，带来高效、稳定的网络请求监控体验。

---

## 特性概览

- **无侵入式监控**：作为 DevTools 面板运行，绝不影响目标页面性能、DOM 或全局变量。
- **精准 URL 匹配**：支持部分关键字匹配，轻松捕获目标请求。
- **多样的数据转发模式**：
  - 自动：捕获后自动发送到指定服务端。
  - 手动：由用户决定何时发送。
  - 仅显示：仅捕获显示，不发送。
- **自定义标签**：发送时可附加自定义 Tag，便于后端分类处理。
- **一键复制**：快速复制捕获到的 JSON 响应数据。

---

## 核心架构优势

与传统 content_script 注入方式不同，本扩展采用 Chrome 官方推荐的 DevTools API，具备以下优势：

1. **安全性**：运行在隔离沙箱中，避免与页面冲突。
2. **稳定性**：依赖浏览器底层接口，受目标网站/浏览器版本变动影响极小。
3. **简洁性**：所有功能集中在开发者工具面板，无需复杂消息传递。

---

## 安装指南

1. 下载本项目，或 `git clone` 到本地。
2. 打开 Chrome，访问 `chrome://extensions/`。
3. 开启右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择本项目根目录。

---

## 使用方法

1. 在任何网页按 <kbd>F12</kbd> 或右键选择“检查”打开开发者工具。
2. 找到并点击顶部的“API 监听器”面板。
3. 在配置区填写：
   - 监听 URL：目标 API 的部分或完整地址
   - 发送 URL：接收数据的后端接口地址
   - 名称标签 Tag：附加到发送 URL 上的参数
4. 选择发送模式（自动/手动/仅显示）。
5. 点击“开始监听”。
6. 当网页发出匹配请求后，响应数据会显示在“捕获的数据”区域。
7. 可手动发送/复制 JSON 内容。

---

## 贡献指南

欢迎提交 Issue 或 Pull Request 改进本项目。

---

## 许可证

MIT License

---

## 联系方式

如果有建议或问题，欢迎通过 [GitHub Issues](https://github.com/wfj6ccff/xhr_devtools/issues) 联系我们。
