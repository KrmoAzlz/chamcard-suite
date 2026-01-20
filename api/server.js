import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultData = {
  config: {
    // Default fare in smallest unit (e.g. 1000 = 1,000 ل.س) — عدّل لاحقاً من لوحة الإدارة
    defaultFareId: 'FARE-STD',
    fares: {
      'FARE-STD': { id: 'FARE-STD', name: 'تعرفة عادية', amount: 2000 }
    }
  },
  validators: {
    // validatorId: { id, name, route, fareId, deviceKey, isActive, lastSeen }
  },
  cards: {
    // uid: { uid, status: 'active'|'blocked', notes, updatedAt }
  },
  customers: {
    // id: { id, name, phone, balance, status:'ACTIVE'|'BLOCKED', createdAt, updatedAt }
  },
  transactions: [
    // { id, createdAt, validatorId, method:'NFC'|'QR', fareId, amount, cardUid?, customerId?, status:'ok'|'fail', reason? }
  ],
  payouts: [
    // { id, createdAt, day, validatorId, amount, method:'cash'|'bank'|'other', note, adminUser }
  ],
  events: [
    // { id, type:'app_open', createdAt, actor:'customer'|'validator'|'admin', meta }
  ],
  audit: [
    // { id, createdAt, adminUser, action, targetType, targetId, reason, ip }
  ]
};

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, defaultData);
await db.read();
db.data ||= structuredClone(defaultData);
db.data.customers ||= {};
db.data.validators ||= {};
db.data.cards ||= {};
db.data.transactions ||= [];
db.data.payouts ||= [];
db.data.audit ||= [];
await db.write();

const app = express();
// Needed on Render/Railway/Fly etc so req.ip and rate-limit work correctly.
app.set('trust proxy', 1);

// =====================
// Helpers (safety + audit)
// =====================
const clean = (v) => String(v ?? "").trim();

function getIP(req) {
  const xf = req.headers['x-forwarded-for'];
  const raw = xf ? String(xf).split(',')[0] : (req.socket?.remoteAddress || '');
  const ip = String(raw).trim();
  return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
}

function audit(req, action, targetType, targetId, reason = '') {
  if (!db?.data?.audit) return;
  db.data.audit.push({
    id: nanoid(10),
    createdAt: now(),
    adminUser: req.adminUser || process.env.ADMIN_USER || 'superadmin',
    action,
    targetType,
    targetId,
    reason: String(reason || ''),
    ip: getIP(req)
  });
}


// =====================
// Admin hardening (single-admin MVP)
// =====================
// This project is meant to be tested “from your device only”.
// We add two additional layers in front of the existing x-admin-token:
// 1) IP allowlist via ADMIN_ALLOWED_IPS
// 2) HTTP Basic Auth via ADMIN_BASIC_USER / ADMIN_BASIC_PASS

