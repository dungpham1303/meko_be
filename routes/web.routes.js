import express from 'express';
import authenticate from '../middlewares/authenticate.js';
const router = express.Router();

// Trang login
router.get('/', (req, res) => {
    res.render('login', { title: 'Đăng nhập' });
});
router.get('/login', (req, res) => {
    res.render('login', { title: 'Đăng nhập' });
});

router.get('/dashboard', (req, res) => {
    res.render('report/overview-report', { title: 'Báo cáo' });
});

//user
router.get('/list/user', (req, res) => {
    res.render('user/list-user', { title: 'Quản lý người dùng' });
});

//post
router.get('/list/post', (req, res) => {
    res.render('post/list-post', { title: 'Quản lý tin đăng' });
});

//category
router.get('/list/categories', (req, res) => {
    res.render('category/list-categories', { title: 'Quản lý danh mục' });
});

//violating content
router.get('/list/violating-content', (req, res) => {
    res.render('content/list-violating-content', { title: 'Quản lý nội dung' });
});

//report-port
router.get('/list/report-content', (req, res) => {
    res.render('report-content/list-report-content', { title: 'Quản lý nội dung tố cáo' });
});

//report
router.get('/report-revenue', (req, res) => {
    res.render('report/revenue-report', { title: 'Báo cáo' });
});

//payment-package
router.get('/list/payment-package', (req, res) => {
    res.render('payment-package/list-payment-package', { title: 'Quản lý gói đăng bài' });
});

router.get('/report-overview', (req, res) => {
    res.render('report/overview-report', { title: 'Báo cáo' });
});


export default router;
// xZ