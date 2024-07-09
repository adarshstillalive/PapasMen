const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({

  Name:{
    type:String,
    required:true
  },
  Description:{
    type:String
  },
  Limit:{
    type:Number,
    required:true
  },
  Value:{
    type:Number,
    required:true
  }


})


module.exports = mongoose.model('Coupon',couponSchema);