import Service from "./rating.service.js";
import Response from "../../utils/response_utils.js";

const rate = async (req, res) => {
  try {
    const { postId, rating } = req.body;
    console.log(req.user.userId);
    
    const userId = req.user.userId;
    const result = await Service.rate({ postId, userId, rating });
    return Response.successResponse(res, result, "Đánh giá thành công");
  } catch (error) {
    const msg = error.message;
    console.log(msg);
    
    if (msg === "User not found") return Response.notFoundResponse(res, "Không tìm thấy người dùng");
    if (msg === "Post not found") return Response.notFoundResponse(res, "Không tìm thấy bài viết");
    if (msg === "Rating must be between 1 and 5") return Response.validationErrorResponse(res, "Số sao phải từ 1 đến 5");
    return Response.serverErrorResponse(res);
  }
};

const remove = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const result = await Service.remove({ postId, userId });
    return Response.successResponse(res, result, "Xóa đánh giá thành công");
  } catch (error) {
    const msg = error.message;
    if (msg === "User not found") return Response.notFoundResponse(res, "Không tìm thấy người dùng");
    if (msg === "Post not found") return Response.notFoundResponse(res, "Không tìm thấy bài viết");
    if (msg === "Rating not found") return Response.notFoundResponse(res, "Bạn chưa đánh giá bài viết này");
    return Response.serverErrorResponse(res);
  }
};

const summary = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await Service.summary(postId);
    return Response.successResponse(res, result, "Lấy tổng quan đánh giá thành công");
  } catch (error) {
    if (error.message === "Post not found") return Response.notFoundResponse(res, "Không tìm thấy bài viết");
    return Response.serverErrorResponse(res);
  }
};

export default { rate, remove, summary };
