#!/usr/bin/env node
/* =====================================================================
   APOCALIPSIS TrueRMS — Servidor LAN (sin dependencias, sin internet)
   Uso:   node servidor-lan.js            (puerto 8080)
          node servidor-lan.js 3000       (otro puerto)
   Poné este archivo en la misma carpeta que apocalipsis-truerms.html.
   Todos (incluido quien lo ejecuta) entran desde el navegador a la
   dirección que se muestra en la consola. No usa WebRTC: todo pasa por
   esta PC, así que funciona aunque la conexión directa entre PCs falle.
   ===================================================================== */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const PORT = +process.argv[2] || 8080;
const GAME = ['apocalipsis-truerms.html', 'index.html'].map(f => path.join(__dirname, f)).find(f => fs.existsSync(f));
const ips = () => Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/info') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ips: ips(), port: PORT })); return; }
  if (u.pathname === '/' || u.pathname.endsWith('.html')) {
    if (!GAME) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('No encuentro apocalipsis-truerms.html en la carpeta del servidor.'); return; }
    const html = fs.readFileSync(GAME, 'utf8').replace('<head>', '<head><script>window.TRUERMS_WS=true</script>');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(html); return;
  }
  res.writeHead(404); res.end();
});

/* ------------------------ WebSocket mínimo (RFC 6455) ------------------------ */
function frame(str, op = 1) {
  const p = Buffer.from(str); let h;
  if (p.length < 126) h = Buffer.from([0x80 | op, p.length]);
  else if (p.length < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(p.length, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(p.length), 2); }
  return Buffer.concat([h, p]);
}
function makeWS(sock, onText, onClose) {
  let buf = Buffer.alloc(0), frag = [], closed = false;
  const ws = {
    send(s) { if (!closed && sock.writable) sock.write(frame(s)); },
    close() { if (closed) return; closed = true; try { sock.end(frame('', 8)); } catch (e) { } onClose(); },
  };
  sock.setNoDelay(true);
  sock.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (; ;) {
      if (buf.length < 2) break;
      const b0 = buf[0], b1 = buf[1], fin = b0 & 0x80, op = b0 & 0x0f, masked = b1 & 0x80;
      let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const total = off + (masked ? 4 : 0) + len; if (buf.length < total) break;
      let pl = buf.subarray(off + (masked ? 4 : 0), total);
      if (masked) { const m = buf.subarray(off, off + 4); pl = Buffer.from(pl); for (let i = 0; i < pl.length; i++) pl[i] ^= m[i & 3]; }
      buf = buf.subarray(total);
      if (op === 8) { ws.close(); return; }
      if (op === 9) { if (sock.writable) sock.write(Buffer.concat([Buffer.from([0x8A, pl.length]), pl])); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 0) { frag.push(pl); if (fin) { const s = Buffer.concat(frag).toString('utf8'); frag = []; try { onText(s); } catch (e) { console.error(e); } } }
    }
  });
  sock.on('close', () => { if (!closed) { closed = true; onClose(); } });
  sock.on('error', () => { });
  return ws;
}

/* ------------------------------- SALAS ------------------------------- */
const rooms = new Map(); let nextId = 1;
server.on('upgrade', (req, sock) => {
  const u = new URL(req.url, 'http://x'), key = req.headers['sec-websocket-key'];
  if (u.pathname !== '/ws' || !key) { sock.destroy(); return; }
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  const role = u.searchParams.get('role'), code = u.searchParams.get('code') || '';
  if (role === 'host') {
    if (rooms.has(code)) { const w = makeWS(sock, () => { }, () => { }); w.send(JSON.stringify({ sys: 'taken' })); w.close(); return; }
    const room = { host: null, clients: new Map() };
    room.host = makeWS(sock, (s) => {
      const m = JSON.parse(s);
      if (m.kick !== undefined) { const c = room.clients.get(m.kick); if (c) c.close(); return; }
      const payload = JSON.stringify(m.d);
      if (m.to === '*') { for (const [id, c] of room.clients) if (id !== m.ex) c.send(payload); }
      else { const c = room.clients.get(m.to); if (c) c.send(payload); }
    }, () => { rooms.delete(code); for (const c of room.clients.values()) c.close(); console.log(`[sala ${code}] cerrada`); });
    rooms.set(code, room); room.host.send(JSON.stringify({ sys: 'ok' }));
    console.log(`[sala ${code}] creada`);
  } else {
    const room = rooms.get(code);
    if (!room) { const w = makeWS(sock, () => { }, () => { }); w.send(JSON.stringify({ sys: 'noroom' })); w.close(); return; }
    const id = nextId++;
    const c = makeWS(sock, (s) => room.host.send('{"from":' + id + ',"d":' + s + '}'), () => { if (room.clients.delete(id)) room.host.send(JSON.stringify({ sys: 'leave', id })); console.log(`[sala ${code}] salió el jugador #${id}`); });
    room.clients.set(id, c); c.send(JSON.stringify({ sys: 'ok' })); room.host.send(JSON.stringify({ sys: 'join', id }));
    console.log(`[sala ${code}] entró el jugador #${id} (${sock.remoteAddress})`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  APOCALIPSIS TrueRMS — servidor LAN activo\n');
  console.log(`  En esta PC:        http://localhost:${PORT}`);
  for (const ip of ips()) console.log(`  Desde otras PCs:   http://${ip}:${PORT}`);
  if (!GAME) console.log('\n  ¡OJO! No encuentro apocalipsis-truerms.html en esta carpeta.');
  console.log('\n  Si Windows pregunta por el firewall, permití el acceso en "Redes privadas".');
  console.log('  Cerrá esta ventana (o Ctrl+C) para apagar el servidor.\n');
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `El puerto ${PORT} está ocupado. Probá: node servidor-lan.js 3000` : e); process.exit(1); });
