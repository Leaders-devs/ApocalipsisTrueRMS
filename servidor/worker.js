/* Apocalipsis TrueRMS — servidor de salas (Cloudflare Worker + Durable Object)
   Reenvía los mensajes entre el host y los jugadores cuando la conexión directa (WebRTC) no anda.
   Ruta: wss://<tu-worker>/room/<CODIGO>?role=host   |   ?role=join&id=<id>
   © 2026 Leaders Devs. Todos los derechos reservados. */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/(\d{4})$/);
    if (!m) return new Response('Apocalipsis TrueRMS · servidor de salas OK', { headers: { 'access-control-allow-origin': '*' } });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se espera WebSocket', { status: 426 });
    const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1]));
    return stub.fetch(req);
  },
};

export class Room {
  constructor(state) { this.state = state; this.host = null; this.clients = new Map(); }
  async fetch(req) {
    const url = new URL(req.url), role = url.searchParams.get('role'), id = (url.searchParams.get('id') || '').slice(0, 24);
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    if (role === 'host') {
      if (this.host) { try { this.host.close(4009, 'reemplazado'); } catch (e) { } }   // un host nuevo con el mismo código reemplaza al viejo
      this.host = server;
      server.addEventListener('message', e => this.fromHost(e.data));
      server.addEventListener('close', () => { if (this.host === server) { this.host = null; for (const c of this.clients.values()) try { c.close(4004, 'el host se fue'); } catch (e) { } this.clients.clear(); } });
      server.send(JSON.stringify({ t: 'ok' }));
    } else {
      if (!this.host || !id) { server.send(JSON.stringify({ t: 'nohost' })); server.close(4004, 'no existe la sala'); return new Response(null, { status: 101, webSocket: client }); }
      const old = this.clients.get(id); if (old) try { old.close(4009, 'reemplazado'); } catch (e) { }
      this.clients.set(id, server);
      server.addEventListener('message', e => { if (this.host) try { this.host.send(JSON.stringify({ t: 'd', from: id, d: e.data })); } catch (x) { } });
      server.addEventListener('close', () => { if (this.clients.get(id) === server) { this.clients.delete(id); if (this.host) try { this.host.send(JSON.stringify({ t: 'close', from: id })); } catch (x) { } } });
      server.send(JSON.stringify({ t: 'ok' }));
      try { this.host.send(JSON.stringify({ t: 'open', from: id })); } catch (x) { }
    }
    return new Response(null, { status: 101, webSocket: client });
  }
  // mensajes del host: { to: id | '*', ex?: id, d: '<json>' }
  fromHost(raw) {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.to === '*') { for (const [id, c] of this.clients) if (id !== m.ex) try { c.send(m.d); } catch (e) { } }
    else if (m.kick) { const c = this.clients.get(m.to); if (c) try { c.close(4001, 'desconectado'); } catch (e) { } }
    else { const c = this.clients.get(m.to); if (c) try { c.send(m.d); } catch (e) { } }
  }
}
