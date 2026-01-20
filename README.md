# ChamCard Suite (ChamCard + Bus Validator + Admin)

## الفكرة
- **ChamCard**: تطبيق العميل
- **Bus Validator**: جهاز الباص (NFC/QR + Offline Queue + Sync)
- **Admin Shield**: لوحة الإدارة
- **API**: السيرفر الذي يربط الجميع (Express + lowdb JSON)

## تشغيل محلي
### المتطلبات
- Node.js 18+

### التشغيل
```bash
npm install
npm run dev
```

سيعمل عندك:
- API: http://localhost:8080
- ChamCard: http://localhost:5173
- Bus Validator: http://localhost:5174
- Admin Shield: http://localhost:5175

## ربط جهاز الباص مع الإدارة
1) افتح **Admin Shield** ➜ تبويب **تشغيل النظام**.
2) اضغط **إضافة جهاز باص**.
3) انسخ:
   - Validator ID
   - Device Key
4) افتح **Bus Validator** ➜ من القائمة الإدارية ➜ **ربط الجهاز**.
5) الصق Validator ID و Device Key ➜ تم.

الآن زر **مزامنة مع السيرفر** داخل Bus Validator سيرسل العمليات إلى API، ولوحة الإدارة ستعرضها مباشرة.

## حماية لوحة الإدارة (رابط خاص)
- Admin Shield هنا مجرد واجهة.
- الحماية الحقيقية عندك في API:
  - كل مسارات الإدارة تتطلب هيدر: `x-admin-token`.
  - بالإضافة إلى طبقتين إضافيتين (مفعلتين افتراضياً):
    - IP Allowlist عبر `ADMIN_ALLOWED_IPS`
    - HTTP Basic Auth عبر `ADMIN_BASIC_USER`/`ADMIN_BASIC_PASS`

مهم: في الإصدار الحالي **لا يوجد توكن افتراضي**.
لازم تضبط متغيرات البيئة قبل تشغيل `/api/admin/*`.
راجع `api/.env.example` و `DEPLOY.md`.

## ملاحظات مهمة
- lowdb = تخزين JSON: ممتاز للنموذج الأولي، وليس للإنتاج. للإنتاج استبدلها بـ PostgreSQL/SQLite حقيقية.
- لا يوجد ربط فعلي لتطبيق ChamCard مع API في هذا الدمج (مقصود حتى لا نخرب تطبيق العميل). الربط الحالي بين **Validator** و **Admin** عبر **API**.
