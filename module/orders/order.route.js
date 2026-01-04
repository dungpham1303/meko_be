import express from 'express';
const router = express.Router();
import OrderController from './order.controller.js';

// Create order
router.post('/create', OrderController.create);

// Get detail by id
router.get('/detail/:id', OrderController.detail);

// Get detail by order code
router.get('/code/:orderCode', OrderController.detailByCode);

// List orders with pagination and filters
router.get('/list', OrderController.list);
// List orders by status (order_status | shipping_status | payment_status)
router.get('/list-by-status', OrderController.listByStatus);

// Update statuses
router.put('/payment-status/:id', OrderController.updatePaymentStatus);
router.put('/shipping-status/:id', OrderController.updateShippingStatus);
router.put('/order-status/:id', OrderController.updateOrderStatus);
// Update draft (only when order_status=CREATED and no waybill)
router.put('/update/:id', OrderController.updateDraft);

// GHN integration
router.post('/ghn/create/:id', OrderController.createGhnOrder);
router.put('/ghn/refresh/:id', OrderController.refreshGhnStatus);
router.post('/ghn/webhook', OrderController.ghnWebhook);

// GHN master-data routes (proxy)
router.get('/ghn/provinces', OrderController.ghnProvinces);
router.get('/ghn/provinces/:id', OrderController.ghnProvinceDetail);
router.get('/ghn/districts', OrderController.ghnDistricts); // ?province_id=...
router.get('/ghn/districts/:id', OrderController.ghnDistrictDetail); // ?province_id=...
router.get('/ghn/wards', OrderController.ghnWards); // ?district_id=...
router.get('/ghn/wards/:code', OrderController.ghnWardDetail); // ?district_id=...

export default router;
