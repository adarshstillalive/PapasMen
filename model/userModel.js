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
    required: true
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
    required: true
  },
  isAdmin:{
    type:Number,
    default:0
  },
  isActive:{
    type:Boolean,
    default:true
  },
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
})

module.exports = mongoose.model('User', userSchema)