// Tool change
function showTool(toolId) {
   document.querySelectorAll('.tool-section').forEach(s => s.style.display = 'none');
   document.getElementById(toolId).style.display = 'block';
   
   document.querySelectorAll('.activity-bar .icon').forEach(i => i.classList.remove('active'));
   event.currentTarget.classList.add('active');
}

// Convert number to IPv4
function doIpConv() {
   const val = document.getElementById('num-input').value;
   if(!val) return;
   const num = parseInt(val);
   if (num > 4294967295) 
   {
     document.getElementById('ip-res').innerText = '"Number too large for IPv4"';
     return;
   }
   const ip = [
       (num >>> 24) & 0xff,
       (num >>> 16) & 0xff,
       (num >>> 8) & 0xff,
       num & 0xff
   ].join('.');
   document.getElementById('ip-res').innerText = `"${ip}"`;
}

// Convert Hex to IPv4
function doHexToIP() {
    const hex = document.getElementById('hex-hex').value.trim().replace(/^0x/i, '');
    const resEl = document.getElementById('hex-ip');
    if (!/^[0-9a-fA-F]{8}$/.test(hex)) {
        resEl.innerText = '"Invalid hex (need 8 hex chars)"';
        return;
    }
    const num = parseInt(hex, 16);
    const ip = [
        (num >>> 24) & 0xff,
        (num >>> 16) & 0xff,
        (num >>> 8)  & 0xff,
        num & 0xff
    ].join('.');
    resEl.innerText = `"${ip}"`;
}

// Convert IPv4 to Hex
function doIpToHex() {
    const ip = document.getElementById('ip-input').value.trim();
    const resEl = document.getElementById('ip-hex');
    const parts = ip.split('.');
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p === '' || +p < 0 || +p > 255)) {
        resEl.innerText = '"Invalid IPv4 address"';
        return;
    }
    const num = ((+parts[0] << 24) | (+parts[1] << 16) | (+parts[2] << 8) | +parts[3]) >>> 0;
    resEl.innerText = `"0x${num.toString(16).toUpperCase().padStart(8, '0')}"`;
}


// Subnet Calculator
function doSubnet() {
   const ip = document.getElementById('sn-ip').value;
   const cidr = parseInt(document.getElementById('sn-cidr').value);
   if (cidr < 0 || cidr > 32) {
       document.getElementById('sn-res').innerText = "Invalid CIDR (0-32)";
       return;
   }
   
   const ipParts = ip.split('.').map(Number);
   const ipNum = (ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3]) >>> 0;
   const maskNum = (0xffffffff << (32 - cidr)) >>> 0;
   const netNum = (ipNum & maskNum) >>> 0;
   const broadNum = (netNum | ~maskNum) >>> 0;

   const res = `
Network:    ${longToIp(netNum)}
Netmask:    ${longToIp(maskNum)}
Broadcast:  ${longToIp(broadNum)}
Max Hosts:  ${cidr <= 30 ? (broadNum - netNum - 1) : 0}`;
   
   document.getElementById('sn-res').innerText = res;
}

function longToIp(num) {
   return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
}

// IPv6 Subnet Calculator
function doSubnetIPv6() {
    const input = document.getElementById('sn6-ip').value.trim();
    const prefix = parseInt(document.getElementById('sn6-prefix').value);
    const resEl = document.getElementById('sn6-res');

    if (isNaN(prefix) || prefix < 0 || prefix > 128) {
        resEl.innerText = 'Invalid prefix length (0-128)';
        return;
    }

    let addr;
    try { addr = parseIPv6(input); }
    catch(e) { resEl.innerText = 'Invalid IPv6 address'; return; }

    const full = 128n;
    const p = BigInt(prefix);
    const hostBits = full - p;
    const mask = prefix === 0 ? 0n : ((1n << full) - 1n) ^ ((1n << hostBits) - 1n);
    const network = addr & mask;
    const lastAddr = network | ((1n << hostBits) - 1n);
    const total = 1n << hostBits;
    const totalStr = hostBits <= 40n ? total.toString() : `2^${hostBits}`;

    resEl.innerText =
`Network:  ${formatIPv6(network)}/${prefix}
First:    ${formatIPv6(network)}
Last:     ${formatIPv6(lastAddr)}
Total:    ${totalStr}`;
}

