const User = require('../model/userModel')
const Brand = require('../model/brandModel');
const Category = require('../model/categoryModel');
const Product = require('../model/productModel');
const Color = require('../model/colorModel');
const Size = require('../model/sizeModel');
const UserAuth = require('../model/userAuthModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
require('dotenv').config()


const getHome = async (req, res) => {
  try {
    const productObj = await Product.find({ "isActive": true }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] })

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    const pushData = {
      loginMessage: req.flash('msg'),
      userData: req.session.userData,
      productObj, sizeData, colorData, categoryData, brandData
    }
    res.render('userHome', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getSignin = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg'),
      userData: req.session.userData
    }
    res.render('userLogin', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postSignin = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    const searchUser = await User.findOne({ "Email": Email })
    if (searchUser && !searchUser.isAdmin) {

      const passwordMatch = await bcrypt.compare(Password, searchUser.Password);
      if (passwordMatch && searchUser.isActive) {
        req.session.userData = searchUser;
        req.session.save()
        res.redirect('/')
      } else if (passwordMatch && !searchUser.isActive) {
        req.flash('msg', 'User blocked by the Admin')
        res.redirect('/signin')
      } else {
        req.flash('msg', 'Wrong Password')
        res.redirect('/signin')
      }
    } else {
      req.flash('msg', `User doesn't exist`)
      res.redirect('/signin')
    }

  } catch (err) {
    console.log(err)
  }
}

const getSignup = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg'),
      userData: req.session.userData
    }
    res.render('userSignup', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postSignup = async (req, res) => {
  try {
    console.log('first');
    console.log(req.session.otp)


    const { Name, Email, Contact, Password } = req.body;
    const checkEmail = await User.findOne({ "Email": Email });
    if (checkEmail) {
      req.flash('msg', 'User exists');
      res.redirect('/signup')
    } else {
      hashedPassword = await bcrypt.hash(Password, 10)
      const userData = await User.create({ "Email": Email, "Name": Name, "Contact": Contact, "Password": hashedPassword })
      if (userData) {
        console.log(userData);
        req.session.userData = userData
        res.status(200).redirect('/')
      }
    }
  } catch (err) {
    console.log(err)
  }
}

const postSendOtp = async (req, res) => {
  try {
    console.log(req.body.Email)
    if (!req.session.Email) {
      req.session.Email = req.body.Email
    }
    console.log(req.session.Email);
    const checkEmail = await User.findOne({ "Email": req.session.Email });
    if (checkEmail) {
      req.flash('msg', 'Email already exists')
      res.json({ success: false, message: 'User already exists.' });

      return;
    } else {
      const randomOtp = Math.floor(1000 + Math.random() * 9000)
      console.log(randomOtp)
      req.session.otp = randomOtp;
      req.session.save()

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'papasmenauth@gmail.com',
          clientId: process.env.NODEMAILER_CLIENT_ID,
          clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
          refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
        }
      });


      const mailOptions = {
        from: 'papasmenauth@gmail.com',
        to: req.session.Email,
        subject: 'Hello, PapasMenAuth Mail',
        text: `Your verification OTP is ${randomOtp}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email: ' + error);
        } else {
          console.log('Email sent: ' + info.response);
        }

      });
    }



  } catch (error) {
    console.log(error)
  }
}

const postValidateOtp = async (req, res) => {
  try {
    let enteredOtp = String(req.body.otp1) + String(req.body.otp2) + String(req.body.otp3) + String(req.body.otp4)
    const storedOtp = req.session.otp;
    enteredOtp = Number(enteredOtp);
    if (!enteredOtp || !storedOtp || enteredOtp !== storedOtp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    } else {
      console.log('Validated');
      res.json({ success: true })
    }

    // OTP is valid, clear the stored OTP and send a success response
    delete req.session.otp;


  } catch (error) {
    console.log(error)
  }
}

const getSignout = async (req, res) => {
  try {
    req.session.destroy();
    req.flash('msg', 'Signed out successfully')
    res.redirect('/signin')
  } catch (error) {
    console.log(error);
  }
}

const getForgotPassword = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg')
    }
    res.render('forgotPassword', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postForgotPassword = async (req, res) => {
  try {
    console.log(req.body.Email, req.body.Password)
    const { Email, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    const updateData = await User.updateOne({ "Email": Email }, { $set: { "Password": hashedPassword } });
    if (updateData) {
      res.redirect('/signin')
    } else {
      req.flash('msg', 'Something happened. Try again')
      res.redirect('forgotPassword')
    }
  } catch (error) {
    console.log(error);
  }
}

const postForgotSendOtp = async (req, res) => {
  try {
    console.log(req.body.Email)
    if (!req.session.Email) {
      req.session.Email = req.body.Email
    }
    console.log(req.session.Email);
    const checkEmail = await User.findOne({ "Email": req.session.Email });

    const randomOtp = Math.floor(1000 + Math.random() * 9000)
    console.log(randomOtp)
    req.session.otp = randomOtp;
    req.session.save()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'papasmenauth@gmail.com',
        clientId: process.env.NODEMAILER_CLIENT_ID,
        clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
        refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
      }
    });


    const mailOptions = {
      from: 'papasmenauth@gmail.com',
      to: req.session.Email,
      subject: 'Hello, PapasMenAuth Mail',
      text: `Your verification OTP is ${randomOtp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email: ' + error);
      } else {
        console.log('Email sent: ' + info.response);
      }

    });

  } catch (error) {
    console.log(error);
  }
}

