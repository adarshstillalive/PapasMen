const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Coupon = require('../../model/couponModel')
const Wallet = require('../../model/walletModel')
const Order = require('../../model/orderModel')

// FUNCTIONS
async function fetchData() {
  const dataCollection = [Size.find(), Color.find(), Category.find(), Brand.find()]
  const [sizeData, colorData, categoryData, brandData] = await Promise.all(dataCollection)
  const fetchedData = { sizeData, colorData, categoryData, brandData }
  return fetchedData;
}


const getCart = async (req, res) => {
  try {

    const { sizeData, colorData, categoryData, brandData } = await fetchData()
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
    const pushData = { sizeData, categoryData, colorData, brandData, userCartData, userData };

    // Render the 'cart' view with the populated data
    res.render('user/cart', pushData);
  } catch (error) {
    console.log(error);
  }
}

const postCart = async (req, res) => {
  try {
    const userData = await User.findOne({ "_id": req.session.userData._id });
    for (let i = 0; i < userData.Cart.length; i++) {
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
    if (!req.session.userData) {
      req.session.redirectUrl = `/product?id=${req.body.ProductId}`
      return res.status(302).redirect('/signin');
    }

    const { Size, Color, Quantity, ProductId } = req.body;

    if(!Color){
      res.json({ success: false, message: 'Select a color' });
    }else if(!Size){
      res.json({ success: false, message: 'Select a size' });
    }else{

      
    // Fetch user data and populate the cart products
    const user = await User.findOne({ _id: req.session.userData._id })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch the product data
    const product = await Product.findOne({ _id: ProductId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let flag = false;

    // Check if the product and version already exist in the user's cart
    for (let i = 0; i < user.Cart.length; i++) {
      if (user.Cart[i].Product.equals(ProductId)) {
        for (let j = 0; j < product.Versions.length; j++) {
          if (product.Versions[j].Size.equals(Size) && product.Versions[j].Color.equals(Color) && product.Versions[j].Quantity >= Quantity) {
            if (user.Cart[i].Version.equals(product.Versions[j]._id)) {
              user.Cart[i].Quantity += parseInt(Quantity, 10);
              await user.save();
              flag = true;
              break;
            }
          }
        }
      }
      if (flag) break;
    }

    // If the product version is not in the cart, add it
    if (!flag) {
      for (let i = 0; i < product.Versions.length; i++) {
        if (product.Versions[i].Size.equals(Size) && product.Versions[i].Color.equals(Color) && product.Versions[i].Quantity >= Quantity) {
          const updateCart = {
            Product: product._id,
            Version: product.Versions[i]._id,
            Quantity: parseInt(Quantity, 10)
          };
          user.Cart.push(updateCart);
          await user.save();
          flag = true;
          break;
        }
      }
    }
    console.log(user);

    if (flag) {
      res.json({ success: true ,count:user.Cart.length});
    } else {
      res.json({ success: false, message: 'Adding to cart failed, try again' });
    }

    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const getRemoveProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const removeProduct = await User.updateOne({ "_id": req.session.userData._id }, { $pull: { "Cart": { "_id": productId } } });
    if (removeProduct) {
      req.flash('msg', 'Product removed successfully');
      res.redirect('/cart')
    } else {
      req.flash('msg', 'Product removing failed, Try again')
      res.redirect('/cart')
    }
  } catch (error) {
    console.log(error);
  }
}

const getCheckout = async (req, res) => {
  try {
    const { sizeData, colorData, categoryData, brandData } = await fetchData()
    const walletData = await Wallet.findOne({ "UserId": req.session.userData._id, "Transaction.Type": "Refund" })

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

    let couponData;
    if (req.session.coupon) {
      couponData = req.session.coupon
    }

    const pushData = {
      sizeData, colorData, categoryData, brandData, userData, userCartData, couponData, walletData
    }

    res.render('user/checkout', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postApplyCoupon = async (req, res) => {
  try {

    const { Name, totalCartAmount } = req.body;
    const name = Name.trim().toUpperCase();
    const couponObj = await Coupon.find();
    let flag = false;
    for (coupon of couponObj) {
      if (coupon.Name === name) {
        flag = true;
        break;
      }
    }
    if (flag) {

      const fetchCoupon = await Coupon.findOne({ "Name": name });
      const orderObj = await Order.find({ "UserId": req.session.userData._id, "Coupon": fetchCoupon.Name });
      if (orderObj.length === 0) {
        const current = new Date()

        if (fetchCoupon.End > current) {
          if(fetchCoupon.MinPurchase<=totalCartAmount){
            req.session.coupon = fetchCoupon.Name;
          res.json({ success: true, message: fetchCoupon.Name, value: fetchCoupon.Value })
          }else{
            res.json({ success: false, message: `Minimum cart value should be greater than ${fetchCoupon.MinPurchase}` })
          }
          
        } else {
          res.json({ success: false, message: 'Coupon expired' })
        }
      }else{
        res.json({ success: false, message: 'Coupon already claimed' })
      }

    } else {
      res.json({ success: false, message: 'Coupon invalid' })
    }

  } catch (error) {
    console.log(error);
  }
}

const getRemoveCoupon = async (req, res) => {
  try {
    const fetchCoupon = await Coupon.findOne({ "Name": req.session.coupon });
    const value = fetchCoupon.Value
    req.session.coupon = {};
    res.json({ success: true, message: 'Coupon removed', value: value })

  } catch (error) {
    console.log(error);
  }
}

const getQuantityCheck = async(req,res)=>{
  try {
    const {versionId, inputValue} = req.query;
    const versionsData = await Product.findOne({"Versions._id":versionId},{Versions:1});
    for(version of versionsData.Versions){
      if(version._id.equals(versionId)){
        if((Number(inputValue)===version.Quantity-1)){
          res.json({success:false})
        }else{
          res.json({success:true})
        }
      }
    }
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
  postApplyCoupon,
  getRemoveCoupon,
  getQuantityCheck,
}