function parseIPv6(str) {
    const halves = str.split('::');
    if (halves.length > 2) throw new Error('Invalid');
    const left  = halves[0] ? halves[0].split(':') : [];
    const right = halves[1] ? halves[1].split(':') : [];
    const fill  = 8 - left.length - right.length;
    if (fill < 0 || (halves.length === 1 && left.length !== 8)) throw new Error('Invalid');
    const all = [...left, ...Array(halves.length === 2 ? fill : 0).fill('0'), ...right];
    if (all.length !== 8) throw new Error('Invalid');
    let result = 0n;
    for (const g of all) {
        const v = parseInt(g, 16);
        if (isNaN(v) || v < 0 || v > 0xffff) throw new Error('Invalid');
        result = (result << 16n) | BigInt(v);
    }
    return result;
}

function formatIPv6(num) {
    const groups = [];
    for (let i = 7; i >= 0; i--) {
        groups.push(((num >> BigInt(i * 16)) & 0xffffn).toString(16));
    }
    // Find longest zero run for :: compression
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    for (let i = 0; i < 8; i++) {
        if (groups[i] === '0') {
            if (curStart === -1) { curStart = i; curLen = 1; }
            else curLen++;
            if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
        } else { curStart = -1; curLen = 0; }
    }
    if (bestLen >= 2) {
        const l = groups.slice(0, bestStart).join(':');
        const r = groups.slice(bestStart + bestLen).join(':');
        return (l ? l + '::' : '::') + r;
    }
    return groups.join(':');
}

// MAC Formatter
function doMacFmt() {
   const raw = document.getElementById('mac-input').value;
   const sep = document.getElementById('mac-sep').value;
   const clean = raw.replace(/[^0-9a-fA-F]/g, '');
   if (clean.length === 12) {
       const formatted = clean.match(/.{2}/g).join(sep).toLowerCase();
       document.getElementById('mac-res').innerText = formatted;
   } else {
       document.getElementById('mac-res').innerText = "Invalid MAC Length";
   }
}

// Update current timestamp every second
setInterval(() => {
   const el = document.getElementById('current-ts');
   if(el) el.innerText = Math.floor(Date.now() / 1000);
}, 1000);
// 1. Unix Timestamp Converter
function convertTS() {
   const val = document.getElementById('ts-input').value.trim();
   const resBox = document.getElementById('ts-res');
   if (!val) return;
   if (!isNaN(val)) {
       // æ¸å­è½æé
       const date = new Date(parseInt(val) * (val.length === 10 ? 1000 : 1));
       resBox.innerHTML = `<span class="string">"${date.toLocaleString()}"</span>`;
   } else {
       // æéè½æ¸å­
       const ts = Math.floor(new Date(val).getTime() / 1000);
       resBox.innerHTML = isNaN(ts) ? "Invalid Date" : `<span class="vsc-green">${ts}</span>`;
   }
}
// 2. Regex Checking
function doRegex() {
   const pattern = document.getElementById('re-pattern').value;
   const text = document.getElementById('re-text').value;
   const resBox = document.getElementById('re-res');
   try {
       const re = new RegExp(pattern, 'g');
       const match = text.match(re);
       resBox.innerHTML = match
           ? `Matches: <span class="vsc-green">${JSON.stringify(match)}</span>`
           : `Matches: <span class="string">null</span>`;
   } catch (e) {
       resBox.innerHTML = `<span style="color: #f44747;">Invalid Regex</span>`;
   }
}
// Bind regex inputs
document.getElementById('re-pattern')?.addEventListener('input', doRegex);
document.getElementById('re-text')?.addEventListener('input', doRegex);
// 3. JSON Beautify
function beautifyJSON() {
   const input = document.getElementById('json-input').value;
   const resBox = document.getElementById('json-res');
   try {
       const obj = JSON.parse(input);
       resBox.innerText = JSON.stringify(obj, null, 4);
   } catch (e) {
       resBox.innerText = "Error: Invalid JSON";
   }
}
// 4. JSON to YAML
function jsonToYaml() {
   const input = document.getElementById('json-input').value;
   const resBox = document.getElementById('json-res');
   try {
       const obj = JSON.parse(input);
       resBox.innerText = jsyaml.dump(obj);
   } catch (e) {
       resBox.innerText = "Error: Invalid JSON for YAML conversion";
   }
}
// 5. URL Encode/Decode
function doUrlAction(type) {
   const input = document.getElementById('url-input').value;
   const resBox = document.getElementById('url-res');
   try {
       const res = (type === 'encode') ? encodeURIComponent(input) : decodeURIComponent(input);
       resBox.innerText = res;
   } catch (e) {
       resBox.innerText = "Error in URL operation";
   }
}

