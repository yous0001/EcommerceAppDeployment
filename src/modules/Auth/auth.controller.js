import jwt  from "jsonwebtoken"
import userModel from "../../../DB/Models/user.model.js"
import bcrypt from "bcrypt"
import sendmailservice from "../services/send-email.service.js"


export const signUp=async(req,res,next)=>{
    const {username,email,password,phoneNumbers,addresses,role,age}=req.body
    const isEmailExists=await userModel.findOne({email})
    if(isEmailExists){
        return res.status(409).json({
            message:"email is already exists please try another email"
        })
    }
    const usertoken=jwt.sign({email},process.env.JWT_SECRET_VERFICATION,{expiresIn:'1d'})
    const isEmailsent=await sendmailservice({
        to:email,
        subject:"please verify your email",
        message:`<h1>please verify your email and click on thsi link</h1>
        <a href="http://localhost:3000/auth/verify-email?token=${usertoken}">Verify Email</a>
        `
    })
    if(!isEmailsent){
        return next(new Error("failed to send verification email",{cause:400 }))
    }
    const hashpassword=bcrypt.hashSync(password,+process.env.SALT_ROUNDS)
    const newUser =await userModel.create({
        username,email,password:hashpassword,phoneNumbers,addresses,role,age
    })
    return res.status(201).json({
        message:"user created succefully",
        newUser
    })

}


export const verifyEmail=async(req,res,next)=>{
    const {token}=req.query
    const decodeddata=await jwt.verify(token,process.env.JWT_SECRET_VERFICATION)
    const user =await userModel.findOneAndUpdate({email:decodeddata.email,isEmailVerified:false},{isEmailVerified:true},{new:true})
    if(!user){
        return next(new Error("user not found",{cause:404}))
    }
    res.status(200).json({
        success:true,
        message:"email verified succefully",
        data:user
    })
}


export const signIn=async(req,res,next)=>{
    const {email,password}=req.body
    const user=await userModel.findOne({email,isEmailVerified:true})
    if(!user){
        return next(new Error("invalid login",{cause:404}))
    }
    const isPasswordCorrect=bcrypt.compareSync(password,user.password)
    if(!isPasswordCorrect){
        return next(new Error("invalid login",{cause:404}))
    }
    const token=jwt.sign({email,id:user._id,isLoggedIn:true},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})
    user.isLoggedIn=true
    await user.save()
    res.status(200).json({
        success:true,
        message:"user logged in succefully",
        data:{
            token
        }
    })
} 

export const updateProfileUser=async(req,res,next)=>{
    const {username,email,phoneNumbers,addresses,role,age}=req.body
    const {_id}=req.authUser
    const user=await userModel.findById(_id)
    //change email if user wants
    if(email){
        const isEmailExists=await userModel.findOne({email})
        if(isEmailExists){
            return res.status(409).json({
                message:"email is already exists please try another email"
            })
        }
        const usertoken=jwt.sign({email},process.env.JWT_SECRET_VERFICATION,{expiresIn:'1d'})
        const isEmailsent=await sendmailservice({
            to:email,
            subject:"please verify your email",
            message:`<h1>please verify your email and click on thsi link</h1>
            <a href="${req.protocol}://${req.headers.host}/auth/verify-email?token=${usertoken}">Verify Email</a>
            `
        })
        if(!isEmailsent){
            return next(new Error("failed to send verification email",{cause:400 }))
        }
        user.email=email;
    }
    if(username) user.username=username
    if(phoneNumbers)user.phoneNumbers=phoneNumbers
    if(addresses)user.addresses=addresses
    if(role)user.role=role
    if(age)user.age=age
    await user.save()
    return res.status(200).json({
        message:"user updated succefully",
        user
    })
}

export const deleteProfileUser=async(req,res,next)=>{
    const {_id}=req.authUser
    const deleteduser=await userModel.findByIdAndDelete(_id)
    if(!deleteduser) return res.status(400).json({message:"deleted failed"})
    res.status(200).json({message:"user deleted succefully"})
}

export const getUserData=async(req,res,next)=>{
    const {_id}=req.authUser
    const user=await userModel.findByIdAndDelete(_id)
    if(!user) return res.status(404).json({message:"user not found"})
    res.status(200).json({message:"done",user})
}