const adminAllowedIPs = (process.env.ADMIN_ALLOWED_IPS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function normalizeIP(ipRaw) {
  const ip = String(ipRaw || '').trim();
  // Render/Node sometimes exposes IPv4 as ::ffff:1.2.3.4
  if (ip.startsWith('::ffff:')) return ip.slice('::ffff:'.length);
  return ip;
}

function getClientIP(req) {
  // trust proxy is enabled, so x-forwarded-for exists behind Render.
  const xf = req.headers['x-forwarded-for'];
  if (xf) return normalizeIP(String(xf).split(',')[0]);
  return normalizeIP(req.socket?.remoteAddress || '');
}

function adminIPGuard(req, res, next) {
  if (!adminAllowedIPs.length) {
    return res.status(403).type('text/plain').send('Admin IP not configured');
  }
  const ip = getClientIP(req);
  if (!adminAllowedIPs.includes(ip)) {
    return res.status(403).type('text/plain').send('Access denied');
  }
  next();
}

function basicAuth(req, res, next) {
  const user = process.env.ADMIN_BASIC_USER || '';
  const pass = process.env.ADMIN_BASIC_PASS || '';
  if (!user || !pass) {
    return res.status(403).type('text/plain').send('Admin Basic Auth not configured');
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ChamCard Admin"');
    return res.status(401).end();
  }

  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  const u = idx >= 0 ? decoded.slice(0, idx) : '';
  const p = idx >= 0 ? decoded.slice(idx + 1) : '';
  if (u !== user || p !== pass) return res.status(403).end();
  next();
}

function adminGuard(req, res, next) {
  adminIPGuard(req, res, () => basicAuth(req, res, next));
}

// IMPORTANT:
// - These guards ONLY apply to admin pages (/admin, /admin-html) and /api/admin/*
// - Validators + public APIs are NOT blocked by these guards.
// CORS:
// - Dev: allow all origins
// - Prod: set CORS_ORIGINS="https://admin.example.com,https://validator.example.com" etc.
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = corsOrigins.length
  ? { origin: corsOrigins, credentials: true }
  : { origin: true, credentials: true };

app.use(helmet({
  // لوحات Vite تستخدم HMR/WS في التطوير؛ لا نقفلها هنا.
  contentSecurityPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Protect admin surfaces (pages + admin API)
app.use('/admin', adminGuard);
app.use('/admin-html', adminGuard);
app.use('/api/admin', adminGuard);

// Serve the HTML admin bundle (for learning/prototyping)
const ADMIN_HTML_DIR = path.join(process.cwd(), 'admin-html');
if (fs.existsSync(ADMIN_HTML_DIR)) {
  app.use('/admin-html', express.static(ADMIN_HTML_DIR));
}

// Convenience routes (so you can just open /admin)
app.get('/admin', (req, res) => res.redirect('/admin-html/login.html'));
app.get('/admin/', (req, res) => res.redirect('/admin-html/login.html'));

// Rate limits (حماية أساسية ضد التخمين والسبام)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
const deviceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

const now = () => Date.now();
const dayKey = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

function requireAdmin(req, res, next) {
  // MVP: توكن بسيط عبر هيدر. لاحقاً JWT + 2FA.
  const token = req.header('x-admin-token');
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(403).json({ ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' });
  if (token !== expected) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  req.adminUser = process.env.ADMIN_USER || 'superadmin';
  next();
}

// Public health endpoints (مفيدة للنشر/المراقبة)
app.get('/', (req, res) => {
  res.type('text/plain').send('ChamCard API is running');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'chamcard-api', time: now() });
});

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, time: now() });
});

// ---------- Admin Helpers (HTML Admin Compatible) ----------
app.get('/api/admin/me', requireAdmin, adminLimiter, async (req, res) => {
  res.json({ ok: true, name: process.env.ADMIN_USER || 'superadmin', role: 'ADMIN' });
});

app.get('/api/admin/dashboard', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  const today = dayKey();
  const txToday = db.data.transactions.filter(t => (t.createdAt || 0) && dayKey(t.createdAt) === today);
  const okTxToday = txToday.filter(t => t.status === 'ok');
  const todayRevenue = okTxToday.reduce((s, t) => s + Number(t.amount || 0), 0);
  const todayExpense = 0;
  const netRevenue = todayRevenue - todayExpense;

  const dau = db.data.events.filter(e => e.type === 'app_open' && dayKey(e.createdAt) === today)
    .map(e => e.meta?.customerId || e.meta?.deviceId || e.id)
    .filter(Boolean);
  const uniqueDau = new Set(dau).size;

  const tenMin = 10 * 60 * 1000;
  const activeValidators = Object.values(db.data.validators).filter(v => v.lastSeen && (now() - v.lastSeen) <= tenMin).length;

  res.json({
    ok: true,
    todayRevenue,
    todayExpense,
    netRevenue,
    transactionsCount: txToday.length,
    dau: uniqueDau,
    activeValidators
  });
});

app.get('/api/admin/transactions', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  const list = [...db.data.transactions]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 500)
    .map(t => ({
      id: t.id,
      cardUid: t.cardUid || null,
      type: t.method || 'NFC',
      amount: Number(t.amount || 0),
      status: t.status === 'ok' ? 'SUCCESS' : 'FAIL',
      createdAt: t.createdAt || null
    }));
  res.json(list);
});

