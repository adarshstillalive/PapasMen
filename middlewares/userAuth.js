
const isUser = async (req,res,next)=>{
  try {
    if(req.session.userData){
      next();
    }else{
      res.redirect('/signin')
    }
  } catch (error) {
    console.log('error')
  }
}

const notUser = async (req,res,next)=>{
  try {
    if(req.session.userData){
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