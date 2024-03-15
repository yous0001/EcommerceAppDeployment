import { Router } from "express";
import * as orderController from './order.controller.js'
import { systemRoles } from "../../utils/system-roles.js";
import expressAsyncHandler from "express-async-handler";
import { auth } from "../../middlewares/auth.middleware.js";

const router=Router()

router.post(
    '/',
    auth([systemRoles.USER]),
    expressAsyncHandler(orderController.createOrder)
)
router.post(
    '/cartToOrder',
    auth([systemRoles.USER]),
    expressAsyncHandler(orderController.makeOrderByCart)
)

router.put('/deliver/:orderId',auth([systemRoles.DELIVERY]),expressAsyncHandler(orderController.deliverorder));


export default router