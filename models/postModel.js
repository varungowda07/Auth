const mongoose = require('mongoose');
const { ref } = require('process');

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required:[true,"Title cannot be empty"]
    },
    description:{
        type:String,
        required:[true,"Description cannot be empty"]
    },
    image:{
        type:String,
        required:[true,"Image cannot be empty"]
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},
{
    timestamps:true
});
 module.exports = mongoose.model('Post',postSchema);