const getAuthSuccess = async (req, res) => {
  try {

    const userData = await User.findOne({ 'Email': req.user.email });

    if (userData) {
      req.session.userData = userData;
      res.redirect('/')
    } else {
      const userAuthData = await UserAuth.updateOne({ "Name": req.user.displayName }, { $set: { "Email": req.user.email } }, { upsert: true });

      if (userAuthData) {
        req.session.userData = userAuthData;
        res.redirect('/')
      } else {
        req.flash('msg', 'Error in google authentication')
        res.redirect('/signin')
      }
    }

  } catch (error) {
    console.log(error);
  }
};

const getAuthFailure = async (req, res) => {
  try {
    req.flash('msg', 'Authentication failed, try again.');
    res.redirect('/signin');
  } catch (error) {
    console.log(error);
  }
};

const getProduct = async (req, res) => {
  try {
    const productId = req.query.id;

    const productData = await Product.findOne({ "_id": productId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const productObj = await Product.find({ "Category": productData.Category }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    let userData = {};
    if(req.session.userData){
    userData = await User.find({"_id":req.session.userData._id});
    }

    const pushData = {
      productData, productObj, sizeData, colorData, categoryData,userData, brandData, loginMessage: req.flash('msg')
    }
    res.render('userProduct', pushData)
  } catch (error) {
    console.log(error);
  }
}

const getProfile = async (req, res) => {
  try {

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    const userData = await User.findOne({"_id":req.session.userData._id});

    const pushData = {
      userData,
      sizeData,
      colorData,
      categoryData,
      brandData
    }
    res.render('userProfile', pushData)
  } catch (error) {
    console.log(error);
  }
}


const getOrders = async (req, res) => {
  try {

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    const userData = await User.find({"_id":req.session.userData._id});

    const pushData = {
      userData,
      sizeData,
      colorData,
      categoryData,
      brandData
    }
    res.render('userOrders', pushData)
  } catch (error) {
    console.log(error);
  }
}


const getAddress = async (req, res) => {
  try {

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();

    const pushData = {
      userData: await User.findOne({ "_id": req.session.userData._id }),
      sizeData,
      colorData,
      categoryData,
      brandData
    }
    res.render('userAddress', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postEditAddress = async (req, res) => {
  try {
    const index = req.query.index;
    const userData = await User.findOne({ "_id": req.session.userData._id });

    const updateData = {
      "Fname": req.body.Fname,
      "Lname": req.body.Lname,
      "Housename": req.body.Housename,
      "City": req.body.City,
      "State": req.body.State,
      "Pincode": req.body.Pincode,
      "Phone": req.body.Phone
    }

    userData.Address[index] = updateData;
    const result = await userData.save();

    console.log(result);
    if (result) {
      res.redirect('/profile/address')
    } else {
      res.redirect('/profile/address')
    }


  } catch (error) {
    console.log(error);
  }
}


const postAddAddress = async (req, res) => {
  try {

    const updateData = await User.updateOne({ "_id": req.session.userData._id }, {
      $push: {
        Address: {
          $each: [{
            "Fname": req.body.Fname,
            "Lname": req.body.Lname,
            "Housename": req.body.Housename,
            "City": req.body.City,
            "State": req.body.State,
            "Pincode": req.body.Pincode,
            "Phone": req.body.Phone
          }]
        }
      }
    });

    console.log(updateData);
    if (updateData) {
      res.redirect('/profile/address')
    } else {
      res.redirect('/profile/address')
    }


  } catch (error) {
    console.log(error);
  }
}

const getDeleteAddress = async (req, res) => {
  try {
    const deleteAddress = await User.updateOne({ "_id": req.session.userData._id }, { $pull: { "Address": { "_id": req.query.id } } });
    if (deleteAddress) {
      res.redirect('/profile/address')
    } else {
      res.redirect('/profile/address')
    }
  } catch (error) {
    console.log(error);
  }
}

const getCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const productObj = await Product.find({ "Category": categoryId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const sizeData = await Size.find();
    const colorData = await Color.find();
    const categoryData = await Category.find();
    const brandData = await Brand.find();
    const userData = await User.find({"_id":req.session.userData._id});

    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData,userData
    }

    res.render('category', pushData)

  } catch (error) {
    console.log(error);
  }
}

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


const getAddToCart = async (req, res) => {
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
  getHome,
  getSignin,
  postSignin,
  getSignup,
  postSignup,
  postSendOtp,
  postValidateOtp,
  getSignout,
  getForgotPassword,
  postForgotPassword,
  postForgotSendOtp,
  getAuthSuccess,
  getAuthFailure,
  getProduct,
  getProfile,
  getOrders,
  getAddress,
  postEditAddress,
  postAddAddress,
  getDeleteAddress,
  getCategory,
  getCart,
  getAddToCart,
  getCheckout,
}