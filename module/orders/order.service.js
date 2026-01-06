import OrderRepo from "./order.repository.js";
import GHNService from "./ghn.service.js";
import UserRepo from "../users/user.repository.js";

class OrderService {
  async _enrichAddressNames(order) {
    if (!order) return order;
    const provinces = await GHNService.listProvinces();
    const pMap = new Map();
    for (const p of provinces || []) pMap.set(Number(p.ProvinceID), p.ProvinceName || p.ProvinceNameEN || p.NameExtension?.[0] || "");

    const provinceIds = new Set();
    const districtIds = new Set();
    if (order.to_province_id) provinceIds.add(Number(order.to_province_id));
    if (order.from_province_id) provinceIds.add(Number(order.from_province_id));
    if (order.to_district_id) districtIds.add(Number(order.to_district_id));
    if (order.from_district_id) districtIds.add(Number(order.from_district_id));

    const dMap = new Map();
    for (const pid of provinceIds) {
      try {
        const ds = await GHNService.listDistricts(pid);
        for (const d of ds || []) dMap.set(Number(d.DistrictID), d.DistrictName || d.DistrictNameEN || "");
      } catch {}
    }

    const wMap = new Map();
    for (const did of districtIds) {
      try {
        const ws = await GHNService.listWards(did);
        for (const w of ws || []) wMap.set(String(w.WardCode), w.WardName || w.WardNameEN || "");
      } catch {}
    }

    return {
      ...order,
      to_province_name: order.to_province_id ? (pMap.get(Number(order.to_province_id)) || null) : null,
      to_district_name: order.to_district_id ? (dMap.get(Number(order.to_district_id)) || null) : null,
      to_ward_name: order.to_ward_code ? (wMap.get(String(order.to_ward_code)) || null) : null,
      from_province_name: order.from_province_id ? (pMap.get(Number(order.from_province_id)) || null) : null,
      from_district_name: order.from_district_id ? (dMap.get(Number(order.from_district_id)) || null) : null,
      from_ward_name: order.from_ward_code ? (wMap.get(String(order.from_ward_code)) || null) : null,
    };
  }
  async createOrder(payload) {
    const {
      order_code,
      seller_id = null,
      customer_id = null,
      customer_name,
      customer_phone,
      customer_address,
      subtotal_amount = 0,
      shipping_fee = 0,
      total_amount = 0,
      payment_method = "COD",
      payment_status = "UNPAID",
      shipping_provider = "GHN",
      ghn_order_code = null,
      shipping_status = "PENDING",
      order_status = "CREATED",
      // Accept shipping administrative codes (aliases supported)
      to_province_id: _toProvinceId,
      to_district_id: _toDistrictId,
      to_ward_code: _toWardCode,
      province_id: _provinceId,
      district_id: _districtId,
      ward_code: _wardCode,
    } = payload || {};

    if (!customer_name || !customer_phone || !customer_address) {
      throw new Error("Thiếu thông tin khách hàng");
    }

    // Validate seller and customer exist if provided
    if (seller_id !== null && seller_id !== undefined) {
      const seller = (await UserRepo.findByIdUserRepo(seller_id)) || (await UserRepo.findById(seller_id));
      if (!seller) throw new Error("Người bán (seller_id) không tồn tại");
    }
    if (customer_id !== null && customer_id !== undefined) {
      const customer = (await UserRepo.findByIdUserRepo(customer_id)) || (await UserRepo.findById(customer_id));
      if (!customer) throw new Error("Người mua (customer_id) không tồn tại");
    }

    let code = order_code;
    if (!code) {
      code = await OrderRepo.generateOrderCode();
    } else {
      const exist = await OrderRepo.findByOrderCode(code);
      if (exist) throw new Error("Mã đơn đã tồn tại");
    }

    // Resolve administrative codes with alias fallback
    const to_province_id = _toProvinceId ?? _provinceId ?? null;
    const to_district_id = _toDistrictId ?? _districtId ?? null;
    const to_ward_code = _toWardCode ?? _wardCode ?? null;

    const data = {
      order_code: code,
      seller_id,
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      subtotal_amount,
      shipping_fee,
      total_amount,
      payment_method,
      payment_status,
      shipping_provider,
      ghn_order_code,
      shipping_status,
      order_status,
      to_province_id,
      to_district_id,
      to_ward_code,
    };

    const created = await OrderRepo.create(data);
    const detail = await OrderRepo.findById(created.insertId);
    return detail;
  }

