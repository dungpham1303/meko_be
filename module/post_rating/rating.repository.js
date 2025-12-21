import BaseService from "../../base_service/base_service.js";

class RatingRepository extends BaseService {
  constructor() {
    super("rating");
  }

  async upsertUserRating({ postId, userId, rating }) {
    const existing = await this.findOne({ post_id: postId, user_id: userId });
    if (existing) {
      await this.updateWhere({ post_id: postId, user_id: userId }, { rating });
      return { id: existing.id, post_id: postId, user_id: userId, rating };
    }
    const created = await this.create({ post_id: postId, user_id: userId, rating });
    return { id: created.insertId, post_id: postId, user_id: userId, rating };
  }

  async getSummaryByPostId(postId) {
    const rows = await this.rawQuery(
      `SELECT COUNT(*) AS count, IFNULL(AVG(rating),0) AS avg FROM rating WHERE post_id = ?`,
      [postId]
    );
    return rows && rows[0] ? rows[0] : { count: 0, avg: 0 };
  }
}

export default new RatingRepository();
