import authService from './auth.service.js';
import jwt from 'jsonwebtoken';
import ResponseUtils from '../../utils/response_utils.js';

const authController={
    async register(req,res){
        try {
            const {email,password,username}=req.body;
            const user=await authService.register({email,password,username,res});
        
            return ResponseUtils.successResponse(res,null,'Đăng ký thành công');
        } catch (error) {
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    
    async login(req,res){
        try {
            const {email,password}=req.body;
            const user=await authService.login({email,password});
            const token=jwt.sign({email:user.email,role:user.role,userId:user.id},process.env.JWT_SECRET,{expiresIn:'7d'});

            user.refresh_token=jwt.sign({email:user.email,role:user.role,userId:user.id},process.env.JWT_SECRET,{expiresIn:'7d'});
            user.token_expired = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            user.refresh_expired = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
            
            await authService.updateWhereService(user);
            
            return ResponseUtils.successResponse(res,{
                'token': token,
                'refreshToken': user.refresh_token,
                'tokenExpired': user.token_expired,
                'refreshTokenExpired': user.refresh_expired,
                'role':user.role,
                'avatar':user.avatar,
                'username':user.username,
                'email':user.email,
                'address_name':user.address_name,
                'is_active':user.is_active,
                'created_at':user.created_at,
                'updated_at':user.updated_at,
                // 'user': user
            },'Đăng nhập thành công');
        } catch (error) {
            if(error.message==='Email_NOT_FOUND'){
                return ResponseUtils.validationErrorResponse(res,'Email không tồn tại');
            }
            if(error.message==='PASSWORD_NOT_VALID'){
                return ResponseUtils.validationErrorResponse(res,'Mật khẩu không chính xác');
            }
            if(error.message==='USER_NOT_ACTIVE'){
                return ResponseUtils.validationErrorResponse(res,'Tài khoản của bạn đã bị khoá');
            }
            console.log(error);
            
            return ResponseUtils.serverErrorResponse(res);
        }
    },

    async refreshToken(req,res){
        try{
            const {refreshToken,email}=req.body;
            
            const user=await authService.refreshTokenService(email,refreshToken,res);

            const token=jwt.sign({email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:'2h'});

            user.refresh_token=jwt.sign({email:user.email,role:user.role,userId:user.id},process.env.JWT_SECRET,{expiresIn:'7d'});
            user.token_expired = new Date(Date.now() + 2 * 60 * 60 * 1000);
            user.refresh_expired = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            
            await authService.updateWhereService(user);
            
            return ResponseUtils.successResponse(res,{
                'token': token,
                'refreshToken': user.refresh_token,
                'tokenExpired': user.token_expired,
                'refreshTokenExpired': user.refresh_expired,
            },'Refresh token thành công');

            
        }catch(error){
            if(error.message==='INVALID_TOKEN'){
                return ResponseUtils.validationErrorResponse(res,'Token không hợp lệ hoặc Email không hợp lệ');
            }
            console.log(error);
            
            return ResponseUtils.serverErrorResponse(res);
        }
    },

    async requestOtp(req,res){
        try {
            const {email}=req.body;
            await authService.requestOtpService(email);
            return ResponseUtils.successResponse(res,null,'Yêu cầu OTP thành công');
        } catch (error) {
            if(error.message==='Email_NOT_FOUND'){
                return ResponseUtils.validationErrorResponse(res,'Email không tồn tại');
            }
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    
    async verifyOtp(req,res){
        try{
            const {email,otp}=req.body;
            await authService.verifyOtpService(email,otp);
            return ResponseUtils.successResponse(res,null,'Xác nhận OTP thành công');

        }catch(error){
            if(error.message==='Email_NOT_FOUND'){
                return ResponseUtils.validationErrorResponse(res,'Email không tồn tại');
            }
            if(error.message==='OTP_NOT_VALID'){
                return ResponseUtils.validationErrorResponse(res,'Mã OTP không hợp lệ');
            }
            if(error.message==='OTP_EXPIRED'){
                return ResponseUtils.validationErrorResponse(res,'Mã OTP đã hết hạn');
            }
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },

    async changePassController(req,res){
        try {
            const {email,passwordOld,passwordNew}=req.body;
            await authService.changePassService(email,passwordOld,passwordNew);
            return ResponseUtils.successResponse(res,null,'Thay đổi mật khẩu thành công');
        } catch (error) {
            if(error.message==='Email_NOT_FOUND'){
                return ResponseUtils.validationErrorResponse(res,'Email không tồn tại');
            }
            if(error.message==='PASSWORD_NOT_VALID'){
                return ResponseUtils.validationErrorResponse(res,'Mật khẩu cũ không chính xác');
            }
            
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    },
    
    async forgotPassController(req,res){
        try {
            const {email,password}=req.body;
            await authService.forgotPassService(email,password);
            return ResponseUtils.successResponse(res,null,'Thay đổi mật khẩu thành công');
        } catch (error) {
            if(error.message==='Email_NOT_FOUND'){
                return ResponseUtils.validationErrorResponse(res,'Email không tồn tại');
            }
            if(error.message==='OTP_EXPIRED'){
                return ResponseUtils.validationErrorResponse(res,'Mã OTP đã hết hạn');
            }
            console.log(error);
            return ResponseUtils.serverErrorResponse(res);
        }
    }
}

export default authController;
