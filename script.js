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