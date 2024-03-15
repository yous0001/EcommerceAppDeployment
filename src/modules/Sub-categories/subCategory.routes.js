import { Router } from "express"
import * as subcategorycontroller from './subCategory.controller.js'
import expressAsyncHandler from "express-async-handler"
import { multerMiddleHost } from "../../middlewares/multer.js"
import { allowedExtensions } from "../../utils/allowed-extensions.js"
import { auth } from "../../middlewares/auth.middleware.js"
import { endPointsRoles } from "../Categories/category.endpoints.js"


const router=Router()

router.post('/:categoryId',auth(endPointsRoles.addcategory),multerMiddleHost({extentions:allowedExtensions.image}).single('image')
,expressAsyncHandler(subcategorycontroller.addSubCategory))

router.put('/:categoryId',auth(endPointsRoles.addcategory),multerMiddleHost({extentions:allowedExtensions.image}).single('image')
,expressAsyncHandler(subcategorycontroller.updatesubCategory))

router.delete('/:categoryId',auth(endPointsRoles.addcategory),multerMiddleHost({extentions:allowedExtensions.image}).single('image')
,expressAsyncHandler(subcategorycontroller.deletesubCategory))

router.get('/',auth()
,expressAsyncHandler(subcategorycontroller.getallsubcategories))

export default router