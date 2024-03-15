
import { Router } from "express";
import * as authController from './auth.controller.js';
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";
const router = Router();


router.post('/', expressAsyncHandler(authController.signUp))
router.get('/verify-email', expressAsyncHandler(authController.verifyEmail))


router.get('/getuser', auth(),expressAsyncHandler(authController.getUserData))
router.post('/login', expressAsyncHandler(authController.signIn))
router.put('/update',auth(),expressAsyncHandler(authController.updateProfileUser))
router.delete('/delete',auth(),expressAsyncHandler(authController.deleteProfileUser))



export default router;