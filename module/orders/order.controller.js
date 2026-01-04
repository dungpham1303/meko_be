import response from "../../utils/response_utils.js";
import OrderService from "./order.service.js";
import OrderRepo from "./order.repository.js";
import GHNService from "./ghn.service.js";

class OrderController {
  async create(req, res) {
    try {
      const data = await OrderService.createOrder(req.body || {});
      return response.successResponse(res, data, "Tạo đơn hàng thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Tạo đơn hàng thất bại", 400);
    }
  }
  // GHN master-data proxy helpers
  async ghnProvinces(req, res) {
    try {
      const data = await GHNService.listProvinces();
      return response.successResponse(res, data);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được danh sách tỉnh');
    }
  }

  async ghnProvinceDetail(req, res) {
    try {
      const id = Number(req.params.id);
      const list = await GHNService.listProvinces();
      const item = (list || []).find(p => Number(p.ProvinceID) === id);
      if (!item) return response.notFoundResponse(res, 'Không tìm thấy tỉnh');
      return response.successResponse(res, item);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được chi tiết tỉnh');
    }
  }

  async ghnDistricts(req, res) {
    try {
      const pid = Number(req.query.province_id);
      if (!pid) return response.validationErrorResponse(res, 'Thiếu province_id');
      const data = await GHNService.listDistricts(pid);
      return response.successResponse(res, data);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được danh sách quận/huyện');
    }
  }

  async ghnDistrictDetail(req, res) {
    try {
      const pid = Number(req.query.province_id);
      const id = Number(req.params.id);
      if (!pid) return response.validationErrorResponse(res, 'Thiếu province_id');
      const list = await GHNService.listDistricts(pid);
      const item = (list || []).find(d => Number(d.DistrictID) === id);
      if (!item) return response.notFoundResponse(res, 'Không tìm thấy quận/huyện');
      return response.successResponse(res, item);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được chi tiết quận/huyện');
    }
  }

  async ghnWards(req, res) {
    try {
      const did = Number(req.query.district_id);
      if (!did) return response.validationErrorResponse(res, 'Thiếu district_id');
      const data = await GHNService.listWards(did);
      return response.successResponse(res, data);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được danh sách phường/xã');
    }
  }

  async ghnWardDetail(req, res) {
    try {
      const did = Number(req.query.district_id);
      const code = String(req.params.code || '').trim();
      if (!did) return response.validationErrorResponse(res, 'Thiếu district_id');
      if (!code) return response.validationErrorResponse(res, 'Thiếu ward_code');
      const list = await GHNService.listWards(did);
      const item = (list || []).find(w => String(w.WardCode) === code);
      if (!item) return response.notFoundResponse(res, 'Không tìm thấy phường/xã');
      return response.successResponse(res, item);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Không lấy được chi tiết phường/xã');
    }
  }


  async detail(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await OrderService.getById(id);
      return response.successResponse(res, data);
    } catch (e) {
      return response.notFoundResponse(res, e.message || "Không tìm thấy đơn hàng");
    }
  }

  async detailByCode(req, res) {
    try {
      const code = req.params.orderCode;
      const data = await OrderService.getByCode(code);
      return response.successResponse(res, data);
    } catch (e) {
      return response.notFoundResponse(res, e.message || "Không tìm thấy đơn hàng");
    }
  }

  async list(req, res) {
    try {
      const page = Number(req.query.page ?? 0);
      const limit = Number(req.query.limit ?? 10);
      const orderBy = String(req.query.orderBy ?? "id");
      const sort = String(req.query.sort ?? "DESC");

      const filters = { ...req.query };
      delete filters.page;
      delete filters.limit;
      delete filters.orderBy;
      delete filters.sort;

      const data = await OrderService.list({ page, limit, filters, orderBy, sort });
      return response.successResponse(res, data);
    } catch (e) {
      return response.errorResponse(res, e.message || "Lấy danh sách thất bại");
    }
  }

  async listByStatus(req, res) {
    try {
      const page = Number(req.query.page ?? 0);
      const limit = Number(req.query.limit ?? 10);
      const orderBy = String(req.query.orderBy ?? "id");
      const sort = String(req.query.sort ?? "DESC");

      const { order_status, } = req.query || {};
      if (!order_status ) {
        return response.validationErrorResponse(res, 'Thiếu tham số trạng thái: order_status');
      }

      const filters = {};
      if (order_status) filters.order_status = order_status;

      const data = await OrderService.list({ page, limit, filters, orderBy, sort });
      return response.successResponse(res, data);
    } catch (e) {
      return response.errorResponse(res, e.message || 'Lấy danh sách theo trạng thái thất bại');
    }
  }

  async updatePaymentStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};
      const data = await OrderService.updatePaymentStatus(id, status);
      return response.successResponse(res, data, "Cập nhật trạng thái thanh toán thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Cập nhật thất bại", 400);
    }
  }

  async updateShippingStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status, ghn_order_code = null } = req.body || {};
      const data = await OrderService.updateShippingStatus(id, status, ghn_order_code);
      return response.successResponse(res, data, "Cập nhật trạng thái vận chuyển thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Cập nhật thất bại", 400);
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};
      const data = await OrderService.updateOrderStatus(id, status);
      return response.successResponse(res, data, "Cập nhật trạng thái đơn hàng thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Cập nhật thất bại", 400);
    }
  }

  async updateDraft(req, res) {
    try {
      const id = Number(req.params.id);
      const payload = req.body || {};
      const data = await OrderService.updateOrderDraft(id, payload);
      return response.successResponse(res, data, "Cập nhật đơn nháp thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Cập nhật đơn nháp thất bại", 400);
    }
  }

  async createGhnOrder(req, res) {
    try {
      const id = Number(req.params.id);
      const shipment = req.body || {};
      const data = await OrderService.createGhnOrder(id, shipment);
      return response.successResponse(res, data, "Tạo vận đơn GHN thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Tạo vận đơn GHN thất bại", 400);
    }
  }

  async refreshGhnStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const data = await OrderService.refreshGhnStatus(id);
      return response.successResponse(res, data, "Cập nhật trạng thái GHN thành công");
    } catch (e) {
      return response.errorResponse(res, e.message || "Cập nhật trạng thái GHN thất bại", 400);
    }
  }

  async ghnWebhook(req, res) {
    try {
      const payload = req.body || {};
      const orderCode = payload?.OrderCode || payload?.order_code || payload?.ClientOrderCode;
      const status = payload?.Status || payload?.status;
      if (!orderCode) return response.validationErrorResponse(res, 'Thiếu mã đơn GHN');

      const order = await OrderRepo.findByGhnCode(orderCode);
      if (!order) return response.notFoundResponse(res, 'Không tìm thấy đơn theo mã GHN');

      const mapped = GHNService.mapStatus(status);
      if (mapped) {
        // Map shipping_status -> order_status
        let nextOrderStatus = order.order_status;
        if (mapped === 'DELIVERED') nextOrderStatus = 'COMPLETED';
        else if (mapped === 'CANCEL') nextOrderStatus = 'CANCELLED';
        else if (['CREATED','PICKING','PICKED','DELIVERING'].includes(mapped)) nextOrderStatus = 'SHIPPING';

        await OrderRepo.update(order.id, { shipping_status: mapped, order_status: nextOrderStatus });
      }
      return response.successResponse(res, { ok: true }, 'Webhook nhận thành công');
    } catch (e) {
      return response.errorResponse(res, e.message || 'Xử lý webhook thất bại', 400);
    }
  }
}

export default new OrderController();
