const mongoose = require('mongoose');

const referralSchema = mongoose.Schema({
  Name: {
    type: String,
    default:'Referral'
  },
  Amount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Referral',referralSchema)