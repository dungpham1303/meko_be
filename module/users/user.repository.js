import BaseService from '../../base_service/base_service.js';

class UserRepository extends BaseService{
    constructor(){
        super('users');
    }
    async findByEmailUserRepo(email){
        return await this.findByEmail(email);
    }
    async findByIdUserRepo(id){
        return await this.findById(id);
    }
    async createUserRepo(user){
        return await this.create(user);
    }
    async updateUserRepo(user){
        return await this.updateWhere({email:user.email},user);
    }
    async updateUserRepoById(id,user){
        return await this.updateWhere({id:id},user);
    }
    async searchUserRepo(page,size,conditions,orderBy,sort){
        // Extract searchText from conditions.$or if present
        let searchText = '';
        if (conditions && Array.isArray(conditions.$or) && conditions.$or.length > 0) {
            const first = conditions.$or[0];
            searchText = first ? Object.values(first)[0] : '';
        }
        return await this.searchUserWithPaymentRepo(page,size,searchText,orderBy,sort);
    }

    async searchUserWithPaymentRepo(page = 0, size = 10, searchText = '', orderBy = 'id', sort = 'DESC'){
        const whereClauses = [];
        const params = [];
        if (searchText) {
            whereClauses.push('(LOWER(u.username) LIKE ? OR LOWER(u.email) LIKE ?)');
            const kw = `%${searchText.toLowerCase()}%`;
            params.push(kw, kw);
        }

        const orderMap = {
            id: 'u.id',
            username: 'u.username',
            email: 'u.email',
            createdAt: 'u.created_at',
            isActive: 'u.is_active',
            packageName: 'pp.name'
        };
        const orderCol = orderMap[orderBy] || 'u.id';
        const sortDir = (String(sort).toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

        const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const baseQuery = `
            SELECT 
                u.id,
                u.username,
                u.email,
                u.address_name AS addressName,
                u.avatar,
                u.is_active AS isActive,
                u.created_at AS createdAt,
                pp.name AS packageName,
                pay.expired_at AS paymentExpiredAt,
                CASE WHEN pay.expired_at IS NOT NULL AND pay.expired_at < NOW() THEN 1 ELSE 0 END AS isExpired,
                COALESCE(ap.activePackages, JSON_ARRAY()) AS activePackages
            FROM users u
            LEFT JOIN (
                SELECT pu_final.*
                FROM payments pu_final
                INNER JOIN (
                    SELECT user_id, MAX(expired_at) AS max_expired_at
                    FROM payments
                    GROUP BY user_id
                ) m ON m.user_id = pu_final.user_id AND pu_final.expired_at = m.max_expired_at
                INNER JOIN (
                    SELECT user_id, expired_at, MAX(id) AS max_id
                    FROM payments
                    GROUP BY user_id, expired_at
                ) mx ON mx.user_id = pu_final.user_id AND mx.expired_at = pu_final.expired_at AND mx.max_id = pu_final.id
            ) pay ON pay.user_id = u.id
            LEFT JOIN payment_packages pp ON pp.id = pay.package_id
            LEFT JOIN (
                SELECT 
                    p.user_id,
                    COALESCE(JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'paymentId', p.id,
                            'packageId', p.package_id,
                            'packageName', pkg.name,
                            'expiredAt', p.expired_at,
                            'usageRemaining', p.usage_remaining
                        )
                    ), JSON_ARRAY()) AS activePackages
                FROM payments p
                INNER JOIN payment_packages pkg ON pkg.id = p.package_id
                WHERE p.expired_at >= NOW()
                GROUP BY p.user_id
            ) ap ON ap.user_id = u.id
            ${where}
            ORDER BY ${orderCol} ${sortDir}
        `;

        return await this.paginateRawQuery(baseQuery, page, size, params);
    }
}

export default new UserRepository();
