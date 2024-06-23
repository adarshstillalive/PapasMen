const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({

  Name:{
    type: String,
    required:true
  },
  isActive:{
    type:Boolean,
    required:true
  }
})

module.exports = mongoose.model('Brand',brandSchema)