const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const UserAuth = require('../../model/userAuthModel')


const getCart = async(req,res)=>{
  try {

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
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
    res.render('cart', pushData);
  } catch (error) {
    console.log(error);
  }
}


const postAddToCart = async (req, res) => {
  try {
    console.log(req.body);
    const userData = await User.findOne({ "_id": req.session.userData._id });
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
      req.flash('msg', 'Product added to Cart');
      res.json({ success: true })
    } else {
      req.flash('msg', 'Error occured');
      res.json({ success: false })
    }


  } catch (error) {
    console.log(error);
  }
}

const getCheckout = async(req,res)=>{
  try {
    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    const userData = await User.find({"_id":req.session.userData._id});

    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData,userData
    }

    res.render('checkout',pushData)
  } catch (error) {
    console.log(error);
  }
}


module.exports = {

  getCart,
  postAddToCart,
  getCheckout,
}