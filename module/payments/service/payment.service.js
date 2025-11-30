import PaymentRepository from "../repository/payment.repository.js";
import UserRepo from "../../users/user.repository.js";
import PaymentPackagesRepository from "../../payment_packages/payment.packages.repository.js";
import bcrypt from 'bcrypt';
import database from '../../../config/db.js';
import userRepository from "../../users/user.repository.js";

//user mua gói
const createPayment = async (payment) => {
    const {userId,packageId,amount,pinWallet}=payment;
    const user=await UserRepo.findById(userId);
    if(!user){
        throw new Error("User not found");
    }
    if(!user.pin_wallet){
        throw new Error('You have not wallet');
    }
    const comparePinWallet=await bcrypt.compare(pinWallet,user.pin_wallet);
    if(!comparePinWallet){
        throw new Error("Pin wallet not valid");
    }

    const paymentPackageExists=await PaymentPackagesRepository.findById(packageId);
    if(!paymentPackageExists){
        throw new Error("Package not found");
    }

    //check giá amout phải khớp
    if(Number(amount) !== Number(paymentPackageExists.price)){
        throw new Error("Amount not match");
    }

    // thêm thời gian hết hạn của gói vào
    // chuyển expired_at thành số ngày
    // const days = Number(paymentPackageExists.expired_at);
    const expiredAt = new Date(Date.now() + paymentPackageExists.expired_at * 24 * 60 * 60 * 1000);
    console.log(expiredAt);
    console.log( paymentPackageExists.expired_at);
    
    
    const useageLimit=paymentPackageExists.usage_limit;
    // trừ tiền trong ví
    const wallet_balance=Number(user.wallet_balance)-Number(amount);
    if(wallet_balance<0){
        throw new Error("Not enough balance");
    }
    await UserRepo.update(userId,{wallet_balance:wallet_balance});


    const paymentSave={
        user_id:userId,
        package_id:packageId,
        amount:amount,
        expired_at:expiredAt,
        usage_remaining:useageLimit,
        transaction_code:generateTransactionCode(),
        duration_used:paymentPackageExists.duration_days
    }

    return await PaymentRepository.create(paymentSave);
}

const getPayment = async (paymentId) => {
    return await PaymentRepository.findById(paymentId);
}

const getPayments = async () => {
    return await PaymentRepository.getAll();
}

const updatePayment = async (paymentId, payment) => {
    return await PaymentRepository.update(paymentId, payment);
}

const deletePayment = async (paymentId) => {
    return await PaymentRepository.delete(paymentId);
}

const getPaymentsByUserId = async (userId)=>{
    const userExits=await userRepository.findById(userId);
    
    if(!userExits){
        throw new Error('User Not Found');
    }
    const query = `SELECT 
                    p.*,
                    pp.name AS package_name,
                    pp.usage_limit
                FROM payments p
                LEFT JOIN payment_packages pp ON p.package_id = pp.id
                WHERE 
                    p.user_id = ${userId}
                    AND p.expired_at >= NOW()    -- còn hạn
                ORDER BY 
                    pp.status = 0 DESC,            -- status=0 lên đầu
                    p.expired_at ASC;             -- ưu tiên gói sắp hết hạn`;
    
    const [raw] = await database.pool.query(query);        
    return raw;        
}


// thống kê theo doanh thu
const tongDoanhThu = async(startDate,endDate)=>{
   const query = `
        SELECT SUM(amount) AS total_revenue
        FROM payments
        WHERE DATE(created_at) BETWEEN ? AND ?
        `;
  const [raw] = await database.pool.query(query, [startDate, endDate]);
    return raw[0];        
}

const doanhThuTheoNgay = async (startDate, endDate) => {
  const query = `
    SELECT DATE(created_at) AS day,
           SUM(amount) AS revenue
    FROM payments
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `;

  const queryTongDoanhThu = `
        SELECT SUM(amount) AS total
        FROM payments
        WHERE DATE(created_at) BETWEEN ? AND ?
        `;
  const [raw] = await database.pool.query(query, [startDate, endDate]);
  const [raw2] = await database.pool.query(queryTongDoanhThu, [startDate, endDate]);
  return {daily:raw, total:raw2[0].total};
};

const doanhThuTheoThang = async (year) => {
  const query = `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
           SUM(amount) AS revenue
    FROM payments
    WHERE YEAR(created_at) = ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY DATE_FORMAT(created_at, '%Y-%m')
  `;

  const [raw] = await database.pool.query(query, [year]);
  const totalRevenue = raw.reduce((sum, item) => sum + Number(item.revenue), 0);

  return { monthly: raw, total: totalRevenue };
};

// const doanhThuTheoNam = async (year) => {
//   const query = `
//     SELECT YEAR(created_at) AS year,
//            SUM(amount) AS revenue
//     FROM payments
//     WHERE YEAR(created_at) = ?
//     GROUP BY YEAR(created_at)
//     ORDER BY YEAR(created_at)
//   `;
//   const [raw] = await database.pool.query(query, [year]);
//   return raw;
// };


function generateTransactionCode() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const time = Date.now();
    return `MEKO_${time}_${random}`;
}
export default {
    createPayment,
    getPayment,
    getPayments,
    updatePayment,
    deletePayment,
    getPaymentsByUserId,
    tongDoanhThu,
    doanhThuTheoThang,
    doanhThuTheoNgay

}
