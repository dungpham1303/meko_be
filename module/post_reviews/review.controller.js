import ReviewService from "./review.service.js";
import ResponseUtile from "../../utils/response_utils.js";

const createReview = async (req, res) => {
    try {
        const review = await ReviewService.createReview(req.body);
        return ResponseUtile.successResponse(res,null, 'Tạo bình luận thành công');
    } catch (error) {

        if(error.message === 'User not found'){
            return ResponseUtile.notFoundResponse(res, 'Người dùng không tồn tại');
        }
        if(error.message === 'Post not found'){
            return ResponseUtile.notFoundResponse(res, 'Bài viết không tồn tại');
        }
        if(error.message === 'Parent not found'){
            return ResponseUtile.notFoundResponse(res, 'Bình luận cha không tồn tại');
        }
        console.log(error);
        
        return ResponseUtile.errorResponse(res, error.message);
    }
};

const updateReview = async (req, res) => {
    try {

        const review = await ReviewService.updateReview(req.params.reviewId, req.body.comment);
        return ResponseUtile.successResponse(res, review, 'Cập nhật bình luận thành công');
    } catch (error) {
        if(error.message === 'Review not found'){
            return ResponseUtile.notFoundResponse(res, 'Bình luận không tồn tại');
        }
        if(error.message === 'Update review failed'){
            return ResponseUtile.errorResponse(res, 'Cập nhật bình luận thất bại');
        }
        console.log(error);
        return ResponseUtile.errorResponse(res, error.message);
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await ReviewService.deleteReview(req.params.reviewId);
        return ResponseUtile.successResponse(res, null, 'Xóa bình luận thành công');
    } catch (error) {
        if(error.message === 'Review not found'){
            return ResponseUtile.notFoundResponse(res, 'Bình luận không tồn tại');
        }
        console.log(error);
        return ResponseUtile.errorResponse(res, error.message);
    }
};

const getListReview = async(req,res)=>{
     try {
        const review = await ReviewService.getListReview(req.params.postId);
        return ResponseUtile.successResponse(res, review, 'Lấy danh sách bình luận thành công');
    } catch (error) {
        if(error.message === 'Post not found'){
            return ResponseUtile.notFoundResponse(res, 'Bài viết không tồn tại');
        }
        console.log(error);
        return ResponseUtile.errorResponse(res, error.message);
    }
}

const getListReviewByPostIdOrUserId = async(req,res)=>{
    try {
        if(!req.query.userId || !req.query.tab){
            return ResponseUtile.validationErrorResponse(res, 'Thiếu tham số');
        }
        if(req.query.tab!='myPosts' && req.query.tab!='myComments'){
            return ResponseUtile.validationErrorResponse(res, 'Tham số tab không hợp lệ');
        }
        
        const review = await ReviewService.getListReviewByPostIdOrUserId({userId:req.query.userId,tab:req.query.tab,page:req.query.page,limit:req.query.size});
        for(let i=0;i<review.content.length;i++){
            review.content[i].images_post = review.content[i].images_post 
            ? String(review.content[i].images_post).split(',') 
            : [];
            review.content[i].categories_post = review.content[i].categories_post 
            ? String(review.content[i].categories_post).split(',') 
            : [];
        }
        return ResponseUtile.successResponse(res, review, 'Lấy danh sách bình luận thành công');
    } catch (error) {
        if(error.message === 'User not found'){
            return ResponseUtile.notFoundResponse(res, 'Người dùng không tồn tại');
        }
        console.log(error);
        return ResponseUtile.errorResponse(res, error.message);
    }
}

export default {
    createReview,
    updateReview,
    deleteReview,
    getListReview,
    getListReviewByPostIdOrUserId
};
