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
  isActive:{
    type:Boolean,
    default:true
  },
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
    },
    Price:{
      type:Number,
      required:true
    }
  }]
  
},{timestamps:true})


module.exports = mongoose.model('Product',productSchema)