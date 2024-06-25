const User = require('../model/userModel')
const Swal = require('sweetalert2')

const isUser = async (req,res,next)=>{
  try {
    if(req.session.userData){
      const checkActive = await User.findOne({'_id':req.session.userData._id,"isActive":true});
      if(checkActive){
        next();
      }else{
        req.session.destroy()
        res.redirect('/signin')
         
      }

    }else{
      res.redirect('/signin')
    }
  } catch (error) {
    console.log('error')
  }
}

const notUser = async (req,res,next)=>{
  try {
    if(req.session.userData && req.session.userData.isActive){
      res.redirect('/')
    }else{
      next();
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
  isUser,
  notUser
}