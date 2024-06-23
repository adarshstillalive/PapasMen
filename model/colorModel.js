const mongoose = require('mongoose');

const colorSchema = mongoose.Schema({

  Name:{
    type:String,
    required:true
  },
  isActive:{
    type:Boolean,
    default:true
  }

})

module.exports = mongoose.model('Color',colorSchema)