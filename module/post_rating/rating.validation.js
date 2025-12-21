import Response from "../../utils/response_utils.js";

const rateValidation = (req, res, next) => {
  const { postId, rating } = req.body;
  if (!postId) return Response.validationErrorResponse(res, "ID bài viết không được để trống");
  if (rating === undefined || rating === null) return Response.validationErrorResponse(res, "Vui lòng nhập số sao");
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return Response.validationErrorResponse(res, "Số sao phải từ 1 đến 5");
  next();
};

const postParamValidation = (req, res, next) => {
  const { postId } = req.params;
  if (!postId) return Response.validationErrorResponse(res, "ID bài viết không được để trống");
  next();
};

export default { rateValidation, postParamValidation };
