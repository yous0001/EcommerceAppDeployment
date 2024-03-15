import couponUsersModel from "../../../DB/Models/coupon-users.model.js"
import couponModel from "../../../DB/Models/coupon.model.js"
import userModel from "../../../DB/Models/user.model.js"
import { couponValidation } from "../../utils/coupon.validation.js"


export const addCoupon=async(req,res,next)=>{
    const {couponCode,couponAmount,isFixed,isPercentage,fromDate,toDate,Users}=req.body
    const {_id:addedBy}=req.authUser

    const isCouponExists=await couponModel.findOne({couponCode})
    if(isCouponExists)return next(new Error("coupon is already exists",{cause:409}))
    if(isFixed===isPercentage)return next(new Error("coupon can be either fixed or percentage",{cause:400}))

    if(isPercentage&&couponAmount>100)return next(new Error("coupon can't be more than 100%",{cause:409}))
    if(couponAmount<=0)return next(new Error("coupon amount can't be less than or equal 0",{cause:409}))
    const couponobj={
        couponCode,
        couponAmount,
        isFixed,
        isPercentage,
        fromDate,
        toDate,
        addedBy
    }
    const coupon=await couponModel.create(couponobj)

    const userIds=[]
    for( const user of Users){
        userIds.push(user.userId)
    }
    const isUserExists=await userModel.find({_id:{$in:userIds}})
    if(isUserExists.length!==Users.length){
        return next(new Error("User not found",{cause:404}))
    }

    const couponUsers=await couponUsersModel.create(Users.map((user)=>{
        return {...user,couponId:coupon._id}
    }))
    res.status(201).json({success:true,message:"coupon has sucessfully added",coupon,couponUsers})
}


export const validateCouponApi=async(req,res,next)=>{
    const {couponCode}=req.body
    const {_id:userId}=req.authUser

    const isCouponValid=await couponValidation(couponCode,userId)
    if(isCouponValid.status){
        return next(new Error(isCouponValid.message,{cause:couponCode.status}))
    }
    res.status(200).json({message:"coupon is valid",coupon:isCouponValid})
}