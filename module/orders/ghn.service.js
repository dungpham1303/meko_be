import 'dotenv/config';

const RAW_GHN_API_URL = process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
const GHN_TOKEN = process.env.GHN_TOKEN || '';
const GHN_SHOP_ID = Number(process.env.GHN_SHOP_ID || 0);
const GHN_FROM_NAME = process.env.GHN_FROM_NAME || '';
const GHN_FROM_PHONE = process.env.GHN_FROM_PHONE || '';
const GHN_FROM_ADDRESS = process.env.GHN_FROM_ADDRESS || '';
const GHN_FROM_WARD_CODE = process.env.GHN_FROM_WARD_CODE || '';
const GHN_FROM_DISTRICT_ID = Number(process.env.GHN_FROM_DISTRICT_ID || 0);
const GHN_MOCK = String(process.env.GHN_MOCK || '').toLowerCase() === 'true';

// Normalize GHN base URL: accept either base or full endpoint and trim trailing slashes
const normalizeBase = (url) => {
  let base = url || '';
  const idx = base.indexOf('/v2/');
  if (idx !== -1) base = base.slice(0, idx);
  return base.replace(/\/+$/, '');
};

const makeUrl = (path) => {
  const base = normalizeBase(RAW_GHN_API_URL);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

const buildHeaders = () => {
  if (!GHN_TOKEN) throw new Error('GHN config error: missing GHN_TOKEN');
  const h = new Headers();
  h.set('Content-Type', 'application/json');
  h.set('Token', GHN_TOKEN);
  if (GHN_SHOP_ID) h.set('ShopId', String(GHN_SHOP_ID));
  return h;
};

const normalizeVNPhone = (raw) => {
  if (!raw) return '';
  let s = String(raw).trim();
  // remove spaces, dots, dashes, etc
  s = s.replace(/[^0-9+]/g, '');
  // convert +84 or 84 prefix to 0
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (s.startsWith('84') && s.length >= 11) s = '0' + s.slice(2);
  // ensure only digits
  s = s.replace(/\D/g, '');
  return s;
};

const isValidVNPhone = (phone) => {
  // Basic GHN-style validation: start with 0, 10 digits total
  return /^0\d{9}$/.test(phone);
};

class GHNService {
  async createOrder({ order, shipment = {} }) {
  // Mock mode: bypass external API for testing flow
  const useMock = GHN_MOCK || Boolean(shipment.mock);
  if (useMock) {
    const fakeCode = `GHN${Date.now()}`;
    return { code: 200, message: 'MOCK_OK', data: { order_code: fakeCode, expected_delivery_time: new Date(Date.now()+3*24*3600*1000).toISOString() } };
  }
  const body = {
    // Sender (From) - prefer shipment overrides, then ENV defaults
    from_name: shipment.from_name || GHN_FROM_NAME || undefined,
    from_phone: shipment.from_phone ? normalizeVNPhone(shipment.from_phone) : (GHN_FROM_PHONE ? normalizeVNPhone(GHN_FROM_PHONE) : undefined),
    from_address: shipment.from_address || GHN_FROM_ADDRESS || undefined,
    from_ward_code: String(shipment.from_ward_code ?? (GHN_FROM_WARD_CODE || '')),
    from_district_id: Number(shipment.from_district_id ?? (GHN_FROM_DISTRICT_ID || 0)),

    to_name: order.customer_name,
    to_phone: normalizeVNPhone(order.customer_phone),
    to_address: order.customer_address,

    to_ward_code: String(order.to_ward_code ?? shipment.to_ward_code ?? ''),
    to_district_id: Number(order.to_district_id ?? shipment.to_district_id ?? 0),

    service_type_id: Number(shipment.service_type_id || 2),
    weight: Number(shipment.weight || 500),
    length: Number(shipment.length || 10),
    width: Number(shipment.width || 10),
    height: Number(shipment.height || 5),
    required_note: shipment.required_note || 'KHONGCHOXEMHANG',
    cod_amount: order.payment_method === 'COD' ? Number(order.total_amount || 0) : 0,
    content: shipment.content || `Đơn ${order.order_code}`,
    // 1: Người bán trả phí, 2: Người mua trả phí (COD)
    payment_type_id: Number(shipment.payment_type_id ?? (order.payment_method === 'COD' ? 2 : 1)),
  };

  // Enforce consistency: if payment_type_id is 2 (receiver pays), cod_amount must be > 0
  if (body.payment_type_id === 2 && (!Number.isFinite(body.cod_amount) || body.cod_amount <= 0)) {
    body.cod_amount = Math.max(1, Number(order.total_amount || shipment.cod_amount || 0));
  }
  // If not COD (payment_type_id 1), cod_amount must be 0
  if (body.payment_type_id === 1) {
    body.cod_amount = 0;
  }

  // Basic required fields check for GHN
  if (!body.to_ward_code || !body.to_district_id) {
    throw new Error('Thiếu to_ward_code hoặc to_district_id');
  }
  // If GHN cannot infer sender from Shop config, ensure from_* are provided
  if (!body.from_ward_code || !body.from_district_id) {
    throw new Error('Thiếu from_ward_code hoặc from_district_id (địa chỉ người gửi)');
  }
  if (![1,2].includes(body.payment_type_id)) {
    throw new Error('payment_type_id không hợp lệ. Chỉ nhận 1 (người gửi trả phí) hoặc 2 (người nhận trả phí)');
  }

  // Validate phone before calling GHN to avoid 400 PHONE_INVALID
  if (!isValidVNPhone(body.to_phone)) {
    throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập định dạng 10 số bắt đầu bằng 0');
  }

  const res = await fetch(makeUrl('/v2/shipping-order/create'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('GHN ERROR:', data);
    throw new Error(`GHN create error ${res.status}`);
  }

  return data;
}


  async getOrderInfo(ghnOrderCode) {
    // Mock mode: return rotating statuses for testing
    if (GHN_MOCK) {
      const statuses = ['CREATED','PICKING','PICKED','DELIVERING','DELIVERED'];
      const idx = Math.floor((Date.now()/30000)) % statuses.length;
      return { code: 200, message: 'MOCK_OK', data: { order_code: ghnOrderCode, status: statuses[idx] } };
    }
    const res = await fetch(makeUrl('/v2/shipping-order/detail'), {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ order_code: ghnOrderCode }),
    });
    if (!res.ok) throw new Error(`GHN info error ${res.status}`);
    return await res.json();
  }

  mapStatus(ghnStatus) {
    const s = String(ghnStatus || '').toLowerCase();
    if (!s) return null;
    if (s.includes('ready') || s === 'created') return 'CREATED';
    if (s.includes('picking')) return 'PICKING';
    if (s === 'picked') return 'PICKED';
    if (s.includes('transport') || s.includes('storing') || s.includes('deliver')) {
      if (s === 'delivered') return 'DELIVERED';
      return 'DELIVERING';
    }
    if (s.includes('return')) return 'RETURN';
    if (s.includes('cancel')) return 'CANCEL';
    return null;
  }
}

export default new GHNService();
