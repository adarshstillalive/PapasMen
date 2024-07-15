const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

  Name: {
    type: String,
    required: true
  },
  Brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  Category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  Image:[{
    type:String
  }],
  Description: {
    type: String,
    required:true
  },
  Price:{
    type: Number,
    required:true
  },
  MRP:{
    type:Number,
    required:true
  },
  isActive:{
    type:Boolean,
    default:true
  },
  Reviews: [{
    UserId:{
      type: mongoose.Schema.Types.ObjectId
    },
    UserName:{
      type: String,
    },
    Date: {
      type: Date,
      default: new Date()
    },
    Review: {
      type: String
    },
    Rating: {
      type: Number
    }
  }],
  Versions:[{
    Color:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Color'
    },
    Size:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Size'
    },
    Quantity:{
      type:Number,
      required:true,
      min:0
    }
  }],
  Offer:{
    OfferName:{
      type:String,
    },
    Description:{
      type:String
    },
    Start:{
      type:Date,
    },
    End:{
      type:Date,
    },
    Percentage:{
      type:Number,
    }
  },
  OfferExpiry:{
    type:Boolean,
    default:false
  }
  
},{timestamps:true})


module.exports = mongoose.model('Product',productSchema)