// =====================
// Accounting (admin)
// =====================
// الفكرة:
// - "الدخل" = مجموع عمليات OK (رحلات ناجحة) حسب كل Validator (باص/جهاز).
// - "الدفع" = سجل payouts يدوي يكتبه الادمن عند تسليم السائق/صاحب الباص حصته.
// - "المتبقي" = income - paid.

function isoDay(input) {
  const s = String(input || '').trim();
  if (!s) return dayKey();
  return s.slice(0, 10);
}

app.get('/api/admin/accounting/summary', requireAdmin, adminLimiter, async (req, res) => {
  const date = isoDay(req.query.date);
  await db.read();

  const tx = db.data.transactions.filter(t => (t.day || dayKey(t.createdAt)) === date && t.status === 'ok');
  const payouts = db.data.payouts.filter(p => p.day === date);

  const byValidator = {};
  for (const t of tx) {
    const vid = t.validatorId || 'UNKNOWN';
    byValidator[vid] ||= { validatorId: vid, validatorName: db.data.validators?.[vid]?.name || vid, income: 0, paid: 0, outstanding: 0 };
    byValidator[vid].income += Number(t.amount || 0);
  }
  for (const p of payouts) {
    const vid = p.validatorId || 'UNKNOWN';
    byValidator[vid] ||= { validatorId: vid, validatorName: db.data.validators?.[vid]?.name || vid, income: 0, paid: 0, outstanding: 0 };
    byValidator[vid].paid += Number(p.amount || 0);
  }

  const rows = Object.values(byValidator)
    .map(r => ({ ...r, outstanding: Number(r.income || 0) - Number(r.paid || 0) }))
    .sort((a, b) => (b.outstanding - a.outstanding) || (b.income - a.income));

  const totals = rows.reduce((acc, r) => {
    acc.income += Number(r.income || 0);
    acc.paid += Number(r.paid || 0);
    return acc;
  }, { income: 0, paid: 0 });
  totals.outstanding = totals.income - totals.paid;

  res.json({ ok: true, date, totals, rows, payouts: payouts.slice().reverse().slice(0, 500) });
});

app.post('/api/admin/accounting/payout', requireAdmin, adminLimiter, async (req, res) => {
  const validatorId = clean(String(req.body?.validatorId || ''));
  const amount = Number(req.body?.amount || 0);
  const method = clean(String(req.body?.method || 'cash')) || 'cash';
  const note = clean(String(req.body?.note || ''));
  const date = isoDay(req.body?.date);

  if (!validatorId) return res.status(400).json({ ok: false, error: 'validatorId_required' });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'amount_invalid' });

  await db.read();
  const id = `PAYOUT-${nanoid(10)}`;
  const rec = { id, createdAt: now(), day: date, validatorId, amount: Math.round(amount), method, note, adminUser: req.adminUser };
  db.data.payouts.push(rec);
  audit(req, 'ACCOUNTING_PAYOUT_CREATE', 'validator', validatorId, note || `amount=${rec.amount}`);
  await db.write();
  res.json({ ok: true, payout: rec });
});

app.get('/api/admin/audit', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  const list = [...db.data.audit]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 500)
    .map(a => ({
      adminName: a.adminUser,
      action: a.action,
      target: `${a.targetType}:${a.targetId}`,
      reason: a.reason,
      ip: a.ip,
      time: a.createdAt
    }));
  res.json(list);
});

app.get('/api/admin/customers', requireAdmin, adminLimiter, async (req, res) => {
  const q = String(req.query.query || '').trim();
  await db.read();
  const list = Object.values(db.data.customers);
  const filtered = q
    ? list.filter(c =>
        String(c.id).includes(q) ||
        String(c.name || '').includes(q) ||
        String(c.phone || '').includes(q)
      )
    : list;
  res.json(filtered.slice(0, 200));
});

