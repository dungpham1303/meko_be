import BaseService from "../../base_service/base_service.js";

class OrderRepository extends BaseService {
  constructor() {
    super("orders");
  }

  async findByOrderCode(orderCode) {
    return await this.findOne({ order_code: orderCode });
  }

  async findByGhnCode(ghnCode) {
    return await this.findOne({ ghn_order_code: ghnCode });
  }

  async generateOrderCode(prefix = "MEKO") {
    const rows = await this.rawQuery(
      `SELECT CONCAT(?, DATE_FORMAT(NOW(), '%y%m%d'), LPAD(FLOOR(RAND()*9999), 4, '0')) as code`,
      [prefix]
    );
    return rows && rows[0] ? rows[0].code : `${prefix}${Date.now()}`;
  }
}

export default new OrderRepository();
