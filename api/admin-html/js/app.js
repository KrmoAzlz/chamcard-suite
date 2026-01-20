// ChamCard Admin Unified Engine
// هذا الملف يحتوي على كافة الدوال البرمجية المشتركة

// IMPORTANT:
// - When served from the local API (recommended), use same-origin /api
// - You can override by setting window.CHAMCARD_API_BASE before loading this file.
const API_BASE = window.CHAMCARD_API_BASE || (window.location.origin + '/api');

// Admin token (dev/proto). In this suite the API expects header: x-admin-token
function getAdminToken(){
  return sessionStorage.getItem('ADMIN_TOKEN') || '';
}
function setAdminToken(t){
  sessionStorage.setItem('ADMIN_TOKEN', String(t||''));
}

/**
 * دالة مركزية للطلبات البرمجية
 * تعالج الـ 401 (انتهاء الجلسة) وتحول لصفحة الدخول
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // إعدادات افتراضية (دائماً نرسل الكوكيز ونوع البيانات JSON)
    const defaultOptions = {
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-admin-token': getAdminToken()
        },
        credentials: 'include' 
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        // التعامل مع انتهاء الصلاحية
        if (response.status === 401) {
            console.warn("Session Expired - Redirecting to Login");
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'خطأ في معالجة الطلب من الخادم');
        }

        return await response.json();
    } catch (err) {
        console.error('Network/API Error:', err);
        showToast(err.message, 'error');
        return null;
    }
}

/**
 * التحقق من الجلسة عند تحميل كل صفحة
 */
async function checkAuth() {
    const user = await apiRequest('/admin/me');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    
    // تحديث واجهة المستخدم باسم الأدمن إذا وجد
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.innerText = `مرحباً، ${user.name}`;
    
    return user;
}

/**
 * تسجيل الدخول
 */
// Dev login for this suite:
// - Enter any "email" you like (not used)
// - Password field is treated as ADMIN TOKEN
async function login(email, password) {
    const errorBox = document.getElementById('errorBox');
    if (errorBox) errorBox.style.display = 'none';

    // store token and validate via /admin/me
    setAdminToken(password);
    const me = await apiRequest('/admin/me');
    if (me && me.ok) {
      window.location.href = 'dashboard.html';
      return;
    }
    // reset token if invalid
    setAdminToken('');
    if (errorBox) {
      errorBox.innerText = 'Token غير صحيح. جرّب dev-admin-token (أو قيمة ADMIN_TOKEN على السيرفر).';
      errorBox.style.display = 'block';
    }
}

/**
 * تسجيل الخروج
 */
async function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        setAdminToken('');
        window.location.href = 'login.html';
    }
}

/**
 * نظام تنبيهات بسيط
 */
function showToast(message, type = 'info') {
    // Prototype Simple Alert
    console.log(`[${type.toUpperCase()}] ${message}`);
    // في الإنتاج سنستخدم مكتبة Toast أو UI مخصص
}

// ---------------------------------------------------------
// دوال تحميل البيانات لصفحات محددة
// ---------------------------------------------------------

