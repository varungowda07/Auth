const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: {
        type:String,
        required:[true,'Email required!'],
        unique:true,
        minLength:[5,"email should be atleast 5 characters"],
        maxLength:[50,'email should be less then 20 characters']
    },
    password:{
        type:String,
        required:[true,'Password cannot be empty'],
        select:false,
        minLength:[3,'Password must be atlest 3 characters'],
        maxLength:[100,'Password must be less then 100 characters']
    },
    verified:{
        type:Boolean,
        default:false
    },
    verificationCode:{
        type:String,
        select:false
    },
    verificationCodeValidation:{
        type:Number,
        select:false
    },
    forgetPasswordCode:{
        type:String,
        select:false
    },
    forgetPasswordCodeValidation:{
        type:Number,
        select:false
    },
},
{
    timestamps:true
});
module.exports = mongoose.model('User',userSchema);