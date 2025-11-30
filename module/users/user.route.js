import express from 'express';
const router=express.Router();
import UserValidation from './user.validation.js';
import userController from './user.controller.js';
import upload from '../../utils/upload_cloudinary.js';
import authenticate from '../../middlewares/authenticate.js';

router.post('/create',UserValidation.createUserValidation,userController.createUser);
router.get('/detail/:id',userController.getDetailUser);
router.put('/upload-avatar/:id',upload.single('avatar'),userController.uploadAvatar);
router.put('/update-user',authenticate.authenticate,UserValidation.updateUserValidation,userController.updateUserController);
router.get('/search',UserValidation.searchUserValidation,userController.searchUserController);
router.get('/profile',authenticate.authenticate,userController.getUserProfile);
router.put('/update-pin-wallet/:id',authenticate.authenticate,UserValidation.updatePinWalletValidation,userController.updatePinWalletController);
router.post('/create-pin-wallet',authenticate.authenticate,UserValidation.createPinWalletValidation,userController.createPinWalletController);
router.post('/get-statistical',authenticate.authenticate,userController.thongkeController);
export default router;