app.post('/api/admin/customers/:id/adjust-balance', requireAdmin, adminLimiter, async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body || {};
  if (typeof amount !== 'number' || !isFinite(amount)) return res.status(400).json({ ok: false, error: 'INVALID_AMOUNT' });
  if (!reason || String(reason).trim().length < 4) return res.status(400).json({ ok: false, error: 'REASON_REQUIRED' });
  await db.read();
  const nowTs = now();
  const cust = db.data.customers[id] || {
    id,
    name: `Customer ${id}`,
    phone: '',
    balance: 0,
    status: 'ACTIVE',
    createdAt: nowTs,
    updatedAt: nowTs
  };
  cust.balance = Number(cust.balance || 0) + amount;
  cust.updatedAt = nowTs;
  db.data.customers[id] = cust;
  db.data.audit.push({
    id: nanoid(10),
    createdAt: nowTs,
    adminUser: process.env.ADMIN_USER || 'superadmin',
    action: 'ADJUST_BALANCE',
    targetType: 'customer',
    targetId: id,
    reason: String(reason),
    ip: req.ip
  });
  await db.write();
  res.json({ ok: true, customer: cust });
});

app.get('/api/admin/cards', requireAdmin, adminLimiter, async (req, res) => {
  const q = String(req.query.query || req.query.q || '').trim();
  await db.read();
  const list = Object.values(db.data.cards);
  const filtered = q ? list.filter(c => String(c.uid).includes(q) || String(c.status).includes(q) || String(c.notes||'').includes(q)) : list;
  // HTML admin expects: uid, customerId, fraudAttempts, status:'ACTIVE'|'BLOCKED'
  const out = filtered.slice(0, 200).map(c => ({
    uid: c.uid,
    customerId: c.customerId || '-',
    fraudAttempts: Number(c.fraudAttempts || 0),
    status: (c.status === 'blocked' ? 'BLOCKED' : 'ACTIVE')
  }));
  res.json(out);
});

app.post('/api/admin/cards/:uid/block', requireAdmin, adminLimiter, async (req, res) => {
  const { uid } = req.params;
  const { reason } = req.body || {};
  if (!reason || String(reason).trim().length < 4) return res.status(400).json({ ok: false, error: 'REASON_REQUIRED' });
  await db.read();
  const nowTs = now();
  const prev = db.data.cards[uid] || { uid };
  db.data.cards[uid] = { ...prev, uid, status: 'blocked', updatedAt: nowTs };
  db.data.audit.push({
    id: nanoid(10),
    createdAt: nowTs,
    adminUser: process.env.ADMIN_USER || 'superadmin',
    action: 'BLOCK_CARD',
    targetType: 'card',
    targetId: uid,
    reason: String(reason),
    ip: req.ip
  });
  await db.write();
  res.json({ ok: true });
});

app.post('/api/admin/cards/:uid/unblock', requireAdmin, adminLimiter, async (req, res) => {
  const { uid } = req.params;
  const { reason } = req.body || {};
  if (!reason || String(reason).trim().length < 4) return res.status(400).json({ ok: false, error: 'REASON_REQUIRED' });
  await db.read();
  const nowTs = now();
  const prev = db.data.cards[uid] || { uid };
  db.data.cards[uid] = { ...prev, uid, status: 'active', updatedAt: nowTs };
  db.data.audit.push({
    id: nanoid(10),
    createdAt: nowTs,
    adminUser: process.env.ADMIN_USER || 'superadmin',
    action: 'UNBLOCK_CARD',
    targetType: 'card',
    targetId: uid,
    reason: String(reason),
    ip: req.ip
  });
  await db.write();
  res.json({ ok: true });
});

app.get('/api/admin/validators', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  const tenMin = 10 * 60 * 1000;
  const today = dayKey();
  const txToday = db.data.transactions.filter(t => (t.createdAt || 0) && dayKey(t.createdAt) === today && t.status === 'ok');
  const byValidator = new Map();
  for (const t of txToday) {
    const vid = t.validatorId || 'UNKNOWN';
    byValidator.set(vid, (byValidator.get(vid) || 0) + Number(t.amount || 0));
  }
  const list = Object.values(db.data.validators).map(v => {
    const online = v.lastSeen && (now() - v.lastSeen) <= tenMin;
    return {
      id: v.id,
      name: v.name,
      status: online ? 'ONLINE' : 'OFFLINE',
      todayIncome: byValidator.get(v.id) || 0,
      lastSync: v.lastSeen ? new Date(v.lastSeen).toLocaleString('ar') : '—'
    };
  });
  res.json(list);
});