function doDiff() {
   const oldLines = document.getElementById('diff-old').value.split('\n');
   const newLines = document.getElementById('diff-new').value.split('\n');
   const output = document.getElementById('diff-output');
   const CONTEXT = 3;

   // Build LCS table
   const m = oldLines.length, n = newLines.length;
   const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
   for (let i = 1; i <= m; i++) {
       for (let j = 1; j <= n; j++) {
           dp[i][j] = oldLines[i-1] === newLines[j-1]
               ? dp[i-1][j-1] + 1
               : Math.max(dp[i-1][j], dp[i][j-1]);
       }
   }

   // Backtrack to produce diff ops
   const ops = [];
   let i = m, j = n;
   while (i > 0 || j > 0) {
       if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
           ops.push({ type: 'eq',  line: oldLines[i-1], oldN: i, newN: j }); i--; j--;
       } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
           ops.push({ type: 'ins', line: newLines[j-1], oldN: null, newN: j }); j--;
       } else {
           ops.push({ type: 'del', line: oldLines[i-1], oldN: i, newN: null }); i--;
       }
   }
   ops.reverse();

   // Mark which lines are within CONTEXT distance of a change
   const changed = ops.map(op => op.type !== 'eq');
   const inContext = ops.map((_, idx) => {
       if (changed[idx]) return true;
       for (let d = 1; d <= CONTEXT; d++) {
           if (changed[idx - d] || changed[idx + d]) return true;
       }
       return false;
   });

   const ln = n => `<span class="diff-ln">${n !== null ? n : ''}</span>`;
   let resultHtml = '';
   let lastShown = true;
   for (let k = 0; k < ops.length; k++) {
       const op = ops[k];
       if (!inContext[k]) {
           if (lastShown) {
               resultHtml += `<span class="diff-hunk">${ln(null)}${ln(null)}<span class="diff-content">@@ ... @@</span></span>\n`;
               lastShown = false;
           }
           continue;
       }
       lastShown = true;
       if (op.type === 'eq') {
           resultHtml += `<span class="diff-line">${ln(op.oldN)}${ln(op.newN)}<span class="diff-content">  ${escapeHtml(op.line)}</span></span>\n`;
       } else if (op.type === 'del') {
           resultHtml += `<span class="diff-removed">${ln(op.oldN)}${ln(null)}<span class="diff-content">- ${escapeHtml(op.line)}</span></span>\n`;
       } else {
           resultHtml += `<span class="diff-added">${ln(null)}${ln(op.newN)}<span class="diff-content">+ ${escapeHtml(op.line)}</span></span>\n`;
       }
   }
   output.innerHTML = resultHtml || '// No differences found.';
}
// Prevent HTML inject
function escapeHtml(text) {
   const div = document.createElement('div');
   div.textContent = text;
   return div.innerHTML;
}

