const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({

  Name:{
    type:String,
    required:true
  },
  isActive:{
    type:Boolean,
    required:true
  }
})


module.exports = mongoose.model('Category',categorySchema)