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
        groups.unshift(((num >> BigInt(i * 16)) & 0xffffn).toString(16));
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
       // 數字轉時間
       const date = new Date(parseInt(val) * (val.length === 10 ? 1000 : 1));
       resBox.innerHTML = `<span class="string">"${date.toLocaleString()}"</span>`;
   } else {
       // 時間轉數字
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