/* AI Translate & Grammar Improvement */
// ========== AI Tools - Login & Translation ==========
// SHA-256 hash helper
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Expected credential hashes (SHA-256)
const AI_CRED_HASHES = {
    user: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    pass: '5f0a4ec58d66573c0b46e2656a75d6b988865702642ae08684a5391e287752bc'
};

// Login handler
async function doAiLogin() {
    const username = document.getElementById('ai-username').value.trim();
    const password = document.getElementById('ai-password').value;
    const errEl = document.getElementById('ai-login-err');

    if (!username || !password) {
        errEl.textContent = 'Error: Please enter both username and password.';
        errEl.style.display = 'block';
        return;
    }

    const userHash = await sha256(username);
    const passHash = await sha256(password);

    if (userHash === AI_CRED_HASHES.user && passHash === AI_CRED_HASHES.pass) {
        document.getElementById('ai-login-gate').style.display = 'none';
        document.getElementById('ai-main').style.display = 'block';
        errEl.style.display = 'none';
        // Load saved API key if exists
        const savedKey = localStorage.getItem('ai_apikey');
        if (savedKey) {
            document.getElementById('ai-apikey').value = savedKey;
        }
    } else {
        errEl.textContent = 'Error: Invalid credentials.';
        errEl.style.display = 'block';
    }
}

// Allow Enter key to trigger login
document.addEventListener('DOMContentLoaded', () => {
    const passField = document.getElementById('ai-password');
    if (passField) {
        passField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doAiLogin();
        });
    }
});

// Toggle API key visibility
function toggleApiKeyVisibility() {
    const input = document.getElementById('ai-apikey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Save API key to localStorage
function saveApiKey() {
    const key = document.getElementById('ai-apikey').value.trim();
    if (key) {
        localStorage.setItem('ai_apikey', key);
        alert('API Key saved.');
    }
}

// AI Translation via Claude API
async function doAiTranslate() {
    const apiKey = document.getElementById('ai-apikey').value.trim();
    const inputText = document.getElementById('ai-text-input').value.trim();
    const resultEl = document.getElementById('ai-result');
    const loadingEl = document.getElementById('ai-loading');
    const btn = document.getElementById('ai-translate-btn');

    if (!apiKey) {
        resultEl.innerHTML = '<span style="color:#f44747;">Error: Please enter an API Key.</span>';
        return;
    }
    if (!inputText) {
        resultEl.innerHTML = '<span style="color:#f44747;">Error: Please enter text to translate.</span>';
        return;
    }

    // Detect language direction
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(inputText);
    const systemPrompt = isChinese
        ? 'You are a professional translator and grammar expert. The user will provide text in Traditional Chinese. Please: 1) Translate it into natural, fluent English. 2) If there are grammar or expression issues in the original Chinese, point them out. Return the result in this format:\n\n**English Translation:**\n[translation]\n\n**Grammar Notes (if any):**\n[notes]'
        : 'You are a professional translator and grammar expert. The user will provide text in English. Please: 1) Translate it into natural, fluent Traditional Chinese (繁體中文). 2) If there are grammar or expression issues in the original English, point them out and provide a corrected version. Return the result in this format:\n\n**繁體中文翻譯:**\n[translation]\n\n**Grammar Notes / Corrected English (if any):**\n[notes]';

    // Show loading state
    btn.disabled = true;
    loadingEl.style.display = 'inline';
    resultEl.innerHTML = '<span class="code-comment">// Calling Claude API...</span>';

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [
                    { role: 'user', content: inputText }
                ],
                system: systemPrompt
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.content?.[0]?.text || 'No response received.';
        resultEl.innerHTML = `<pre style="white-space:pre-wrap; color:var(--vsc-green); margin:0;">${escapeHtml(content)}</pre>`;
    } catch (err) {
        resultEl.innerHTML = `<span style="color:#f44747;">Error: ${escapeHtml(err.message)}</span>`;
    } finally {
        btn.disabled = false;
        loadingEl.style.display = 'none';
    }
}
/* AI Translate & Grammar Improvement */