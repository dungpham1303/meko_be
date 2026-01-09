const stringCommonUtils={
    queryPostDetail:(condition)=>{
        const whereClause = condition && condition.trim() !== '' ? `WHERE ${condition}` : '';
        
        return `select
                    p.id as id,
                    p.user_id as userId,
                    u.email as emailPoster,
                    u.username as userNamePoster,
                    u.avatar as avatarPoster,  
                    p.title,
                    p.description,
                    p.price,
                    p.address,
                    p.status,
                    p.reason_reject as reasonReject,
                    p.reason_violation as reasonViolation,
                    p.phone_number as phoneNumber,
                    p.expired_at as expiredAt,
                    p.is_pinned as isPinned,
                    p.rating as rating,
                    p.created_at as createdAt,
                    p.updated_at as updatedAt,
                    p.ward_code as wardCode,
                    p.province_code as provinceCode,
                    p.old_product_percent as oldProductPercent,
                    pu.id as paymentUsageId,
                    pu.post_id as usagePostId,
                    pu.used_at as usageUsedAt,
                    w.name as wardName,
                    pr.name as provinceName,
                    GROUP_CONCAT(DISTINCT ip.image_url) AS images,
                    GROUP_CONCAT(DISTINCT c.name) AS categories
                from post p
                left join 
                    image_post ip on p.id = ip.post_id
                left join 
                    post_categories pc on p.id = pc.post_id
                left join 
                    categories c on pc.category_id=c.id
                left join 
                    users u on p.user_id=u.id  
                left join 
                    wards w on p.ward_code=w.code           
                left join 
                    provinces pr on p.province_code=pr.code       
                left join 
                    (
                        select pu_final.*
                        from payment_usages pu_final
                        inner join (
                            select post_id, max(used_at) as max_used_at
                            from payment_usages
                            group by post_id
                        ) m on m.post_id = pu_final.post_id and pu_final.used_at = m.max_used_at
                        inner join (
                            select post_id, used_at, max(id) as max_id
                            from payment_usages
                            group by post_id, used_at
                        ) mx on mx.post_id = pu_final.post_id and mx.used_at = pu_final.used_at and mx.max_id = pu_final.id
                    ) pu on pu.post_id = p.id
                ${whereClause}
                GROUP BY 
                    p.id, p.user_id, p.title, p.description, p.price, p.address, 
                    p.status, p.expired_at, p.is_pinned, p.rating, p.created_at, p.updated_at, pu.id, pu.post_id, pu.used_at`
    }
}
export default stringCommonUtils;
