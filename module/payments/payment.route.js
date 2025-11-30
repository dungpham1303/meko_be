import express from "express";
import validation from "./payment.validation.js";
import controller from "./pament.controller.js";
import middleware from "../../middlewares/authenticate.js";
const router = express.Router();
router.post("/create-payment", middleware.authenticate,validation.createPaymentValidation, controller.createPayment);
router.get("/vnpay_return", controller.vnp_ReturnUrl);
router.post("/create-payment-package", middleware.authenticate, validation.createPaymentPacakgeVaidation, controller.createPaymentPacakge);
router.get("/get-payments-by-userId",middleware.authenticate,controller.getPaymentsByUserId)
router.post("/get-statistical",middleware.authenticate,controller.thongkeController);
export default router;
