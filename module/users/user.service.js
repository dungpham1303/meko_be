
import UserRepository from './user.repository.js';
import bcrypt from 'bcrypt';
import PaymenRepo from '../payments/repository/payment.repository.js';
import PaymentPackageRepo from '../payment_packages/payment.packages.repository.js';
import database from '../../config/db.js';
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special chars
  }
class UserService{
    async createUser(user){
        const result= await UserRepository.createUserRepo(user);
        if (result) {
            const resultPaymenPackage = await PaymentPackageRepo.getAll({ status: 0, is_active: 1 });
            if (resultPaymenPackage.length > 0) {
                for (const pkg of resultPaymenPackage) {
                    const expiredAt = new Date(Date.now() + pkg.expired_at * 24 * 60 * 60 * 1000);
                    await PaymenRepo.create({
                        user_id: result.insertId,
                        amount: 0,
                        transaction_code: 'Meko_free',
                        usage_remaining: pkg.usage_limit,
                        expired_at: expiredAt,
                        package_id:pkg.id
                    });
                   }
                  }
                }
        return result;
    }
    async findByIdUser(id){
        return await UserRepository.findByIdUserRepo(id);
    }
    async findByEmailUser(email){
        return await UserRepository.findByEmailUserRepo(email);
    }
    async updateUser(user){
        await UserRepository.updateUserRepo(user);
        return await UserRepository.findById(user.id);
    }
    async updateUserById(id,user){
        await UserRepository.updateUserRepoById(id,user);
        return await UserRepository.findById(id);
    }
    async searchUser(page,size,searchText,orderBy,sort){
        const conditions={};
        if(searchText){
            // Tìm kiếm gần đúng theo nhiều trường
            conditions['$or'] = [
                { username: searchText },
                { email: searchText },
            ];
        }
        return await UserRepository.searchUserRepo(page,size,conditions,orderBy,sort);
    }

    async createPinWallet(pinWallet,userId){
        const hashedPinWallet=await bcrypt.hash(pinWallet,10);
        return await UserRepository.update(userId,{pin_wallet:hashedPinWallet});
    }
    async updatePinWallet(pinWalletNew,pinWalletOld,userId){
        const user=await UserRepository.findById(userId);
        const comparePinWalletOld=await bcrypt.compare(pinWalletOld,user.pin_wallet);

        if(!user){
            throw new Error('User not found');
        }
        if(!comparePinWalletOld){
            throw new Error('Pin wallet old not valid');
        }
        const hashedPinWalletNew=await bcrypt.hash(pinWalletNew,10);
        return await UserRepository.update(userId,{pin_wallet:hashedPinWalletNew});
    }
    async nguoiDungMoiTheoNgay  (startDate, endDate){
        const query = `
            SELECT DATE(created_at) AS day,
                COUNT(*) AS new_users
            FROM users
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        `;

        const queryTong = `
            SELECT COUNT(*) AS total
            FROM users
            WHERE DATE(created_at) BETWEEN ? AND ?
        `;

        const [dailyRaw] = await database.pool.query(query, [startDate, endDate]);
        const [totalRaw] = await database.pool.query(queryTong, [startDate, endDate]);

        return { daily: dailyRaw, total: totalRaw[0].total };
    };

    async nguoiDungMoiTheoThang(year){
        const query = `
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS new_users
            FROM users
            WHERE YEAR(created_at) = ?
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY DATE_FORMAT(created_at, '%Y-%m')
        `;
        const [monthlyRaw] = await database.pool.query(query, [year]);

        const queryTong = `
            SELECT COUNT(*) AS total
            FROM users
            WHERE YEAR(created_at) = ?
        `;
        const [totalRaw] = await database.pool.query(queryTong, [year]);

        return { monthly: monthlyRaw, total: totalRaw[0].total };
    };


}

export default new UserService();