// ---------- Config / Fares ----------
app.get('/api/fares', async (req, res) => {
  await db.read();
  const fares = Object.values(db.data.config.fares);
  res.json({ ok: true, fares, defaultFareId: db.data.config.defaultFareId });
});

app.post('/api/fares', requireAdmin, adminLimiter, async (req, res) => {
  const { id, name, amount } = req.body || {};
  if (!id || !name || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ ok: false, error: 'INVALID_FARE' });
  }
  await db.read();
  db.data.config.fares[id] = { id, name, amount };
  await db.write();
  res.json({ ok: true });
});

app.post('/api/config/default-fare', requireAdmin, adminLimiter, async (req, res) => {
  const { defaultFareId } = req.body || {};
  await db.read();
  if (!defaultFareId || !db.data.config.fares[defaultFareId]) {
    return res.status(400).json({ ok: false, error: 'UNKNOWN_FARE' });
  }
  db.data.config.defaultFareId = defaultFareId;
  await db.write();
  res.json({ ok: true });
});

// ---------- Validators ----------
app.get('/api/validators', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  res.json({ ok: true, validators: Object.values(db.data.validators) });
});

app.post('/api/validators', requireAdmin, adminLimiter, async (req, res) => {
  const { id, name, route, fareId } = req.body || {};
  const vid = id || `BUS-${Math.floor(Math.random() * 9000 + 1000)}`;
  await db.read();
  const useFareId = fareId || db.data.config.defaultFareId;
  if (!db.data.config.fares[useFareId]) return res.status(400).json({ ok: false, error: 'UNKNOWN_FARE' });
  const deviceKey = nanoid(32);
  db.data.validators[vid] = {
    id: vid,
    name: name || vid,
    route: route || 'غير محدد',
    fareId: useFareId,
    deviceKey,
    isActive: true,
    lastSeen: null
  };
  await db.write();
  res.json({ ok: true, validator: db.data.validators[vid] });
});

app.get('/api/validators/:id/config', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const v = db.data.validators[id];
  if (!v) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const fare = db.data.config.fares[v.fareId] || null;
  // لا نرسل deviceKey للعميل العادي؛ للـ Validator فقط.
  const providedKey = req.header('x-device-key');
  if (!providedKey || providedKey !== v.deviceKey) {
    // رجّع config بدون المفاتيح
    return res.json({ ok: true, validator: { id: v.id, name: v.name, route: v.route, fareId: v.fareId, isActive: v.isActive }, fare });
  }
  return res.json({ ok: true, validator: v, fare });
});

app.post('/api/validators/:id/heartbeat', deviceLimiter, async (req, res) => {
  const { id } = req.params;
  const providedKey = req.header('x-device-key');
  await db.read();
  const v = db.data.validators[id];
  if (!v) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (!providedKey || providedKey !== v.deviceKey) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED_DEVICE' });
  v.lastSeen = now();
  await db.write();
  res.json({ ok: true });
});

// ---------- Cards ----------
app.get('/api/cards', requireAdmin, adminLimiter, async (req, res) => {
  const q = String(req.query.q || '').trim();
  await db.read();
  const list = Object.values(db.data.cards);
  const filtered = q
    ? list.filter(c => c.uid.includes(q) || (c.notes || '').includes(q) || c.status === q)
    : list;
  res.json({ ok: true, cards: filtered.slice(0, 200) });
});

