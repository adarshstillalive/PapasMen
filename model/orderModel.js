const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({

  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  Products: [{
    Product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    Version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product.Versions'
    },
    Quantity: {
      type: Number,
      required: true
    }
  }],
  Address: [{
    Fname: {
      type: String
    },
    Lname: {
      type: String
    },
    Housename: {
      type: String
    },
    City: {
      type: String
    },
    State: {
      type: String
    },
    Pincode: {
      type: Number
    },
    Phone: {
      type: Number
    }
  }],
  TotalAmount: {
    type: Number,
    required: true
  },
  Coupon:{
    type:String,
    default:'NIL'
  },
  OrderNotes: {
    type: String,

  },
  OrderId: {
    type : String,
    required : true 
  },
  Orderstatus:{
    type:String,
    enum:['Order Placed','Shipped','Delivered','Cancelled','Returned', 'Payment failed'],
    default:'Order Placed'
  },
  PaymentMethod : {
    type : String,
    enum:['Cash On Delivery','Paypal','Wallet'],
    default:'Cash On Delivery'
  },
  CancellingReason : {
    type:String,
  },
  ReturningReason : {
    type:String,
  },
  CancelledDate : { 
    type: Date
  },
  ShippedDate : { 
    type: Date
  },
  DeliveredDate : { 
    type: Date
  },
  ReturnedDate : { 
    type: Date
  },
}, {
  timestamps: true
})

module.exports = mongoose.model('Order',orderSchema)