  async getById(id) {
    const order = await OrderRepo.findById(id);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    return await this._enrichAddressNames(order);
  }

  async getByCode(orderCode) {
    const order = await OrderRepo.findByOrderCode(orderCode);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    return await this._enrichAddressNames(order);
  }

  async list({ page = 0, limit = 10, filters = {}, orderBy = "id", sort = "DESC" }) {
    const conditions = {};
    const allowExact = [
      "seller_id",
      "customer_id",
      "payment_method",
      "payment_status",
      "shipping_provider",
      "shipping_status",
      "order_status",
      "id",
      "order_code",
    ];
    for (const k of allowExact) {
      if (filters[k] !== undefined && filters[k] !== "") conditions[k] = filters[k];
    }

    if (filters.q) {
      conditions.$or = [
        { order_code: filters.q },
        { customer_name: filters.q },
        { customer_phone: filters.q },
      ];
    }

    const result = await OrderRepo.paginate(page, limit, conditions, orderBy, sort);
    const items = Array.isArray(result?.content) ? result.content : [];
    if (!items.length) return result;

    const provinces = await GHNService.listProvinces();
    const pMap = new Map();
    for (const p of provinces || []) pMap.set(Number(p.ProvinceID), p.ProvinceName || p.ProvinceNameEN || p.NameExtension?.[0] || "");

    const provinceIds = new Set();
    const districtIds = new Set();
    const byProvince = new Map();
    for (const it of items) {
      if (it.to_province_id) provinceIds.add(Number(it.to_province_id));
      if (it.to_district_id) districtIds.add(Number(it.to_district_id));
      if (it.from_province_id) provinceIds.add(Number(it.from_province_id));
      if (it.from_district_id) districtIds.add(Number(it.from_district_id));
    }

    const dMap = new Map();
    for (const pid of provinceIds) {
      try {
        const ds = await GHNService.listDistricts(pid);
        byProvince.set(pid, ds || []);
        for (const d of ds || []) {
          dMap.set(Number(d.DistrictID), d.DistrictName || d.DistrictNameEN || "");
        }
      } catch {}
    }

    const wMap = new Map();
    for (const did of districtIds) {
      try {
        const ws = await GHNService.listWards(did);
        for (const w of ws || []) {
          wMap.set(String(w.WardCode), w.WardName || w.WardNameEN || "");
        }
      } catch {}
    }

    result.content = items.map(it => ({
      ...it,
      to_province_name: it.to_province_id ? (pMap.get(Number(it.to_province_id)) || null) : null,
      to_district_name: it.to_district_id ? (dMap.get(Number(it.to_district_id)) || null) : null,
      to_ward_name: it.to_ward_code ? (wMap.get(String(it.to_ward_code)) || null) : null,
      from_province_name: it.from_province_id ? (pMap.get(Number(it.from_province_id)) || null) : null,
      from_district_name: it.from_district_id ? (dMap.get(Number(it.from_district_id)) || null) : null,
      from_ward_name: it.from_ward_code ? (wMap.get(String(it.from_ward_code)) || null) : null,
    }));
    return result;
  }

  async updatePaymentStatus(id, status) {
    const order = await this.getById(id);
    await OrderRepo.update(id, { payment_status: status });
    return { ...order, payment_status: status };
  }

  async updateShippingStatus(id, status, ghnOrderCode = null) {
    const order = await this.getById(id);
    const data = { shipping_status: status };
    if (ghnOrderCode !== null) data.ghn_order_code = ghnOrderCode;
    await OrderRepo.update(id, data);
    return { ...order, ...data };
  }

