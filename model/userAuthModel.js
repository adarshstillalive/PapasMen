const mongoose = require('mongoose');

const userAuthSchema = mongoose.Schema({

  Email:{
    type:String,
    required:true
  },
  Name:{
    type:String,
    required:true
  },
  isActive:{
    type:Boolean,
    default:true
  }

})

module.exports = mongoose.model('UserAuth',userAuthSchema);