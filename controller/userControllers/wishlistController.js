const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Wishlist = require('../../model/wishlistModel')
const UserAuth = require('../../model/userAuthModel')

// Functions
async function fetchData() {
  const dataCollection = [Size.find(), Color.find(), Category.find(), Brand.find()]
  const [sizeData, colorData, categoryData, brandData] = await Promise.all(dataCollection)
  const fetchedData = { sizeData, colorData, categoryData, brandData }
  return fetchedData;
}


const getWishlist = async (req,res)=>{
  try {
    const { sizeData, colorData, categoryData, brandData } = await fetchData()
    const wishlistData = await Wishlist.findOne({"UserId": req.session.userData._id}).populate('Products.Product')
    .populate({ path: 'Products', populate: {path: 'Product', populate:[{path:'Brand',ref:'Brand'},{path:'Category',ref:'Category'}]}});
    const userData = await User.findById(req.session.userData._id)

    const pushData = {
      sizeData, 
      colorData, 
      categoryData, 
      brandData, 
      wishlistData, 
      userData,
    }

    res.render('user/wishlist',pushData)
  } catch (error) {
    console.log(error);
  }
}


const postAddToWishlist = async (req,res)=>{
  try {
    const {productId} = req.body;
    if(req.session.userData){
      let wishlist = await Wishlist.findOne({"UserId":req.session.userData._id});

    if(!wishlist){
      wishlist = new Wishlist({
        UserId:req.session.userData._id,
        Products:[{Product:productId}]
      })
    }else{
      const productExists = wishlist.Products.some(product => product.Product.toString() === productId);

      if (!productExists) {
        // If the product is not in the wishlist, add it
        wishlist.Products.push({ Product: productId });
      } else {
        return res.json({ success: false, message: 'Product already in wishlist' });
      }
    }

    const saveData = await wishlist.save()

    if(saveData){
      res.json({success:true})
    }else{
      res.json({success:false, message:'Error ocurred, try again'})
    }
    }else{
      return res.json({success: false, message : 'Please login'})
    }
    

  } catch (error) {
    console.log(error);
  }
}


const getRemoveFromWishlist = async(req,res)=>{
  try {
    const productId = req.query.id;
    const removeProduct = await Wishlist.updateOne({"UserId":req.session.userData._id},{$pull:{"Products":{"Product":productId}}});

    if(removeProduct){
      res.redirect('/wishlist')
    }else{
      res.redirect('/wishlist')
    }
  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  postAddToWishlist,
  getWishlist,
  getRemoveFromWishlist,
}