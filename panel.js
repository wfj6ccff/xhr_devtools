// panel.js - 核心逻辑脚本，现在所有面向用户的文本都是中文。
// 运行在 DevTools 面板的沙箱环境中。

document.addEventListener('DOMContentLoaded', () => {
    // --- UI 元素 ---
    const targetUrlInput = document.getElementById('target-url-input');
    const sendUrlInput = document.getElementById('send-url-input');
    const tagInput = document.getElementById('tag-input');
    const startBtn = document.getElementById('start-monitoring');
    const statusEl = document.getElementById('status');
    const jsonContentEl = document.getElementById('json-content');
    const dataActionsEl = document.getElementById('data-actions');
    const sendModeRadios = document.querySelectorAll('input[name="send-mode"]');

    // --- 状态 ---
    let isMonitoring = false;
    let capturedJson = null; // 保存最后捕获到的JSON
    let config = {
        targetUrl: '',
        sendUrl: '',
        tag: '',
        sendMode: 'cancel' // 'auto', 'manual', 'cancel'
    };

    // --- 核心逻辑 ---

    /**
     * 使用官方、无侵入的方式监听网络请求。
     * 这是扩展的心脏。
     */
    chrome.devtools.network.onRequestFinished.addListener(async (request) => {
        // 如果未在监听，或URL不匹配，则忽略。
        if (!isMonitoring || !config.targetUrl || !request.request.url.includes(config.targetUrl)) {
            return;
        }

        // request.getContent 是安全地获取响应体的异步方法。
        request.getContent((content) => {
            if (!content) {
                updateJsonContent({ error: "响应体为空。" });
                return;
            }
            try {
                const json = JSON.parse(content);
                capturedJson = json; // 保存数据
                updateJsonContent(json);
                renderActionButtons();

                if (config.sendMode === 'auto') {
                    sendData(); // 自动发送时没有事件对象
                }
            } catch (e) {
                capturedJson = null;
                updateJsonContent({ error: "无法将响应解析为JSON。", originalContent: content });
                renderActionButtons();
            }
        });
    });

    // --- 操作函数 ---

    /**
     * 修正：sendData 现在可以接收一个事件对象，以便为手动发送提供UI反馈。
     * 在自动发送时，它会调用一个新的通知函数。
     */
    async function sendData(event) {
        const button = event ? event.target : null;

        if (!capturedJson) {
            if (button) showButtonFeedback(button, "无数据", false);
            return;
        }
        if (!config.sendUrl) {
            if (button) showButtonFeedback(button, "URL未配置", false);
            return;
        }

        let url = config.sendUrl;
        if (config.tag) {
            // 将标签作为查询参数附加到URL上
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}tag=${encodeURIComponent(config.tag)}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(capturedJson)
            });
            if (!response.ok) {
                console.error(`数据发送失败: HTTP ${response.status} ${response.statusText}`);
                if (button) {
                    showButtonFeedback(button, `失败: ${response.status}`, false);
                } else {
                    showAutoSendNotification(`自动发送失败: ${response.status}`, false);
                }
            } else {
                console.log("数据发送成功。");
                if (button) {
                    showButtonFeedback(button, "发送成功!", true);
                } else {
                    showAutoSendNotification("自动发送成功!", true);
                }
            }
        } catch (e) {
            console.error("发送数据时出错:", e);
            if (button) {
                showButtonFeedback(button, "发送错误", false);
            } else {
                showAutoSendNotification("自动发送错误", false);
            }
        }
    }

    /**
     * 修正：copyJson 现在接收事件对象，以便在按钮上显示反馈。
     */
    function copyJson(event) {
        const button = event.target;
        if (!capturedJson) {
            showButtonFeedback(button, "无数据", false);
            return;
        }
        const jsonString = JSON.stringify(capturedJson, null, 2);

        const textarea = document.createElement('textarea');
        textarea.value = jsonString;
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showButtonFeedback(button, "已复制!", true);
            } else {
                throw new Error('复制命令执行失败');
            }
        } catch (err) {
            console.error('复制JSON失败: ', err);
            showButtonFeedback(button, "复制失败", false);
        } finally {
            document.body.removeChild(textarea);
        }
    }


    // --- UI 和状态管理 ---

    /**
     * 新增：一个用于自动发送模式的非阻塞通知。
     */
    function showAutoSendNotification(message, isSuccess) {
        const notification = document.createElement('div');
        notification.className = `auto-send-notification ${isSuccess ? 'success' : 'error'}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000); // 3秒后移除
    }

    /**
     * 修正：一个通用的函数，用于在按钮上显示临时反馈。
     * @param {HTMLElement} button - 要修改的按钮元素。
     * @param {string} message - 要显示的临时消息。
     * @param {boolean} isSuccess - 操作是否成功，决定了按钮的颜色。
     */
    function showButtonFeedback(button, message, isSuccess) {
        const originalText = button.textContent;
        button.textContent = message;
        button.classList.add(isSuccess ? 'success' : 'error');
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('success', 'error');
            button.disabled = false;
        }, 2000); // 2秒后恢复
    }

    function renderActionButtons() {
        dataActionsEl.innerHTML = ''; // 清空旧按钮
        if (!capturedJson) return;

        // 为所有模式添加“复制”按钮
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '复制JSON';
        copyBtn.className = 'btn-action';
        copyBtn.addEventListener('click', copyJson); // 事件处理器现在会自动传递事件对象
        dataActionsEl.appendChild(copyBtn);

        // 仅在“手动”模式下添加“发送”按钮
        if (config.sendMode === 'manual') {
            const manualSendBtn = document.createElement('button');
            manualSendBtn.textContent = '发送数据';
            manualSendBtn.className = 'btn-manual-send';
            manualSendBtn.addEventListener('click', sendData); // 事件处理器现在会自动传递事件对象
            dataActionsEl.appendChild(manualSendBtn);
        }
    }

    function toggleMonitoring() {
        isMonitoring = !isMonitoring;
        if (!isMonitoring) {
            capturedJson = null; // 停止时清空数据
        }
        updateUI();
        renderActionButtons();
    }

    function updateUI() {
        if (isMonitoring) {
            startBtn.textContent = '停止监听';
            startBtn.className = 'stop';
            statusEl.textContent = '● 监听中';
            statusEl.className = 'on';
            jsonContentEl.textContent = '正在监听中，等待匹配的API请求...';
        } else {
            startBtn.textContent = '开始监听';
            startBtn.className = 'start';
            statusEl.textContent = '● 未监听';
            statusEl.className = 'off';
            jsonContentEl.textContent = '请点击“开始监听”以捕获数据。';
        }
    }

    function updateJsonContent(json) {
        jsonContentEl.textContent = JSON.stringify(json, null, 2);
    }

    function saveConfig() {
        config.targetUrl = targetUrlInput.value.trim();
        config.sendUrl = sendUrlInput.value.trim();
        config.tag = tagInput.value.trim();
        const selectedMode = document.querySelector('input[name="send-mode"]:checked');
        config.sendMode = selectedMode ? selectedMode.value : 'cancel';

        chrome.storage.local.set({ 'api-monitor-config-cn': config });
        renderActionButtons(); // 如果模式改变，重新渲染按钮
    }

    async function loadConfig() {
        const result = await chrome.storage.local.get('api-monitor-config-cn');
        if (result && result['api-monitor-config-cn']) {
            config = result['api-monitor-config-cn'];
            targetUrlInput.value = config.targetUrl || '';
            sendUrlInput.value = config.sendUrl || '';
            tagInput.value = config.tag || '';
            const modeRadio = document.querySelector(`input[name="send-mode"][value="${config.sendMode}"]`);
            if (modeRadio) {
                modeRadio.checked = true;
            }
        }
    }

    // --- 事件监听器 ---
    startBtn.addEventListener('click', toggleMonitoring);
    targetUrlInput.addEventListener('input', saveConfig);
    sendUrlInput.addEventListener('input', saveConfig);
    tagInput.addEventListener('input', saveConfig);
    sendModeRadios.forEach(radio => radio.addEventListener('change', saveConfig));

    // --- 初始化 ---
    loadConfig();
    updateUI();
});
