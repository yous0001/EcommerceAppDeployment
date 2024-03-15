import { scheduleJob } from "node-schedule";
import couponModel from "../../DB/Models/coupon.model.js";
import {DateTime} from "luxon";
export function cronToChangeExpiredCoupons(){
    scheduleJob('0 0 0 * * *',async () =>{
        console.log("cronToChangeExpiredCoupons");
        const coupons= await couponModel.find({couponStatus:"valid"})
        for(const coupon of coupons){
            if(DateTime.fromISO(coupon.toDate) < DateTime.now()){
                coupon.couponStatus='expired'
                await coupon.save()
                console.log(coupon);
            }
        }
    })
}