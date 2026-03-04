// Quick E2E admission test script
// Usage: node client/scripts/test_admission.js

const { io } = require('socket.io-client');

const API = 'http://localhost:5000/api';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function http(path, opts = {}) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(JSON.stringify({ status: res.status, data }));
  return data;
}

async function main() {
  try {
    console.log('Registering host...');
    const hostEmail = `host_${Date.now()}@test.local`;
    const p1 = await http('/auth/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: 'Host Tester', email: hostEmail, password: 'Password123!' }) });
    const hostToken = p1.accessToken;
    console.log('Host token:', !!hostToken);

    console.log('Registering participant...');
    const partEmail = `part_${Date.now()}@test.local`;
    const p2 = await http('/auth/register', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: 'Part Tester', email: partEmail, password: 'Password123!' }) });
    const partToken = p2.accessToken;
    console.log('Participant token:', !!partToken);

    // Host creates session
    console.log('Host creating session...');
    const sessionResp = await http('/sessions', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${hostToken}` }, body: JSON.stringify({ title: 'E2E Test' }) });
    const session = sessionResp.session;
    console.log('Session created:', session.id, session.roomCode);

    // Host connects socket
    console.log('Host connecting socket...');
    const hostSocket = io('http://localhost:5000', { auth: { token: hostToken }, transports: ['websocket'] });

    hostSocket.on('connect', () => console.log('Host socket connected:', hostSocket.id));
    hostSocket.on('room:join-request', (data) => {
      console.log('Host received join request:', data);
      // Admit immediately
      hostSocket.emit('room:admit', { requestSocketId: data.requestSocketId, roomId: session.id });
    });

    hostSocket.on('room:joined', (d) => console.log('Host got room:joined', d));

    // Host joins room (becomes host)
    await new Promise(res => hostSocket.once('connect', res));
    hostSocket.emit('room:join', { roomId: session.id, sessionId: session.id });

    // Participant connects socket and attempts to join
    console.log('Participant connecting socket...');
    const partSocket = io('http://localhost:5000', { auth: { token: partToken }, transports: ['websocket'] });
    partSocket.on('connect', () => console.log('Part socket connected:', partSocket.id));
    partSocket.on('room:waiting-admission', (d) => console.log('Participant waiting for admission', d));
    partSocket.on('room:admitted', (d) => console.log('Participant admitted', d));
    partSocket.on('room:rejected', (d) => console.log('Participant rejected', d));
    partSocket.on('room:joined', (d) => console.log('Participant joined room:', d));

    await new Promise(res => partSocket.once('connect', res));
    console.log('Participant emitting room:join');
    partSocket.emit('room:join', { roomId: session.id, sessionId: session.id });

    // Wait a bit for events to flow
    await sleep(3000);

    // Cleanup
    hostSocket.disconnect();
    partSocket.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('E2E test error:', err);
    process.exit(1);
  }
}

main();
