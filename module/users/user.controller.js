import userService from './user.service.js';
import UserRepository from './user.repository.js';
import ResponseUtils from '../../utils/response_utils.js';
import bcrypt from 'bcrypt';
import ResponseUtil from "../../utils/response_utils.js";

const userController={
    async createUser(req,res){
        try {
            const {email,password,username,address}=req.body;
            const hashedPassword=await bcrypt.hash(password,10);

            const user=await userService.createUser({email,password:hashedPassword,username,address_name:address});
        
            return ResponseUtils.successResponse(res,null,'Tạo tài khoản thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async getDetailUser(req,res){
        try {
            const {id}=req.params;
            // Enrich detail with package info
            const detail = await UserRepository.findDetailWithPayment(id);
            if (!detail) {
                return ResponseUtils.notFoundResponse(res,'Người dùng không tồn tại');
            }
            const user = {
                ...detail,
                address_name: detail.addressName ?? detail.address_name,
                is_active: typeof detail.isActive !== 'undefined' ? detail.isActive : detail.is_active,
                created_at: detail.createdAt ?? detail.created_at,
            };
            return ResponseUtils.successResponse(res,user,'Lấy thông tin người dùng thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async uploadAvatar(req,res){
        try{
            const {id}=req.params;
            if (!req.file) {
                return ResponseUtils.validationErrorResponse(res, 'Vui lòng chọn ảnh để tải lên');
            }
            
            const avatar=req.file?.path;
            const user=await userService.findByIdUser(id);
            if(!user){
                return ResponseUtils.notFoundResponse(res,'Người dùng không tồn tại');
            }
            if (avatar) {
                user.avatar = avatar;
            }
            const updateUser=await userService.updateUserById(id,user);
            if(!updateUser){
                return ResponseUtils.serverErrorResponse(res);
            }

            return ResponseUtils.successResponse(res,updateUser,'Cập nhật ảnh đại diện thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },

    async updateUserController(req,res){
        try {
            const {userId,username,address,isActive}=req.body;
            const user=await userService.findByIdUser(userId);
            const roleToken=req.user.role;

            if(!user){
                return ResponseUtils.notFoundResponse(res,'Người dùng không tồn tại');
            }
            user.username=username;
            user.address_name=address;
            if (typeof isActive !== 'undefined') {
                if (roleToken == 1) { //admin mới có quyền cập nhật
                    user.is_active = isActive;
                } 
                else {
                    return ResponseUtils.validationErrorResponse(res, 'Bạn không có quyền thay đổi trạng thái người dùng');
                }
            }
            
            const updateUser=await userService.updateUserById(userId,user);

            if(!updateUser){
                return ResponseUtils.serverErrorResponse(res);
            }
            return ResponseUtils.successResponse(res,updateUser,'Cập nhật thông tin người dùng thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },

    async searchUserController(req,res){
        try {
            const {page,size,searchText,orderBy,sort}=req.query;
            const pageNum=Number(page);
            const pageSize=Number(size);
            const users=await userService.searchUser(pageNum,pageSize,searchText,orderBy,sort);
            return ResponseUtils.successResponse(res,users,'Lấy thông tin người dùng thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async getUserProfile(req,res){
        try{
            console.log(req.user.userId);
            
            const user=await userService.findByIdUser(req.user.userId);
            return ResponseUtils.successResponse(res,user,'Lấy thông tin người dùng thành công');
        }catch(error){
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async createPinWalletController(req,res){
        try {
            const {pinWallet,userId}=req.body;
            const user=await userService.findByIdUser(userId);

            if(!user){
                return ResponseUtils.notFoundResponse(res,'Người dùng không tồn tại');
            }
            if(user.pin_wallet){
                return ResponseUtils.validationErrorResponse(res,'Người dùng đã có mã pin');
            }
            const updateUser=await userService.createPinWallet(pinWallet,userId);
            if(!updateUser){
                return ResponseUtils.serverErrorResponse(res);
            }
            const result=await userService.findByIdUser(userId);
            return ResponseUtils.successResponse(res,result,'Tạo mã pin thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async updatePinWalletController(req,res){
        try {
            const {pinWalletNew,pinWalletOld}=req.body;
            const {id}=req.params;
            const updateUser=await userService.updatePinWallet(pinWalletNew,pinWalletOld,id);
            if(!updateUser){
                return ResponseUtils.serverErrorResponse(res);
            }
            const result=await userService.findByIdUser(id);
            return ResponseUtils.successResponse(res,result,'Cập nhật mã pin thành công');
        } catch (error) {
            if(error.message==='Pin wallet old not valid'){
                return ResponseUtils.validationErrorResponse(res,'Mã pin cũ không chính xác');
            }
            if(error.message==='User not found'){
                return ResponseUtils.validationErrorResponse(res,'Người dùng không tồn tại');
            }
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    async thongkeController(req, res){
      try {
        const { startDate, endDate, type, year } = req.body;
    
        // Validate type
        const allowType = ["daily", "monthly", "yearly"];
        if (!type || !allowType.includes(type)) {
          return ResponseUtil.validationErrorResponse(
            res,
            "type không hợp lệ. Hãy dùng: daily, monthly hoặc yearly"
          );
        }
    
        // Validate DAILY
        if (type === "daily") {
          if (!startDate || !endDate) {
            return ResponseUtil.validationErrorResponse(
              res,
              "startDate và endDate là bắt buộc cho daily!"
            );
          }
    
          if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
            return ResponseUtil.validationErrorResponse(
              res,
              "startDate hoặc endDate không hợp lệ!"
            );
          }
        }
    
        // Validate MONTHLY
        if (type === "monthly") {
          if (!year) {
            return ResponseUtil.validationErrorResponse(
              res,
              "year là bắt buộc cho monthly!"
            );
          }
    
          if (isNaN(year)) {
            return ResponseUtil.validationErrorResponse(
              res,
              "year phải là số!"
            );
          }
        }
    
        // YEARLY không cần validate gì thêm
    
        // Tính tổng doanh thu
        // const total = await PaymentService.tongDoanhThu(startDate, endDate);
    
        let result;
    
        // DAILY
        if (type === "daily") {
          result = await userService.nguoiDungMoiTheoNgay(startDate, endDate);
        }
    
        // MONTHLY
        if (type === "monthly") {
          result = await userService.nguoiDungMoiTheoThang(year);
        }
    
       
    
        return ResponseUtil.successResponse(
          res,result,
          "Thống kê doanh thu"
        );
      } catch (error) {
        console.log(error.message);
        return ResponseUtil.errorResponse(res, error.message);
      }
    }
}

export default userController;
