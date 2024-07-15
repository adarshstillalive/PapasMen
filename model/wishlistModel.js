const mongoose = require('mongoose');

const wishlistSchema = mongoose.Schema({

  UserId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  Products:[{
    Product:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Product',
      required:true
    }
  }]

},
{
  timestamps: true
})


module.exports = mongoose.model('Wishlist',wishlistSchema)