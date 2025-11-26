'use strict';

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const db = require('../models');

function normalizeKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function mapKey(key) {
  const k = normalizeKey(key);
  const mapping = {
    // Identitas
    name: 'name',
    nama: 'name',
    phone: 'phone',
    telepon: 'phone',
    hp: 'phone',
    nohp: 'phone',
    phonenumber: 'phone',
    email: 'email',
    address: 'address',
    alamat: 'address',
    idnumber: 'idNumber',
    noktp: 'idNumber',
    ktp: 'idNumber',
    // Layanan
    area: 'area',
    paket: 'package',
    package: 'package',
    packagename: 'package',
    price: 'packagePrice',
    harga: 'packagePrice',
    packageprice: 'packagePrice',
    // PPP
    pppsecret: 'pppSecret',
    pppsecrettype: 'pppSecretType',
    // Router/ODP
    router: 'routerName',
    routername: 'routerName',
    routerid: 'routerId',
    odpslot: 'odpSlot',
    odpid: 'odpId',
    // Tanggal & periode
    activedate: 'activeDate',
    mulaiaktif: 'activeDate',
    expiredate: 'expireDate',
    berakhir: 'expireDate',
    paymentduedate: 'paymentDueDate',
    duedate: 'paymentDueDate',
    jatuhtempo: 'paymentDueDate',
    activeperiod: 'activePeriod',
    activeperiodunit: 'activePeriodUnit',
    // Status & lain-lain
    billingtype: 'billingType',
    billingstatus: 'billingStatus',
    status: 'status',
    servicestatus: 'serviceStatus',
    installationstatus: 'installationStatus',
    mikrotikstatus: 'mikrotikStatus',
    notes: 'notes',
    catatan: 'notes',
    customernumber: 'customerNumber'
  };
  return mapping[k] || null;
}

function sanitizePhone(v) {
  const s = String(v || '').replace(/[^0-9]/g, '');
  return s;
}

function parsePrice(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function formatDateYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const s = String(value).trim();
  // Try ISO
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const dd = parseInt(m1[1], 10);
    const mm = parseInt(m1[2], 10);
    const yyyy = parseInt(m1[3], 10);
    const d = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function defaultActiveDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addPeriod(date, amount, unit) {
  const d = new Date(date.getTime());
  if (unit === 'days') {
    d.setDate(d.getDate() + amount);
  } else {
    d.setMonth(d.getMonth() + amount);
  }
  return d;
}

function nextMonthFifth(date) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + 1);
  d.setDate(5);
  return d;
}

function genCustomerNumber(phone) {
  const tail = String(phone || '').slice(-6).padStart(6, '0');
  const uniq = Date.now().toString().slice(-5);
  return `LTS${tail}${uniq}`;
}

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('[import] Database connected');

    const argPath = process.argv.find((a) => a && !a.startsWith('--') && a.endsWith('.xlsx'));
    const defaultPath = path.resolve(__dirname, '../../import/customers (2) (1).xlsx');
    const filePath = argPath ? path.resolve(process.cwd(), argPath) : defaultPath;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    console.log(`[import] Loaded ${rows.length} rows from '${path.basename(filePath)}' (sheet: ${sheetName})`);

    let created = 0, updated = 0, skipped = 0, errors = 0;

    for (const [index, raw] of rows.entries()) {
      try {
        const mapped = {};
        for (const [k, v] of Object.entries(raw)) {
          const dest = mapKey(k);
          if (dest) mapped[dest] = v;
        }

        const name = (mapped.name || '').toString().trim();
        const phone = sanitizePhone(mapped.phone);
        if (!name || !phone) {
          console.warn(`[import] Row ${index + 1}: missing name/phone -> skipped`);
          skipped++;
          continue;
        }

        const area = (mapped.area || 'N/A').toString().trim();
        const pkg = (mapped.package || 'N/A').toString().trim();
        const packagePrice = parsePrice(mapped.packagePrice);

        const activeDate = parseDate(mapped.activeDate) || defaultActiveDate();
        const activePeriod = mapped.activePeriod != null ? parseInt(mapped.activePeriod, 10) : 1;
        const activePeriodUnit = mapped.activePeriodUnit === 'days' ? 'days' : 'months';
        const expireDate = parseDate(mapped.expireDate) || addPeriod(activeDate, isNaN(activePeriod) ? 1 : activePeriod, activePeriodUnit);
        const paymentDueDate = parseDate(mapped.paymentDueDate) || nextMonthFifth(activeDate);

        // Router mapping
        let routerId = null;
        if (mapped.routerId) {
          const rid = parseInt(mapped.routerId, 10);
          if (!isNaN(rid)) routerId = rid;
        } else if (mapped.routerName) {
          const rname = String(mapped.routerName).trim();
          const router = await db.Router.findOne({ where: { name: rname } });
          if (router) routerId = router.id;
        }

        const billingType = mapped.billingType === 'postpaid' ? 'postpaid' : 'prepaid';
        const billingStatus = mapped.billingStatus || (billingType === 'prepaid' ? 'lunas' : 'belum_lunas');
        const pppSecret = mapped.pppSecret ? String(mapped.pppSecret).trim() : null;
        const pppSecretType = mapped.pppSecretType || (pppSecret ? 'existing' : 'none');

        const existing = await db.Customer.findOne({ where: { phone } });

        const payload = {
          customerNumber: mapped.customerNumber || genCustomerNumber(phone),
          name,
          email: mapped.email || null,
          phone,
          address: mapped.address || null,
          idNumber: mapped.idNumber || null,
          area,
          package: pkg,
          packagePrice: packagePrice || 0,
          addonPrice: parsePrice(mapped.addonPrice) || 0,
          discount: parsePrice(mapped.discount) || 0,
          pppSecret,
          pppSecretType,
          odpSlot: mapped.odpSlot || null,
          odpId: mapped.odpId ? parseInt(mapped.odpId, 10) : null,
          billingType,
          activePeriod: isNaN(activePeriod) ? 1 : activePeriod,
          activePeriodUnit,
          installationStatus: mapped.installationStatus || 'installed',
          serviceStatus: mapped.serviceStatus || 'active',
          activeDate: formatDateYYYYMMDD(activeDate),
          expireDate: formatDateYYYYMMDD(expireDate),
          paymentDueDate: formatDateYYYYMMDD(paymentDueDate),
          status: mapped.status || 'active',
          isIsolated: false,
          routerName: routerId ? null : (mapped.routerName || null),
          routerId,
          notes: mapped.notes || null,
          billingStatus,
          mikrotikStatus: mapped.mikrotikStatus || 'active',
          lastSuspendDate: null,
          isProRataApplied: false,
          proRataAmount: null
        };

        if (existing) {
          await existing.update(payload);
          updated++;
        } else {
          await db.Customer.create(payload);
          created++;
        }
      } catch (rowErr) {
        console.error(`[import] Row ${index + 1} error:`, rowErr.message);
        errors++;
      }
    }

    console.log(`[import] Finished. Created=${created}, Updated=${updated}, Skipped=${skipped}, Errors=${errors}`);
    await db.sequelize.close();
  } catch (err) {
    console.error('[import] Fatal error:', err.message);
    try { await db.sequelize.close(); } catch (_) {}
    process.exit(1);
  }
})();

