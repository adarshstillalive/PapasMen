const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const UserAuth = require('../../model/userAuthModel')

// FUNCTIONS
async function fetchData(){
  const dataCollection = [Size.find(),Color.find(),Category.find(),Brand.find()]
  const [sizeData,colorData,categoryData,brandData] = await Promise.all(dataCollection)
  const fetchedData = {sizeData,colorData,categoryData,brandData}
  return fetchedData;
}


const getCart = async(req,res)=>{
  try {

    const {sizeData,colorData,categoryData,brandData} = await fetchData()
    // Fetch user data and populate cart products with nested fields
    const userData = await User.findById(req.session.userData._id)
      .populate({
        path: 'Cart.Product',
        model: 'Product',
        populate: [
          { path: 'Brand', model: 'Brand' },
          { path: 'Category', model: 'Category' },
          { path: 'Versions.Color', model: 'Color' },
          { path: 'Versions.Size', model: 'Size' }
        ]
      });

    // Map over the user's cart items and populate versions
    const userCartData = await Promise.all(userData.Cart.map(async (cartItem) => {
      const product = cartItem.Product;
      const versionId = cartItem.Version;

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
          ...cartItem.toObject(),  // Convert Mongoose document to plain object
          Version: populatedVersion
        };
      }

      return cartItem.toObject();
    }));

    // Prepare data to be rendered in the view
    const pushData = { sizeData, categoryData, colorData, brandData, userCartData,userData };

    // Render the 'cart' view with the populated data
    res.render('user/cart', pushData);
  } catch (error) {
    console.log(error);
  }
}

const postCart = async (req,res)=>{
  try {
    const userData = await User.findOne({"_id":req.session.userData._id});
    for(let i=0;i<userData.Cart.length;i++){
      userData.Cart[i].Quantity = req.body.quantity[i]
    };
    await userData.save();
     
    res.redirect('/cart/checkout');
  } catch (error) {
    console.log(error);
  }
}


const postAddToCart = async (req, res) => {
  try {
    if(!req.session.userData){
      return res.status(302).redirect('/signin')
    }
       
    const productData = await Product.findOne({ "_id": req.body.ProductId });
    let flag = false;

    for (i = 0; i < productData.Versions.length; i++) {
      if (productData.Versions[i].Size == req.body.Size && productData.Versions[i].Color == req.body.Color && productData.Versions[i].Quantity >= req.body.Quantity) {

        const updateCart = {
          Product: productData._id,
          Version: productData.Versions[i]._id,
          Quantity: req.body.Quantity
        }

        const userData = await User.updateOne({ "_id": req.session.userData._id }, { $push: { "Cart": updateCart } })
        if (userData) {
          flag = true;
        }
      }

    }
    if (flag) {
      res.json({ success: true })
    } else {
      res.json({ success: false, message:'Adding to cart failed, try again' })
    }


   
  } catch (error) {
    console.log(error);
  }
}

const getRemoveProduct = async(req,res)=>{
  try {
    const productId = req.query.id;
    const removeProduct = await User.updateOne({"_id":req.session.userData._id},{$pull:{"Cart":{"_id":productId}}});
    if(removeProduct){
      req.flash('msg','Product removed successfully');
      res.redirect('/cart')
    }else{
      req.flash('msg','Product removing failed, Try again')
      res.redirect('/cart')
    }
  } catch (error) {
    console.log(error);
  }
}

const getCheckout = async(req,res)=>{
  try {
    const {sizeData,colorData,categoryData,brandData} = await fetchData()
    // Fetch user data and populate cart products with nested fields
    const userData = await User.findById(req.session.userData._id)
      .populate({
        path: 'Cart.Product',
        model: 'Product',
        populate: [
          { path: 'Brand', model: 'Brand' },
          { path: 'Category', model: 'Category' },
          { path: 'Versions.Color', model: 'Color' },
          { path: 'Versions.Size', model: 'Size' }
        ]
      });

    const userCartData = await Promise.all(userData.Cart.map(async (cartItem) => {
      const product = cartItem.Product;
      const versionId = cartItem.Version;

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
          ...cartItem.toObject(),  // Convert Mongoose document to plain object
          Version: populatedVersion
        };
      }

      return cartItem.toObject();
    }));

    const pushData = {
       sizeData, colorData, categoryData, brandData,userData,userCartData
    }

    res.render('user/checkout',pushData)
  } catch (error) {
    console.log(error);
  }
}


module.exports = {

  getCart,
  postCart,
  postAddToCart,
  getCheckout,
  getRemoveProduct,
}