  async updateOrderStatus(id, status) {
    const order = await this.getById(id);
    await OrderRepo.update(id, { order_status: status });
    return { ...order, order_status: status };
  }

  async updateOrderDraft(id, payload = {}) {
    const order = await this.getById(id);
    // Chỉ cho phép cập nhật khi đơn chưa xác nhận
    if (order.order_status !== 'CREATED') {
      throw new Error('Chỉ được phép cập nhật khi đơn hàng chưa được xác nhận (order_status=CREATED)');
    }
    // Không cho cập nhật nếu đã có vận đơn GHN
    if (order.ghn_order_code) {
      throw new Error('Đơn đã có vận đơn, không thể chỉnh sửa');
    }

    // Whitelist các trường cho phép chỉnh sửa trước khi xác nhận
    const {
      seller_id,
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      subtotal_amount,
      shipping_fee,
      total_amount,
      payment_method,
      to_province_id,
      to_district_id,
      to_ward_code,
    } = payload || {};

    const data = {};
    if (seller_id !== undefined) data.seller_id = seller_id;
    if (customer_id !== undefined) data.customer_id = customer_id;
    if (customer_name !== undefined) data.customer_name = customer_name;
    if (customer_phone !== undefined) data.customer_phone = customer_phone;
    if (customer_address !== undefined) data.customer_address = customer_address;
    if (subtotal_amount !== undefined) data.subtotal_amount = subtotal_amount;
    if (shipping_fee !== undefined) data.shipping_fee = shipping_fee;
    if (total_amount !== undefined) data.total_amount = total_amount;
    if (payment_method !== undefined) data.payment_method = payment_method;
    if (to_province_id !== undefined) data.to_province_id = to_province_id;
    if (to_district_id !== undefined) data.to_district_id = to_district_id;
    if (to_ward_code !== undefined) data.to_ward_code = to_ward_code;

    if (Object.keys(data).length === 0) return order;
    await OrderRepo.update(id, data);
    return await this.getById(id);
  }

  async createGhnOrder(id, shipment) {
    const order = await this.getById(id);
    const resp = await GHNService.createOrder({ order, shipment });
    const code = resp?.data?.order_code || resp?.order_code || resp?.code;
    if (!code) throw new Error("Tạo đơn GHN thất bại");
    // Persist shipment attributes on orders only when creating a waybill
    const w = Number(shipment?.weight ?? 0) || null;
    const l = Number(shipment?.length ?? 0) || null;
    const wi = Number(shipment?.width ?? 0) || null;
    const h = Number(shipment?.height ?? 0) || null;
    const rn = shipment?.required_note ?? null;
    // From-address fields (prefer shipment overrides; if absent, leave null to indicate from ENV/shop config)
    const from_name = shipment?.from_name ?? null;
    const from_phone = shipment?.from_phone ?? null;
    const from_address = shipment?.from_address ?? null;
    const from_province_id = shipment?.from_province_id ?? null;
    const from_district_id = shipment?.from_district_id ?? null;
    const from_ward_code = shipment?.from_ward_code ?? null;

    await OrderRepo.update(id, {
      ghn_order_code: code,
      shipping_status: "CREATED",
      shipping_provider: "GHN",
      order_status: "CONFIRMED",
      weight: w,
      length: l,
      width: wi,
      height: h,
      required_note: rn,
      from_name,
      from_phone,
      from_address,
      from_province_id,
      from_district_id,
      from_ward_code,
    });
    return await this.getById(id);
  }

  async refreshGhnStatus(id) {
    const order = await this.getById(id);
    if (!order.ghn_order_code) throw new Error("Đơn hàng chưa có mã GHN");
    const info = await GHNService.getOrderInfo(order.ghn_order_code);
    const mapped = GHNService.mapStatus(info?.data?.status || info?.status);
    if (mapped) {
      await OrderRepo.update(id, { shipping_status: mapped });
    }
    return await this.getById(id);
  }
}

export default new OrderService();
