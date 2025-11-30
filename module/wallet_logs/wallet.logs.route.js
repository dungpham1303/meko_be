import express from 'express';
const router=express.Router();
import Controller from './wallet.logs.controller.js';
import Middleware from '../../middlewares/authenticate.js';


router.get('/get-all',Middleware.authenticate,Controller.getAll);

export default router;