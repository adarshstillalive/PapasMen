const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
  },
  Contact: {
    type: Number,
  },
  Referral: {
    type: String,
    required: true
  },
  Referred: {
    type: String,
  },
  Address:[{
    Fname:{
      type:String
    },
    Lname:{
      type:String
    },
    Housename:{
      type:String
    },
    City:{
      type:String
    },
    State:{
      type:String
    },
    Pincode:{
      type:Number
    },
    Phone:{
      type:Number
    }
  }],
  Password: {
    type: String,
  },
  isAdmin:{
    type:Number,
    default:0
  },
  isActive:{
    type:Boolean,
    default:true
  },
  PurchasedProducts: [{
    ProductId:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Product'
    },
    Reviewed: {
      type: Boolean,
      default: false
    }
  }],
  Cart:[{
    Product:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Product'
    },
    Version:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Product.Versions'
    },
    Quantity:{
      type:Number,
      required:true
    }
  }],
  Wishlist:[{
    WProduct:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Product'
    },
    WVersion:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Product.Versions'
    },
    WQuantity:{
      type:Number,
      default:1
    }
  }],
}, {
  timestamps: true
})

module.exports = mongoose.model('User', userSchema)