import PostRepository from './post.repository.js';
import UserRepository from '../users/user.repository.js';
import ProvinceRepository from '../address/provinces/province.repository.js';
import WardRepository from '../address/wards/ward.repository.js';
import ImagePostRepository from '../image_post/image.repository.js';
import PostCategoriesRepository from '../post_categories/post.categories.repository.js';
import Category from '../category/category.repository.js';
import {PostStatus} from '../../utils/enum.common.js';
import ValidateUtils from '../../utils/validate_utils.js';
import Violation from '../category_violation/category.violation.repository.js';
import PostHistoryRepo from "../post_history/post.history.repository.js";
import PostFavorite from "../../module/post_favorite/favorite.repository.js";
import PaymentRepo from "../payments/repository/payment.repository.js";
import PaymenUsageRepository from '../payments/repository/paymen.usage.repository.js';


class PostService{
    async createPost(post){
        const userId=post.userId;
        const provinceCode=post.provinceCode;
        const wardCode=post.wardCode;
        const phoneNumber=post.phoneNumber;
        const images=post.images;
        const categories=post.categories;
        const paymentId=post.paymentId;
        
        const user=await UserRepository.findByIdUserRepo(userId);
        if(!user){
            throw new Error('User not found');
        }
       
        const province=await ProvinceRepository.getProvinceByCode(provinceCode);
        if(!province){
            throw new Error('Province not found');
        }
        
        const ward=await WardRepository.getWardByCode(wardCode);
        if(!ward){
            throw new Error('Ward not found');
        }
        //check gói
        const paymentExists = await PaymentRepo.findOne({id:paymentId,user_id:userId});
        if(!paymentExists){
            throw new Error('Payment Not Found');
        }

        if(paymentExists.usage_remaining<=0){
            throw new Error('Bạn không còn lượt đăng bài');
        }

        if(paymentExists.expired_at<new Date()){
            throw new Error('Gói đã hết hạn')
        }

        await PaymentRepo.update(paymentId,{usage_remaining:paymentExists.usage_remaining-1});
        
        const expired_at = new Date();
        expired_at.setDate(expired_at.getDate() + paymentExists.duration_used);
        const expiredAtFormatted = expired_at.toISOString().slice(0, 19).replace('T', ' ');

        // dữ liệu lưu vào db
        const postSave={
            title:post.title,
            description:post.description,
            user_id:userId,
            ward_code:wardCode,
            province_code:provinceCode,
            address:post.address,
            price:post.price,
            expired_at: expiredAtFormatted,
            phone_number:phoneNumber,
        }
        const postResult=await PostRepository.createPostRepo(postSave);
        if(!postResult) return;
        //thêm bảng payment_usage
        await PaymenUsageRepository.create({
            payment_id: paymentExists.id,
            post_id:postResult.id,
            used_at:expiredAtFormatted
        })

        if (images && images.length > 0) {
            const imageValues = images.map((imageUrl) => ({
                post_id: postResult.id,
                image_url: imageUrl
            }));
            await ImagePostRepository.createManyImagePost(imageValues);
        }
        
        if(categories && categories.length > 0){
            for(const id of categories){
                const categoryExist=await Category.getCategoryRepoById(id);
                if(!categoryExist){
                    throw new Error('Category not found');
                }
            }

            const postCategoriesValues = categories.map((categoryId) => ({
                post_id: postResult.id,
                category_id: categoryId
            }));
            await PostCategoriesRepository.createManyPostCategoriesRepo(postCategoriesValues);
        }
        return post;
    }

    async getDetailByPostId(postId,userId){
        const post=await PostRepository.findById(postId);
        if(!post){
            throw new Error('Post not found');
        }
        if(userId){
            const userExists=await UserRepository.findById(userId)
            if(!userExists){
                throw new Error('User not found');
            }
            const postHistory=await PostHistoryRepo.getPostHistoryRepo(postId,userId);
            if(!postHistory & post.status == PostStatus.APPROVED){
                await PostHistoryRepo.createPostHistoryRepo({
                    post_id:postId,
                    user_id:userId
                })
            }
        }
        const result=await PostRepository.getDetailByPostId(postId);
        const postFavorite=await PostFavorite.getFavoriteExists(postId,userId);
        if(postFavorite){
            result.isFavorite=true;
        }else{
            result.isFavorite=false;
        }
        return result;
    }


