const User = require('../model/userModel');

const checkCart = async(req,res,next)=>{
  try {
    const userData = await User.findOne({"_id":req.session.userData._id});
    if(userData.Cart.length>0){
      next()
    }else{
      res.redirect('/profile/orders')
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {checkCart}