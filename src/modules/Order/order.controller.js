import { DateTime } from 'luxon'
import cartModel from '../../../DB/Models/cart.model.js'
import couponUsersModel from '../../../DB/Models/coupon-users.model.js'
import orderModel from '../../../DB/Models/order.model.js'
import productModel from '../../../DB/Models/product.model.js'
import {couponValidation} from '../../utils/coupon.validation.js'
import { checkProductAvaliability } from '../Cart/utils/check-product.js'
import { QRCodeGeneration } from '../../utils/qr-code.js'

export const createOrder=async(req,res,next)=>{
    const {product,quantity,couponCode,paymentMethod,phoneNumbers,address,country,postalCode,city}=req.body

    const {_id:userId}=req.authUser
    
    let coupon=null
    if(couponCode){
        const isCouponValid=await couponValidation(couponCode,userId)
        if(isCouponValid.status)return next(new Error(isCouponValid.message,{cause:isCouponValid.status}))
        coupon=isCouponValid
    }
    const isProductAvalible=await checkProductAvaliability(product,quantity)
    if(!isProductAvalible)return next(new Error("product isn't avaliable",{cause:404}))
    
    let orderItems=[{
        title:isProductAvalible.title,
        quantity:quantity,
        price:isProductAvalible.appliedPrice,
        product:isProductAvalible._id
    }]

    let shippingPrice=orderItems[0].price*orderItems[0].quantity
    let totalPrice=shippingPrice

    if(coupon?.isFixed && coupon?.couponAmount>shippingPrice){
        return next(new Error("coupon is not valid",{cause:400}))
    }
    else if(coupon?.isFixed){
        totalPrice=shippingPrice-coupon.couponAmount
    }
    else if(coupon?.isPercentage){
        totalPrice=shippingPrice-(shippingPrice*coupon.couponAmount/100)
    }

    let orderStatus
    if(paymentMethod=='cash')orderStatus='placed'

    const createOrder=await orderModel.create(
        {   
            user:userId,
            orderItems,
            shippingAddress:{address,country,postalCode,city},
            phoneNumbers,
            shippingPrice,
            coupon:coupon?._id,
            totalPrice,
            paymentMethod,
            orderStatus
        }
    )

        isProductAvalible.stock-=quantity;
        await isProductAvalible.save()

        if(coupon){
            await couponUsersModel.updateOne({couponId:coupon._id,userId},{$inc:{usageCount:1}})
        }

    const orderqr=await QRCodeGeneration({orderStatus,orderId:createOrder._id})
    
    res.status(201).json({message:"order Created successfully",createOrder,orderqr})

    
}

export const makeOrderByCart=async(req,res,next)=>{
    const {couponCode,paymentMethod,phoneNumbers,address,country,postalCode,city}=req.body

    const {_id:userId}=req.authUser
    

    const userCart=await cartModel.findOne({userId})
    if(!userCart)return next(new Error("cart not found",{cause:404}))


    let coupon=null
    if(couponCode){
        const isCouponValid=await couponValidation(couponCode,userId)
        if(isCouponValid.status)return next(new Error(isCouponValid.message,{cause:isCouponValid.status}))
        coupon=isCouponValid
    }

    let orderItems=userCart.products.map(product =>{
        return {
            title:product.title,
            quantity:product.quantity,
            price:product.basePrice,
            product:product.productId
        }
    })
    


    let shippingPrice=userCart.subTotal
    let totalPrice=shippingPrice

    if(coupon?.isFixed && coupon?.couponAmount>shippingPrice){
        return next(new Error("coupon is not valid",{cause:400}))
    }
    else if(coupon?.isFixed){
        totalPrice=shippingPrice-coupon.couponAmount
    }
    else if(coupon?.isPercentage){
        totalPrice=shippingPrice-(shippingPrice*coupon.couponAmount/100)
    }

    let orderStatus
    if(paymentMethod=='cash')orderStatus='placed'

    const createOrder=await orderModel.create(
        {   
            user:userId,
            orderItems,
            shippingAddress:{address,country,postalCode,city},
            phoneNumbers,
            shippingPrice,
            coupon:coupon?._id,
            totalPrice,
            paymentMethod,
            orderStatus
        }
    )

        
        for(const item of orderItems){
            await productModel.updateMany({_id:item.product},{$inc:{stock:-item.quantity}})
        }
        
        
        if(coupon){
            await couponUsersModel.updateOne({couponId:coupon._id,userId},{$inc:{usageCount:1}})
        }
    res.status(201).json({message:"order Created successfully",createOrder})

}


export const deliverorder=async(req,res,next)=>{
    const {orderId}=req.params
    const {_id:userId}=req.authUser
    
    console.log("hello");
    
    const updateOrder=await orderModel.findOneAndUpdate({
        _id:orderId,
        orderStatus:{$in:["paid","placed"]}
    },
    {
        orderStatus:'delivered',
        deliveredAt:DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy:userId,
        isDelivered:true
    },{new:true})
    if(!updateOrder){
        return next(new Error("updated failed",{cause:400}))
    }
    res.status(200).json({success:true,message:"order delivered successfully",order:updateOrder})

}