
const isAdmin = async (req,res,next)=>{
  try {
    if(req.session.isAdmin){
      next();
    }else{
      res.redirect('/admin/signin')
    }
  } catch (error) {
    console.log('error')
  }
}

const notAdmin = async (req,res,next)=>{
  try {
    if(req.session.isAdmin){
      res.redirect('/admin')
    }else{
      next();
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
  isAdmin,
  notAdmin
}