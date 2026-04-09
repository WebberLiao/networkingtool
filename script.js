// 工具切換
function showTool(toolId) {
   document.querySelectorAll('.tool-section').forEach(s => s.style.display = 'none');
   document.getElementById(toolId).style.display = 'block';
   
   document.querySelectorAll('.activity-bar .icon').forEach(i => i.classList.remove('active'));
   event.currentTarget.classList.add('active');
}

// 數字轉 IPv4
function doIpConv() {
   const val = document.getElementById('num-input').value;
   if(!val) return;
   const num = parseInt(val);
   const ip = [
       (num >>> 24) & 0xff,
       (num >>> 16) & 0xff,
       (num >>> 8) & 0xff,
       num & 0xff
   ].join('.');
   document.getElementById('ip-res').innerText = `"${ip}"`;
}

// Subnet Calculator
function doSubnet() {
   const ip = document.getElementById('sn-ip').value;
   const cidr = parseInt(document.getElementById('sn-cidr').value);
   
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

// 自動更新當前時間戳
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
// 綁定事件
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