    // async updatePost(post){
    //     const postId=post.postId;
    //     const title=post.title;
    //     const description=post.description;
    //     const address=post.address;
    //     const price=post.price;
    //     const phoneNumber=post.phoneNumber;
    //     const images=post.images; // backward-compat
    //     const keepOldImages = post.keepOldImages; // optional array of URLs to keep
    //     const newImages = post.newImages; // optional array of newly uploaded URLs
    //     const categories=post.categories;
    //     const wardCode=post.wardCode;
    //     const provinceCode=post.provinceCode;
        
    //     const postExists=await PostRepository.findById(postId);
    //     if(!postExists){
    //         throw new Error('Post not found');
    //     }
    //     if(provinceCode){
    //         const provinceExist=await ProvinceRepository.getProvinceByCode(provinceCode);
    //         if(!provinceExist){
    //             throw new Error('Province not found');
    //         }
    //     }
    //     if(wardCode){
    //         const wardExist=await WardRepository.getWardByCode(wardCode);
    //         if(!wardExist){
    //             throw new Error('Ward not found');
    //         }
    //     }
    //     const postUpdate={
    //         title:title ?? postExists.title,
    //         description:description ?? postExists.description,
    //         address:address ?? postExists.address,
    //         price:price ?? postExists.price,
    //         ward_code:wardCode ?? postExists.ward_code,
    //         province_code:provinceCode ?? postExists.province_code,
    //         phone_number:phoneNumber ?? postExists.phone_number,
    //         // categories:categories ?? postExists.categories
    //     }

    //     // Ảnh: hỗ trợ 2 kiểu dữ liệu
    //     // 1) Kiểu mới: keepOldImages + newImages
    //     // 2) Kiểu cũ: images (mảng đầy đủ)
    //     if (keepOldImages !== undefined || newImages !== undefined) {
    //         const currentImages = await ImagePostRepository.getListImageByPostId(postId);
    //         const currentUrls = currentImages.map(img => img.image_url);
    //         const currentUrlSet = new Set(currentUrls);

    //         let keepList;
    //         if (keepOldImages === undefined) {
    //             // Mặc định: nếu không gửi keepOldImages, giữ toàn bộ ảnh hiện tại (append)
    //             keepList = currentUrls;
    //         } else {
    //             keepList = Array.isArray(keepOldImages) ? keepOldImages : [];
    //             // Xác thực toàn bộ keepOldImages đều thuộc post hiện tại
    //             for (const url of keepList) {
    //                 if (!currentUrlSet.has(url)) {
    //                     throw new Error('Old image not belong to post');
    //                 }
    //             }
    //         }

    //         const finalImageList = [
    //             ...keepList,
    //             ...(Array.isArray(newImages) ? newImages : [])
    //         ];

    //         // Xóa toàn bộ và tạo lại theo danh sách mới
    //         await ImagePostRepository.deleteImagePost(postId);
    //         if (finalImageList.length > 0) {
    //             const imageValues = finalImageList.map((imageUrl) => ({
    //                 post_id: postId,
    //                 image_url: imageUrl
    //             }));
    //             await ImagePostRepository.createManyImagePost(imageValues);
    //         }
    //     } else if (images !== undefined) {
    //         // Kiểu cũ: nếu truyền 'images' thì coi đó là danh sách cuối cùng
    //         const imageValues = images.map((imageUrl) => ({
    //             post_id: postId,
    //             image_url: imageUrl
    //         }));
    //         await ImagePostRepository.deleteImagePost(postId);
    //         await ImagePostRepository.createManyImagePost(imageValues);
    //     }

    //     if(categories !=null && categories.length > 0){
    //         for(const id of categories){
    //             const categoryExist=await Category.getCategoryRepoById(id);
    //             if(!categoryExist){
    //                 throw new Error('Category not found');
    //             }
    //         }

    //         const postCategoriesValues = categories.map((categoryId) => ({
    //             post_id: postId,
    //             category_id: categoryId
    //         }));
    //         console.log(postCategoriesValues);
    //         await PostCategoriesRepository.deletePostCategories(postId);
    //         await PostCategoriesRepository.createManyPostCategoriesRepo(postCategoriesValues);
    //     }

