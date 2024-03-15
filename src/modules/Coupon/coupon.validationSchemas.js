import Joi from "joi";
import { generalValidationRule } from "../../utils/general.validation.rule.js";

export const addCouponSchema={
    body:Joi.object({
        couponCode:Joi.string().required().min(3).max(15).alphanum(),
        couponAmount:Joi.number().required().min(1),
        isFixed:Joi.boolean(),
        isPercentage:Joi.boolean(),
        fromDate:Joi.date().greater(Date.now()-(1000*60*60*24)).required(),
        toDate:Joi.date().greater(Joi.ref('fromDate')).required(),
        Users:Joi.array().items(
            Joi.object({
                userId:generalValidationRule.dbId.required(),
                maxUsage:Joi.number().required().min(1)
            })
        )
    })
}