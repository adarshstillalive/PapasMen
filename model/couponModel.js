const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({

  Name:{
    type:String,
    required:true
  },
  Description:{
    type:String
  },
  End:{
    type: Date
  },
  Value:{
    type:Number,
    required:true
  },
  MinPurchase:{
    type:Number,
    default:0,
  }


},
{
  timestamps: true
})


module.exports = mongoose.model('Coupon',couponSchema);