async function loadDashboardData() {
    const stats = await apiRequest('/admin/dashboard');
    if (!stats) return;

    const mapping = {
        'todayRevenue': `${stats.todayRevenue.toLocaleString()} ل.س`,
        'todayExpense': `${stats.todayExpense.toLocaleString()} ل.س`,
        'netRevenue': `${stats.netRevenue.toLocaleString()} ل.س`,
        'txCount': stats.transactionsCount,
        'dau': stats.dau,
        'activeValidators': stats.activeValidators
    };

    for (const [id, value] of Object.entries(mapping)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

async function loadTransactions() {
    const data = await apiRequest('/admin/transactions');
    const tbody = document.querySelector('#txTable tbody');
    if (!data || !tbody) return;

    tbody.innerHTML = data.map(tx => `
        <tr>
            <td class="font-mono text-xs" title="${tx.id}">${tx.id.substring(0,8)}...</td>
            <td class="font-mono">${tx.cardUid}</td>
            <td><span class="badge ${tx.type === 'NFC' ? 'badge-info' : 'badge-warning'}">${tx.type}</span></td>
            <td class="font-bold">${tx.amount.toLocaleString()} ل.س</td>
            <td><span class="badge ${tx.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${tx.status === 'SUCCESS' ? 'ناجحة' : 'فاشلة'}</span></td>
            <td class="text-secondary text-xs">${new Date(tx.createdAt).toLocaleString('ar-SY')}</td>
        </tr>
    `).join('');
}

// ---------- Accounting ----------
function ymdd(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function loadAccounting() {
    const dateInput = document.getElementById('accDate');
    const date = (dateInput && dateInput.value) ? dateInput.value : ymdd(new Date());
    const data = await apiRequest(`/admin/accounting/summary?date=${encodeURIComponent(date)}`);
    if (!data) return;

    const totalsEl = document.getElementById('accTotals');
    if (totalsEl) {
        totalsEl.innerHTML = `
            <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 12px;">
                <div class="stat">
                    <div class="label">إجمالي دخل اليوم</div>
                    <div class="value">${Number(data.totals?.income || 0).toLocaleString()} ل.س</div>
                </div>
                <div class="stat">
                    <div class="label">إجمالي مدفوعات اليوم</div>
                    <div class="value">${Number(data.totals?.paid || 0).toLocaleString()} ل.س</div>
                </div>
                <div class="stat">
                    <div class="label">المتبقي (مستحق)</div>
                    <div class="value">${Number(data.totals?.outstanding || 0).toLocaleString()} ل.س</div>
                </div>
            </div>
        `;
    }

    const tbody = document.querySelector('#accTable tbody');
    if (tbody) {
        const rows = (data.byValidator || []).map(r => {
            const id = r.validatorId;
            return `
                <tr>
                    <td class="font-mono">${id}</td>
                    <td class="font-bold">${Number(r.income || 0).toLocaleString()} ل.س</td>
                    <td>${Number(r.paid || 0).toLocaleString()} ل.س</td>
                    <td class="font-bold" style="color: var(--warning);">${Number(r.outstanding || 0).toLocaleString()} ل.س</td>
                    <td>
                        <button class="btn btn-success" style="padding:6px 12px; font-size:0.75rem;" onclick="openPayout('${id}', ${Number(r.outstanding || 0)})">تسجيل دفع</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows || `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary); padding: 18px;">لا يوجد بيانات لهذا اليوم</td></tr>`;
    }

    const payTbody = document.querySelector('#payoutTable tbody');
    if (payTbody) {
        const items = (data.payouts || []);
        payTbody.innerHTML = items.map(p => `
            <tr>
                <td class="font-mono text-xs">${p.id.substring(0,8)}...</td>
                <td class="font-mono">${p.validatorId}</td>
                <td class="font-bold">${Number(p.amount || 0).toLocaleString()} ل.س</td>
                <td><span class="badge badge-info">${p.method || 'cash'}</span></td>
                <td class="text-secondary text-xs">${(p.note || '')}</td>
                <td class="text-secondary text-xs">${new Date(p.createdAt).toLocaleString('ar-SY')}</td>
            </tr>
        `).join('') || `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary); padding: 18px;">لا يوجد مدفوعات مسجلة</td></tr>`;
    }
}

function openPayout(validatorId, suggested) {
    const modal = document.getElementById('payoutModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('p_validator').value = validatorId;
    document.getElementById('p_amount').value = String(Math.max(0, Math.floor(Number(suggested || 0))));
    document.getElementById('p_note').value = '';
}

function closePayout() {
    const modal = document.getElementById('payoutModal');
    if (modal) modal.style.display = 'none';
}

async function submitPayout() {
    const v = document.getElementById('p_validator').value.trim();
    const amount = Number(document.getElementById('p_amount').value);
    const method = document.getElementById('p_method').value;
    const note = document.getElementById('p_note').value.trim();
    const date = document.getElementById('accDate').value;

    if (!v) return alert('Validator ID مطلوب');
    if (!Number.isFinite(amount) || amount <= 0) return alert('مبلغ غير صالح');

    const res = await apiRequest('/admin/accounting/payout', {
        method: 'POST',
        body: JSON.stringify({ validatorId: v, amount, method, note, date })
    });

    if (res && res.ok) {
        closePayout();
        await loadAccounting();
        alert('تم تسجيل الدفع');
    }
}

async function loadAuditLogs() {
    const data = await apiRequest('/admin/audit');
    const tbody = document.getElementById('auditTable');
    if (!data || !tbody) return;

    tbody.innerHTML = data.map(log => `
        <tr>
            <td class="font-bold">${log.adminName}</td>
            <td><span class="badge badge-info">${log.action}</span></td>
            <td class="font-mono text-xs">${log.target}</td>
            <td class="italic" style="color: var(--text-secondary);">"${log.reason}"</td>
            <td class="text-xs">${log.ip}</td>
            <td class="text-secondary text-xs">${new Date(log.time).toLocaleString('ar-SY')}</td>
        </tr>
    `).join('');
}

async function searchCustomers() {
    const q = document.getElementById('searchQuery').value;
    const data = await apiRequest(`/admin/customers?query=${encodeURIComponent(q)}`);
    const tbody = document.querySelector('#customerTable tbody');
    if (!data || !tbody) return;

    tbody.innerHTML = data.map(c => `
        <tr>
            <td class="font-mono text-xs">${c.id}</td>
            <td class="font-bold">${c.name}</td>
            <td class="font-mono">${c.phone}</td>
            <td class="font-bold text-blue-400">${c.balance.toLocaleString()} ل.س</td>
            <td><span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">${c.status === 'ACTIVE' ? 'نشط' : 'محظور'}</span></td>
            <td>
                <button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="handleAdjustBalance('${c.id}')">تعديل رصيد</button>
            </td>
        </tr>
    `).join('');
}

async function handleAdjustBalance(customerId) {
    const amount = prompt('أدخل المبلغ (استخدم - للخصم):');
    if (amount === null || isNaN(parseFloat(amount))) return;
    
    const reason = prompt('أدخل سبب التعديل (إلزامي للتدقيق):');
    if (!reason || reason.trim().length < 4) {
        alert('يجب إدخال سبب واضح!');
        return;
    }

    const res = await apiRequest(`/admin/customers/${customerId}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount), reason })
    });

    if (res) {
        alert('تم تعديل الرصيد بنجاح');
        searchCustomers();
    }
}