app.post('/api/cards/:uid/block', requireAdmin, adminLimiter, async (req, res) => {
  const { uid } = req.params;
  const { reason } = req.body || {};
  await db.read();
  db.data.cards[uid] = {
    uid,
    status: 'blocked',
    notes: reason || 'blocked',
    updatedAt: now()
  };
  db.data.audit.unshift({
    id: nanoid(10),
    createdAt: now(),
    adminUser: req.header('x-admin-user') || 'admin',
    action: 'BLOCK_CARD',
    targetType: 'card',
    targetId: uid,
    reason: reason || '',
    ip: req.ip
  });
  await db.write();
  res.json({ ok: true });
});

app.post('/api/cards/:uid/unblock', requireAdmin, adminLimiter, async (req, res) => {
  const { uid } = req.params;
  const { reason } = req.body || {};
  await db.read();
  db.data.cards[uid] = {
    uid,
    status: 'active',
    notes: reason || 'unblocked',
    updatedAt: now()
  };
  db.data.audit.unshift({
    id: nanoid(10),
    createdAt: now(),
    adminUser: req.header('x-admin-user') || 'admin',
    action: 'UNBLOCK_CARD',
    targetType: 'card',
    targetId: uid,
    reason: reason || '',
    ip: req.ip
  });
  await db.write();
  res.json({ ok: true });
});

// ---------- Transactions (from validators) ----------
app.post('/api/transactions/bulk', deviceLimiter, async (req, res) => {
  const { validatorId, items } = req.body || {};
  if (!validatorId || !Array.isArray(items)) return res.status(400).json({ ok: false, error: 'INVALID_PAYLOAD' });

  await db.read();
  const v = db.data.validators[validatorId];
  const providedKey = req.header('x-device-key');
  if (!v) return res.status(404).json({ ok: false, error: 'VALIDATOR_NOT_FOUND' });
  if (!providedKey || providedKey !== v.deviceKey) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED_DEVICE' });

  let accepted = 0;
  for (const t of items) {
    const id = t.id || nanoid(12);
    const createdAt = typeof t.createdAt === 'number' ? t.createdAt : now();
    const fareId = t.fareId || v.fareId;
    const amount = typeof t.amount === 'number' ? t.amount : (db.data.config.fares[fareId]?.amount || 0);
    const record = {
      id,
      createdAt,
      day: dayKey(createdAt),
      validatorId,
      method: t.method || 'NFC',
      fareId,
      amount,
      cardUid: t.cardUid || null,
      status: t.status || 'ok',
      reason: t.reason || null
    };
    db.data.transactions.push(record);
    accepted += 1;

    // إذا وصلنا UID بطاقة، ضيفها للقائمة إن ما كانت موجودة
    if (record.cardUid && !db.data.cards[record.cardUid]) {
      db.data.cards[record.cardUid] = { uid: record.cardUid, status: 'active', notes: '', updatedAt: now() };
    }
  }

  await db.write();
  res.json({ ok: true, accepted });
});

app.get('/api/transactions', requireAdmin, adminLimiter, async (req, res) => {
  const date = String(req.query.date || dayKey()).slice(0, 10);
  await db.read();
  const items = db.data.transactions.filter(t => t.day === date).slice(-500).reverse();
  res.json({ ok: true, items });
});

// ---------- Stats ----------
app.get('/api/stats/today', requireAdmin, adminLimiter, async (req, res) => {
  const date = dayKey();
  await db.read();
  const tx = db.data.transactions.filter(t => t.day === date && t.status === 'ok');
  const income = tx.reduce((s, t) => s + (t.amount || 0), 0);
  const rides = tx.length;
  const byValidator = {};
  for (const t of tx) byValidator[t.validatorId] = (byValidator[t.validatorId] || 0) + (t.amount || 0);

  res.json({
    ok: true,
    date,
    income,
    expense: 0,
    net: income,
    rides,
    activeValidators: Object.values(db.data.validators).filter(v => v.lastSeen && dayKey(v.lastSeen) === date).length,
    byValidator
  });
});

app.get('/api/audit', requireAdmin, adminLimiter, async (req, res) => {
  await db.read();
  res.json({ ok: true, items: db.data.audit.slice(0, 200) });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ChamCard API listening on 0.0.0.0:${PORT}`);
  console.log('Admin panel: /admin (HTML)');
});
