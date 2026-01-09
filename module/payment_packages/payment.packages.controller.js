import PaymentPackagesService from "./payment.packages.service.js";
import ResponseUtils from "../../utils/response_utils.js";
import UserRepository from "../users/user.repository.js";
import userRepository from "../users/user.repository.js";

const createController = async (req, res) => {
    try {
        const paymentPackage = req.body;
        await userRepository.findById(9);
        const result = await PaymentPackagesService.createPaymentPackage(paymentPackage);
        return ResponseUtils.successResponse(res, null,'Tạo gói thanh toán thành công');
    } catch (error) {
        console.log(error);
        return ResponseUtils.errorResponse(res, error);
    }
}

const updateController = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentPackage = req.body;
        //updated
        const ressult=await PaymentPackagesService.updatePaymentPackage(id, paymentPackage);
        return ResponseUtils.successResponse(res, ressult,'Cập nhật gói thanh toán thành công');
    } catch (error) {
        if(error.message.includes('Payment package not found')){
            return ResponseUtils.validationErrorResponse(res,'Gói thanh toán không tồn tại');
        }
        console.log(error);
        return ResponseUtils.errorResponse(res, error);
    }
}

const getController = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentPackage = await PaymentPackagesService.getPaymentPackage(id);
        return ResponseUtils.successResponse(res, paymentPackage,'Lấy gói thanh toán thành công');
    } catch (error) {
        if(error.message.includes('Payment package not found')){
            return ResponseUtils.validationErrorResponse(res,'Gói thanh toán không tồn tại');
        }
        console.log(error);
        return ResponseUtils.errorResponse(res, error);
    }
}

const getAllController = async (req, res) => {
    try {
        const { isActive } = req.query;
        // if(!isActive){
        //     return ResponseUtils.validationErrorResponse(res,'Thiếu tham số isActive');
        // }
        const paymentPackages = await PaymentPackagesService.getAllPaymentPackage(isActive);
        return ResponseUtils.successResponse(res, paymentPackages,'Lấy gói thanh toán thành công');
    } catch (error) {
        console.log(error);
        return ResponseUtils.errorResponse(res, error);
    }
}

export default {
    createController,
    updateController,
    getController,
    getAllController
}