import WalletLogsRepository from './wallet.logs.repository.js';
import ResponseUtil from "../../utils/response_utils.js";

const getAll=async(req,res)=>{
    try{
        const result=await WalletLogsRepository.getAll({user_id:req.query.userId});
        return ResponseUtil.successResponse(res,result,'Lấy lịch sử giao dịch thành công',)
    }catch(error){
        console.error(error);
        return ResponseUtil.serverErrorResponse(res, error.message);
    }
}

export default {getAll};