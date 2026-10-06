const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

// the only piece of state this whole app needs
let state = { opened: false };

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'لازم تحط ADMIN_PASSWORD في Variables على Railway' });
  }
  if (req.header('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'باسورد غلط' });
  }
  next();
}

app.get('/api/state', (req, res) => res.json(state));

app.get('/api/admin/verify', requireAdmin, (req, res) => res.json({ ok: true }));

app.post('/api/admin/login', (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'لازم تحط ADMIN_PASSWORD في Variables على Railway' });
  }
  if ((req.body || {}).password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'باسورد غلط' });
  }
  res.json({ ok: true });
});

app.post('/api/admin/toggle', requireAdmin, (req, res) => {
  state.opened = !state.opened;
  io.emit('state-updated', state);
  res.json(state);
});

app.post('/api/admin/set', requireAdmin, (req, res) => {
  state.opened = !!(req.body || {}).opened;
  io.emit('state-updated', state);
  res.json(state);
});

// admin page lives at /admin (not linked from the public QR page)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

io.on('connection', (socket) => {
  socket.emit('state-updated', state);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('بوابة الجمهور شغالة على بورت ' + PORT));