    //     await PostRepository.updatePostRepo(postUpdate,postId);

    //     return await this.getDetailByPostId(postId); // trả ra detail

    // };

    async updatePost(post) {
        const postId = post.postId;
        const postExists = await PostRepository.findById(postId);
        if (!postExists) throw new Error('Post not found');

        // Các trường cơ bản
        const postUpdate = {
            title: post.title ?? postExists.title,
            description: post.description ?? postExists.description,
            address: post.address ?? postExists.address,
            price: post.price ?? postExists.price,
            ward_code: post.wardCode ?? postExists.ward_code,
            province_code: post.provinceCode ?? postExists.province_code,
            phone_number: post.phoneNumber ?? postExists.phone_number,
        };

        // Ảnh
        const keepOldImages = post.keepOldImages; // optional array
        const newImages = post.newImages;         // optional array
        const images = post.images;               // kiểu cũ, optional

        const currentImages = await ImagePostRepository.getListImageByPostId(postId);
        const currentUrls = currentImages.map(img => img.image_url);
        const currentUrlSet = new Set(currentUrls);

        let finalImageList = [];

        if (keepOldImages !== undefined || newImages !== undefined) {
            // Kiểu mới: keepOldImages + newImages
            let keepList = [];
            if (keepOldImages === undefined) {
                // Mặc định giữ tất cả ảnh hiện tại
                keepList = currentUrls;
            } else {
                keepList = Array.isArray(keepOldImages) ? keepOldImages : [];
                for (const url of keepList) {
                    if (!currentUrlSet.has(url)) {
                        throw new Error('Old image not belong to post');
                    }
                }
            }

            finalImageList = [...keepList, ...(Array.isArray(newImages) ? newImages : [])];

            await ImagePostRepository.deleteImagePost(postId);
            if (finalImageList.length > 0) {
                const imageValues = finalImageList.map(url => ({ post_id: postId, image_url: url }));
                await ImagePostRepository.createManyImagePost(imageValues);
            }

        } else if (images !== undefined) {
            // Kiểu cũ: thay toàn bộ ảnh
            finalImageList = Array.isArray(images) ? images : [];
            await ImagePostRepository.deleteImagePost(postId);
            if (finalImageList.length > 0) {
                const imageValues = finalImageList.map(url => ({ post_id: postId, image_url: url }));
                await ImagePostRepository.createManyImagePost(imageValues);
            }

        } else {
            // Không gửi gì về ảnh → giữ nguyên DB
        }

        // Categories
        if (post.categories != null && Array.isArray(post.categories) && post.categories.length > 0) {
            for (const id of post.categories) {
                const categoryExist = await Category.getCategoryRepoById(id);
                if (!categoryExist) throw new Error('Category not found');
            }
            const postCategoriesValues = post.categories.map((categoryId) => ({
                post_id: postId,
                category_id: categoryId
            }));
            await PostCategoriesRepository.deletePostCategories(postId);
            await PostCategoriesRepository.createManyPostCategoriesRepo(postCategoriesValues);
        }

        // Cập nhật post
        await PostRepository.updatePostRepo(postUpdate, postId);

    return await this.getDetailByPostId(postId);
}



    async searchPost(post,page,limit){
        const searchText=post.searchText;
        const wardCode=post.wardCode;
        const provinceCode=post.provinceCode;
        const userId=post.userId;
        const userPosterId=post.userPosterId;
        const status=post.status;
        const categoryIds=post.categoryIds;   
        
        if(userId){
            const user=await UserRepository.findByIdUserRepo(userId);
            if(!user){
                throw new Error('User not found');
            }
        }
        if(status){
            if(!(Object.values(PostStatus).includes(status))){
            throw new Error('Status not found');
        }
        }
        if(provinceCode){
            const province=await ProvinceRepository.getProvinceByCode(provinceCode);
            if(!province){
                throw new Error('Province not found');
            }
        }

        if(wardCode){
            const ward=await WardRepository.getWardByCode(wardCode);
            if(!ward){
                throw new Error('Ward not found');
            }
        }
        if (categoryIds && categoryIds.length !== 0) {
            if (Array.isArray(categoryIds)) { //categoryIds
                for(const e of categoryIds){
                    const categoryExist=await Category.getCategoryRepoById(e);
                    if(!categoryExist){
                        throw new Error('Category not found');
                    }
                }
            } else {
                throw new Error('Category ID is not an array');
            }
        }
        
        const result= await PostRepository.searchPostRepo(searchText,wardCode,provinceCode,userPosterId,status,categoryIds,page,limit);
        await Promise.all(
            result.content.map(async (item) => {
                const postFavorite = await PostFavorite.getFavoriteExists(item.id, userId);
                item.isFavorite = !!postFavorite;
            })
        );
        return result;
    }


