const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({

  Name:{
    type:String,
    required:true
  },
  isActive:{
    type:Boolean,
    required:true
  },
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
})


module.exports = mongoose.model('Category',categorySchema)