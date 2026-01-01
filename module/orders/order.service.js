import OrderRepo from "./order.repository.js";
import GHNService from "./ghn.service.js";
import UserRepo from "../users/user.repository.js";

class OrderService {
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
    return order;
  }

  async getByCode(orderCode) {
    const order = await OrderRepo.findByOrderCode(orderCode);
    if (!order) throw new Error("Không tìm thấy đơn hàng");
    return order;
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

    return await OrderRepo.paginate(page, limit, conditions, orderBy, sort);
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
    const from_district_id = shipment?.from_district_id ?? null;
    const from_ward_code = shipment?.from_ward_code ?? null;

    await OrderRepo.update(id, {
      ghn_order_code: code,
      shipping_status: "CREATED",
      shipping_provider: "GHN",
      weight: w,
      length: l,
      width: wi,
      height: h,
      required_note: rn,
      from_name,
      from_phone,
      from_address,
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