    async updateStatusPostService(postId,status,reasonReject,reasonViolation,violationId){

        //khi có thanh toán thì check lại 
        // có 2 case reject thì chỉnh sửa lại rồi lại sang pending 
        // không refund khi bị vi phạm hoặc người dùng ẩn tin
        // phát triển thêm đăt giới hạn bị từ chối repost không mất phí
        const postExists=await PostRepository.findById(postId);
        if(!postExists){
            throw new Error('Post not found');
        }

        if(!ValidateUtils.isValidPostStatus(status)){
            throw new Error('Status not found');
        }

        const currentStatus=postExists.status;
        
        const VALID_TRANSITIONS = {
            [PostStatus.PENDING]: [PostStatus.APPROVED, PostStatus.REJECTED],
            [PostStatus.APPROVED]: [PostStatus.HIDDEN, PostStatus.VIOLATION],
            [PostStatus.REJECTED]: [PostStatus.PENDING], // cho phép gửi lại
            [PostStatus.HIDDEN]: [PostStatus.APPROVED],
            [PostStatus.VIOLATION]: [], // không cho đổi nữa
        };
        const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowedNext.includes(status)) {
           throw new Error(`Invalid transition from ${currentStatus} to ${status}`);
        }
        const violation=await Violation.getDetailViolationRepo(violationId) ;
        if(!violation && status==PostStatus.VIOLATION){
            throw new Error('Violation not found');
        }
        const post={
            status:status,
            reason_reject:status === PostStatus.REJECTED ? reasonReject : null,
            reason_violation:status === PostStatus.VIOLATION ? reasonViolation : null,
            violation_id:status === PostStatus.VIOLATION ? violationId : null
        }
        return await PostRepository.updateStatusPostRepo(postId,post);
    }
    async updateIsPinnedPostService(postId){
        const postExists=await PostRepository.findById(postId);
        if(!postExists){
            throw new Error('Post not found');
        }
        const post={
            is_pinned:!postExists.is_pinned
        }
        return await PostRepository.updateWhere({id:postId},post);
    }

    //gia hạn tin
    async updatePostExtension(postId,paymentId,userId){
        const post=await PostRepository.findById(postId);
        if(!post){
            throw new Error('Post not found');
        }
        if(post.status != 'EXPIRED'){
            throw new Error('Bài viết chưa hết hạn');
        }

        const user=await UserRepository.findByIdUserRepo(userId);
        if(!user){
            throw new Error('User not found');
        }
       
        //check gói
        const paymentExists = await PaymentRepo.findOne({id:paymentId,user_id:userId});
        if(!paymentExists){
            throw new Error('Payment Not Found');
        }

        if(paymentExists.usage_remaining<=0){
            throw new Error('Bạn không còn lượt đăng bài');
        }

        if(paymentExists.expired_at<new Date()){
            throw new Error('Gói đã hết hạn')
        }
        if(post.user_id != userId){
            throw new Error('Bạn không phải người đăng bài');
        }
        
        const expired_at = new Date();
        expired_at.setDate(expired_at.getDate() + paymentExists.duration_used);
        const expiredAtFormatted = expired_at.toISOString().slice(0, 19).replace('T', ' ');
        await PaymenUsageRepository.create({
            payment_id: paymentExists.id,
            post_id:postId,
            used_at:expiredAtFormatted,
            action_type:'EXTEND' // hết hạn
        })
        await PaymentRepo.update(paymentId,{usage_remaining:paymentExists.usage_remaining-1});

        const updatePost=await PostRepository.update(postId,{
            status:'APPROVED',
            expired_at:expiredAtFormatted
        });

        return await PostRepository.findById(postId);
    
    }
}
export default new PostService();