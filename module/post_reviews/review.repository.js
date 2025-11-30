import BaseService from "../../base_service/base_service.js";   
import database from "../../config/db.js";
class ReviewRepository extends BaseService {
    constructor() {
        super("post_reviews");
    };

    async createReview(reviewData) {
        return await this.create(reviewData);
    }

    async updateReview(reviewId, reviewData) {
        return await this.update(reviewId, reviewData);
    }

    async deleteReview(reviewId) {
        return await this.delete(reviewId);
    }

    async getListReviewRepo(postId){
        const query=`SELECT 
            pr.id AS review_id,
            pr.comment AS review_comment,
            pr.created_at AS review_created_at,
            u.username AS review_user,
            u.id AS review_user_id,
            u.avatar AS review_user_avatar,
            COALESCE(
                JSON_ARRAYAGG(
                    CASE 
                        WHEN r.id IS NOT NULL THEN
                            JSON_OBJECT(
                                'reply_id', r.id,
                                'reply_comment', r.comment,
                                'reply_created_at', r.created_at,
                                'reply_user', u2.username,
                                'reply_user_id',u2.id,
                                'reply_user_avatar', u2.avatar
                            )
                    END
                ), 
                JSON_ARRAY()
            ) AS replies
        FROM post_reviews pr
        JOIN users u ON pr.user_id = u.id
        LEFT JOIN post_reviews r ON r.parent_id = pr.id
        LEFT JOIN users u2 ON r.user_id = u2.id
        WHERE pr.post_id = ${postId}
        AND pr.parent_id IS NULL
        GROUP BY pr.id
        ORDER BY pr.created_at DESC;`
        const [rows] = await database.pool.query(query);

        return rows;
    }

    async getListByPostIdOrUserId({ userId, tab ,page=0,limit=10}) {
    // tab = 'myPosts' => comment của người khác trên sản phẩm tôi đăng
    // tab = 'myComments' => comment của tôi trên sản phẩm người khác
    let whereClause = '';
    const params = [];

    if (tab === 'myPosts') {
        // Sản phẩm tôi đăng
        whereClause = 'p.user_id = ? AND pr.parent_id IS NULL';
        params.push(userId);
    } else if (tab === 'myComments') {
        // Sản phẩm người khác tôi đánh giá
        // whereClause = 'pr.user_id = ? AND p.user_id != ? AND pr.parent_id IS NULL';
        whereClause = 'pr.user_id = ? AND pr.parent_id IS NULL';
        params.push(userId, userId);
    } else {
        throw new Error('Invalid tab value');
    }

    const query = `
        SELECT
            pr.id AS review_id,
            pr.comment AS review_comment,
            pr.created_at AS review_created_at,
            u.username AS review_user,
            u.id AS review_user_id,
            u.avatar AS review_user_avatar,
            p.id AS post_id,
            p.title AS post_title,
            p.description AS post_desciption,
            p.price AS price,
            p.created_at AS post_created_at,
            p.updated_at AS post_updated_at,
            GROUP_CONCAT(DISTINCT ip.image_url) AS images_post,
            GROUP_CONCAT(DISTINCT c.name) AS categories_post
        FROM post_reviews pr
        JOIN post p ON pr.post_id = p.id
        JOIN users u ON pr.user_id = u.id
        JOIN image_post ip ON p.id = ip.post_id
        left join 
                    post_categories pc on p.id = pc.post_id
                left join 
                    categories c on pc.category_id=c.id
        INNER JOIN (
            SELECT post_id, MAX(created_at) AS first_created_at
            FROM post_reviews
            WHERE parent_id IS NULL
            GROUP BY post_id
        ) AS first_comment ON first_comment.post_id = pr.post_id
                            AND first_comment.first_created_at = pr.created_at
        WHERE ${whereClause} AND pr.parent_id IS NULL
        GROUP BY 
        pr.id, pr.created_at, u.username, u.avatar,
        p.title, p.description, p.price, p.created_at, p.updated_at
        ORDER BY pr.created_at DESC
        `;
    const rows = await this.paginateRawQuery(query,Number(page),Number(limit),params);
    
    return rows;
}

}

export default new ReviewRepository();
