import RatingRepo from "./rating.repository.js";
import UserRepo from "../users/user.repository.js";
import PostRepo from "../post/post.repository.js";

class RatingService {
  async rate({ postId, userId, rating }) {
    // Validate
    const user = await UserRepo.findByIdUserRepo(userId) || await UserRepo.findById(userId);
    if (!user) throw new Error("User not found");
    const post = await PostRepo.findById(postId);
    if (!post) throw new Error("Post not found");
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Upsert rating
    await RatingRepo.upsertUserRating({ postId, userId, rating: r });

    // Recalculate summary and update post
    const summary = await RatingRepo.getSummaryByPostId(postId);
    const avg = Number(summary.avg) || 0;
    await PostRepo.update(postId, { rating: avg });

    return { avg, count: Number(summary.count) };
  }

  async remove({ postId, userId }) {
    const user = await UserRepo.findByIdUserRepo(userId) || await UserRepo.findById(userId);
    if (!user) throw new Error("User not found");
    const post = await PostRepo.findById(postId);
    if (!post) throw new Error("Post not found");

    const existing = await RatingRepo.findOne({ post_id: postId, user_id: userId });
    if (!existing) throw new Error("Rating not found");

    // Xóa bằng composite key để không phụ thuộc vào cột id
    await RatingRepo.deleteWhere({ post_id: postId, user_id: userId });

    const summary = await RatingRepo.getSummaryByPostId(postId);
    const avg = Number(summary.avg) || 0;
    await PostRepo.update(postId, { rating: avg });

    return { avg, count: Number(summary.count) };
  }

  async summary(postId) {
    const post = await PostRepo.findById(postId);
    if (!post) throw new Error("Post not found");
    const summary = await RatingRepo.getSummaryByPostId(postId);
    return { avg: Number(summary.avg) || 0, count: Number(summary.count) };
  }
}

export default new RatingService();
