import database from '../config/db.js';
class BaseService {
    constructor(tableName) {
        this.tableName = tableName;
    }

    /**
     * Lấy tất cả bản ghi
     * @param {Object} conditions - Điều kiện where (optional)
     * @param {Array} columns - Các cột cần lấy (default: *)
     * @returns {Promise<Array>}
     */
    async getAll(conditions = {}, columns = ['*']) {
        try {
            const columnStr = columns.join(', ');
            let query = `SELECT ${columnStr} FROM ${this.tableName}`;
            const params = [];

            // Xây dựng WHERE clause
            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            const [rows] = await database.pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy bản ghi với phân trang
     * @param {Number} page - Trang hiện tại (default: 1)
     * @param {Number} limit - Số bản ghi mỗi trang (default: 10)
     * @param {Object} conditions - Điều kiện where (optional)
     * @param {String} orderBy - Sắp xếp (default: 'id DESC')
     * @param {Array} columns - Các cột cần lấy (default: *)
     * @returns {Promise<Object>} - { data, pagination }
     */

    // dùng cho phân trang phức tạp trả về query 
    
    async paginate(page = 0, limit = 10, conditions = {}, orderBy = 'id', sort = 'DESC', columns = ['*']) {
    try {
        const offset = page * limit;
        const columnStr = columns.join(', ');
        let query = `SELECT ${columnStr} FROM ${this.tableName}`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const params = [];

        const whereClauses = [];

        // ✅ 1. Điều kiện LIKE ($or)
        if (conditions.$or && Array.isArray(conditions.$or)) {
            const orClauses = conditions.$or
                .map(cond => {
                    const key = Object.keys(cond)[0];
                    return `LOWER(${key}) LIKE ?`;
                })
                .join(' OR ');

            whereClauses.push(`(${orClauses})`);
            const values = conditions.$or.map(cond => `%${Object.values(cond)[0].toLowerCase()}%`);
            params.push(...values);
        }

        // ✅ 2. Các điều kiện chính xác (=)
        for (const [key, value] of Object.entries(conditions)) {
            if (key !== '$or') {
                whereClauses.push(`${key} = ?`);
                params.push(value);
            }
        }

        // ✅ 3. Kết hợp WHERE (nếu có)
        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
            countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        // ✅ 4. Thêm ORDER BY, LIMIT, OFFSET
        query += ` ORDER BY ${orderBy} ${sort} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // ✅ 5. Lấy tổng số bản ghi
        const [countResult] = await database.pool.query(countQuery, params.slice(0, -2));
        const total = countResult[0].total;

        // ✅ 6. Lấy dữ liệu trang hiện tại
        const [rows] = await database.pool.query(query, params);
        
        return {
            content: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalElements: total,
                size: limit
            }
        };
    } catch (error) {
        throw error;
    }
}

    async paginateRawQuery(baseQuery,page=0,limit=10,params=[]){
        try {
            const offset = page * limit;
            const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subQuery`;
            const [countResult] = await database.pool.query(countQuery, params);
            const total = countResult[0].total;

            const totalPages = Math.ceil(total / limit);

            const query = baseQuery + ` LIMIT ? OFFSET ?`;
            const [rows] = await database.pool.query(query, [...params, limit, offset]);
            return {
                content: rows,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalElements: total,
                    size: limit,
                    // hasNextPage: (page+1) <= totalPages,
                    // hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw error;
        }
    }


    /**
     * Tìm bản ghi theo ID
     * @param {Number} id - ID của bản ghi
     * @param {Array} columns - Các cột cần lấy (default: *)
     * @returns {Promise<Object|null>}
     */
    async findById(id, columns = ['*'], keyColumn = 'id') {
        try {
            const columnStr = columns.join(', ');
            const query = `SELECT ${columnStr} FROM ${this.tableName} WHERE ${keyColumn} = ?`
            const [rows] = await database.pool.query(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }
    
    async findByEmail(email, columns = ['*']) {
        try {
            const columnStr = columns.join(', ');
            const query = `SELECT ${columnStr} FROM ${this.tableName} WHERE email = ?`;
            const [rows] = await database.pool.query(query, [email]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tìm một bản ghi theo điều kiện
     * @param {Object} conditions - Điều kiện where
     * @param {Array} columns - Các cột cần lấy (default: *)
     * @returns {Promise<Object|null>}
     */
    async findOne(conditions, columns = ['*']) {
        try {
            const columnStr = columns.join(', ');
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            const query = `SELECT ${columnStr} FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
            const [rows] = await database.pool.query(query, Object.values(conditions));
            
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo bản ghi mới
     * @param {Object} data - Dữ liệu cần tạo
     * @returns {Promise<Object>} - { insertId, affectedRows }
     */
    async create(data) {
        try {
            const columns = Object.keys(data).join(', ');
            const placeholders = Object.keys(data).map(() => '?').join(', ');
            const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
            const [result] = await database.pool.query(query, Object.values(data));
            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo nhiều bản ghi
     * @param {Array<Object>} dataArray - Mảng dữ liệu cần tạo
     * @returns {Promise<Object>} - { insertId, affectedRows }
     */
    async createMany(dataArray) {
        try {
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                throw new Error('Data must be a non-empty array');
            }

            const columns = Object.keys(dataArray[0]).join(', ');
            const placeholders = dataArray.map(() => 
                `(${Object.keys(dataArray[0]).map(() => '?').join(', ')})`
            ).join(', ');
            
            const values = dataArray.flatMap(obj => Object.values(obj));
            const query = `INSERT INTO ${this.tableName} (${columns}) VALUES ${placeholders}`;
            
            const [result] = await database.pool.query(query, values);
            
            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật bản ghi theo ID
     * @param {Number} id - ID của bản ghi
     * @param {Object} data - Dữ liệu cần cập nhật
     * @returns {Promise<Object>} - { affectedRows, changedRows }
     */
    async update(id, data) {
        try {
            const setClause = Object.keys(data)
                .map(key => `${key} = ?`)
                .join(', ');
            const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
            const [result] = await database.pool.query(query, [...Object.values(data), id]);
            return {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật bản ghi theo điều kiện
     * @param {Object} conditions - Điều kiện where
     * @param {Object} data - Dữ liệu cần cập nhật
     * @returns {Promise<Object>} - { affectedRows, changedRows }
     */
    async updateWhere(conditions, data) {
        try {
            const setClause = Object.keys(data)
                .map(key => `${key} = ?`)
                .join(', ');
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;
            const [result] = await database.pool.query(query, [...Object.values(data), ...Object.values(conditions)]);
            return {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa bản ghi theo ID
     * @param {Number} id - ID của bản ghi
     * @returns {Promise<Object>} - { affectedRows }
     */
    async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const [result] = await database.pool.query(query, [id]);
            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa bản ghi theo điều kiện
     * @param {Object} conditions - Điều kiện where
     * @returns {Promise<Object>} - { affectedRows }
     */
    async deleteWhere(conditions) {
        try {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            const query = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
            const [result] = await database.pool.query(query, Object.values(conditions));
            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Soft delete - Đánh dấu xóa (cần có cột deleted_at trong bảng)
     * @param {Number} id - ID của bản ghi
     * @returns {Promise<Object>} - { affectedRows }
     */
    async softDelete(id) {
        try {
            const query = `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = ?`;
            const [result] = await database.pool.query(query, [id]);
            return {
                affectedRows: result.affectedRows
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Đếm số lượng bản ghi
     * @param {Object} conditions - Điều kiện where (optional)
     * @returns {Promise<Number>}
     */
    async count(conditions = {}) {
        try {
            let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
            const params = [];

            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            const [rows] = await database.pool.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kiểm tra bản ghi có tồn tại không
     * @param {Object} conditions - Điều kiện where
     * @returns {Promise<Boolean>}
     */
    async exists(conditions) {
        try {
            const count = await this.count(conditions);
            return count > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Thực thi raw query
     * @param {String} query - SQL query
     * @param {Array} params - Parameters
     * @returns {Promise<Array>}
     */
    async rawQuery(query, params = []) {
        try {
            const [rows] = await database.pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tìm kiếm với LIKE
     * @param {String} column - Tên cột cần tìm
     * @param {String} keyword - Từ khóa tìm kiếm
     * @param {Number} page - Trang hiện tại
     * @param {Number} limit - Số bản ghi mỗi trang
     * @param {Array} columns - Các cột cần lấy
     * @returns {Promise<Object>}
     */
    async search(column, keyword, page = 1, limit = 10, columns = ['*']) {
        try {
            const offset = (page - 1) * limit;
            const columnStr = columns.join(', ');
            
            const query = `SELECT ${columnStr} FROM ${this.tableName} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`;
            const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${column} LIKE ?`;
            
            const searchPattern = `%${keyword}%`;
            
            // Lấy tổng số bản ghi
            const [countResult] = await database.pool.query(countQuery, [searchPattern]);
            const total = countResult[0].total;
            
            // Lấy dữ liệu
            const [rows] = await database.pool.query(query, [searchPattern, limit, offset]);
            
            const totalPages = Math.ceil(total / limit);
            
            return {
                data: rows,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalRecords: total,
                    limit: limit,
                    // hasNextPage: page < totalPages,
                    // hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

export default BaseService;