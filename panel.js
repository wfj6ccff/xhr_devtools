// panel.js - The brain of the operation.
// This runs in the sandboxed environment of the DevTools panel.

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const targetUrlInput = document.getElementById('target-url-input');
    const sendUrlInput = document.getElementById('send-url-input');
    const startBtn = document.getElementById('start-monitoring');
    const statusEl = document.getElementById('status');
    const jsonContentEl = document.getElementById('json-content');

    // --- State ---
    let isMonitoring = false;
    let config = {
        targetUrl: '',
        sendUrl: ''
    };

    // --- Core Logic ---

    /**
     * The official, non-invasive way to listen to network requests.
     * This is the heart of the extension.
     */
    chrome.devtools.network.onRequestFinished.addListener(async (request) => {
        // Ignore if not monitoring or if the URL doesn't match our target.
        if (!isMonitoring || !config.targetUrl || !request.request.url.includes(config.targetUrl)) {
            return;
        }

        // request.getContent is the safe, asynchronous way to get the response body.
        request.getContent((content, encoding) => {
            if (!content) {
                updateJsonContent({ error: "Response has no content." });
                return;
            }

            try {
                const json = JSON.parse(content);
                updateJsonContent(json); // Display data in our panel
                sendData(json);        // Forward data to the configured endpoint
            } catch (e) {
                updateJsonContent({ error: "Failed to parse response as JSON.", originalContent: content });
            }
        });
    });

    /**
     * Sends the captured data to the user-configured endpoint.
     * @param {object} data The JSON data to send.
     */
    async function sendData(data) {
        if (!config.sendUrl) {
            return; // Do nothing if no send URL is configured.
        }

        try {
            const response = await fetch(config.sendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error(`Failed to send data: HTTP ${response.status} ${response.statusText}`);
            }
        } catch (e) {
            console.error("Error sending data:", e);
        }
    }

    // --- UI and State Management ---

    function toggleMonitoring() {
        isMonitoring = !isMonitoring;
        updateUI();
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
        chrome.storage.local.set({ 'api-monitor-config': config });
    }

    async function loadConfig() {
        const result = await chrome.storage.local.get('api-monitor-config');
        if (result && result['api-monitor-config']) {
            config = result['api-monitor-config'];
            targetUrlInput.value = config.targetUrl || '';
            sendUrlInput.value = config.sendUrl || '';
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener('click', toggleMonitoring);
    targetUrlInput.addEventListener('change', saveConfig);
    sendUrlInput.addEventListener('change', saveConfig);

    // --- Initialization ---
    loadConfig();
    updateUI();
});
