const mongoose = require('mongoose');

const sizeSchema = mongoose.Schema({

  Name:{
    type:Number,
    required:true
  },
  isActive:{
    type:Boolean,
    default:true
  }

})

module.exports = mongoose.model('Size',sizeSchema)