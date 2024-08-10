const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');

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
    const userData = await User.findById(req.session.userData._id)
      .populate({
        path: 'Wishlist.WProduct',
        model: 'Product',
        populate: [
          { path: 'Brand', model: 'Brand' },
          { path: 'Category', model: 'Category' },
          { path: 'Versions.Color', model: 'Color' },
          { path: 'Versions.Size', model: 'Size' }
        ]
      });

    // Map over the user's cart items and populate versions
    const userWishlist = await Promise.all(userData.Wishlist.map(async (wishlistItem) => {
      const product = wishlistItem.WProduct;
      const versionId = wishlistItem.WVersion;

      // Find the specific version in product's Versions array
      const version = product.Versions.find(v => v._id.equals(versionId));

      if (version) {
        // Populate Color and Size in the found version
        const populatedVersion = await Product.populate(version, [
          { path: 'Color', model: 'Color' },
          { path: 'Size', model: 'Size' }
        ]);


        // Return the cart item with populated version
        return {
          ...wishlistItem.toObject(),  // Convert Mongoose document to plain object
          Version: populatedVersion
        };
      }

      return wishlistItem.toObject();
    }));
    const pushData = {
      sizeData,  
      colorData, 
      categoryData, 
      brandData,
      userData,
      userWishlist
    }

    res.render('user/wishlist',pushData)
  } catch (error) {
    console.log(error);
  }
}


const postAddToWishlist = async (req,res)=>{
  try {
    if (!req.session.userData) {
      req.session.redirectUrl = `/product?id=${req.body.formObj.ProductId}`
      return res.status(302).redirect('/signin');
    }
    const { Size, Color, ProductId } = req.body.formObj;

    if(!Color){
      res.json({ success: false, message: 'Select a color' });
    }else if(!Size){
      res.json({ success: false, message: 'Select a size' });
    }else{

      
    // Fetch user data and populate the cart products
    const user = await User.findOne({ _id: req.session.userData._id })

    // Fetch the product data
    const product = await Product.findOne({ _id: ProductId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let flag = false;

    // Check if the product and version already exist in the user's wishlist
    if(user.Wishlist.length>0){
    for (let i = 0; i < user.Wishlist.length; i++) {
      if (user.Wishlist[i].WProduct.equals(ProductId)) {
        for (let j = 0; j < product.Versions.length; j++) {
          if (product.Versions[j].Size.equals(Size) && product.Versions[j].Color.equals(Color)) {
            if (user.Wishlist[i].WVersion.equals(product.Versions[j]._id)) {
              
              flag = true;
              break;
            }
          }
        }
      }
      if (flag) break;
    }
  }

    // If the product version is not in the cart, add it
    if (!flag) {
      for (let i = 0; i < product.Versions.length; i++) {
        if (product.Versions[i].Size.equals(Size) && product.Versions[i].Color.equals(Color)) {
          const updateWishlist = {
            WProduct: product._id,
            WVersion: product.Versions[i]._id,
          };
          user.Wishlist.push(updateWishlist);
          await user.save();
          flag = true;
          break;
        }
      }
    }

    if (flag) {
      res.json({ success: true, count : user.Wishlist.length});
    } else {
      res.json({ success: false, message: 'Adding to wishlist failed, try again' });
    }

    }
    

  } catch (error) {
    console.log(error);
  }
}


const getRemoveProduct = async(req,res)=>{
  try {
    const productId = req.query.id;
    const removeProduct = await User.updateOne({ "_id": req.session.userData._id }, { $pull: { "Wishlist": { "WProduct": productId } } });

    if(removeProduct){
      res.redirect('/wishlist')
    }else{
      res.redirect('/wishlist')
    }
  } catch (error) {
    console.log(error);
  }
}


const getRemoveFromWishlist = async(req,res)=>{
  try {
    const productId = req.query.id;
    const removeProduct = await User.updateOne({ "_id": req.session.userData._id }, { $pull: { "Wishlist": { "WProduct": productId } } });
    const userData = await User.findOne({"_id": req.session.userData._id })

    if(removeProduct.modifiedCount>0){
      res.json({success:true, count:userData.Wishlist.length})
    }else{
      res.json({success:false})
    }
  } catch (error) {
    console.log(error);
  }
}

const getaddToCartFromWishlist = async (req,res)=>{
  try {
    const {id} = req.query;
    const userData = await User.findOne({"_id":req.session.userData._id});
    let Product,Version,Quantity;
    userData.Wishlist.forEach(set=>{
      if(set._id.equals(id)){
        Product = set.WProduct
        Version = set.WVersion
        Quantity = set.WQuantity
      }
    })
    const updateCart = {Product, Version, Quantity};
    userData.Cart.push(updateCart);
    userData.Wishlist.pull({"_id":id});
    
    await userData.save();
    res.redirect('/wishlist')


  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  postAddToWishlist,
  getWishlist,
  getRemoveProduct,
  getRemoveFromWishlist,
  getaddToCartFromWishlist,
}