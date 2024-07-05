const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({

  UserId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  Balance:{
    type:Number,
    default:0
  },
  Transaction:[{
    Type:{
      type:String,
      enum:['Debit','Credit','Refund'],
      required:true,
    },
    Amount:{
      type:Number,
      required:true
    },
    Date:{
      type:Date,
      default:Date.now()
    }
  }]

})

module.exports = mongoose.model('Wallet',walletSchema)