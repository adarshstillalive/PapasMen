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


const getProduct = async (req, res) => {
  try {
    const productId = req.query.id;

    const productData = await Product.findOne({ "_id": productId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const productObj = await Product.find({ "Category": productData.Category }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const { sizeData, colorData, categoryData, brandData } = await fetchData()
    let userData = {};
    let wishlistData = {};
    if (req.session.userData) {
      userData = await User.findById({ "_id": req.session.userData._id });
      wishlistData = await Wishlist.findOne({"UserId":req.session.userData._id })
    }

    const pushData = {
      wishlistData, productData, productObj, sizeData, colorData, categoryData, userData, brandData, loginMessage: req.flash('msg')
    }
    res.render('user/userProduct', pushData)
  } catch (error) {
    console.log(error);
  }
}

const getLoadHomeProduct = async(req,res)=>{
  try {
    const {productCount} = req.query;

    const productObj = await Product.find({ "isActive": true }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] }).skip(productCount).limit(8);

      res.json({productObj})

  } catch (error) {
    console.log(error);
  }
}

const postProductReview = async(req,res)=>{
  try {
    const {review, rating, productId} = req.body;

    const addReview = await Product.updateOne(
      { "_id": productId },
      {
        $push: {
          "Reviews": {
            Review: review,
            UserId: req.session.userData._id,
            UserName: req.session.userData.Name,
            Rating: rating
          }
        }
      }
    );

    if(addReview.modifiedCount>0){
      const updateUser = await User.updateOne(
        { 
          "_id": req.session.userData._id,
          "PurchasedProducts.ProductId": productId
        },
        { 
          "$set": { "PurchasedProducts.$.Reviewed": true }
        }
      );
    }
    res.redirect(`/product?id=${productId}`)
  } catch (error) {
    console.log(error);
  }
}

const getCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const productObj = await Product.find({ "Category": categoryId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const { sizeData, colorData, categoryData, brandData } = await fetchData()
    let userData = {}
    if (req.session.userData) {
      userData = await User.findById({ "_id": req.session.userData._id });
    }

    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData, userData
    }

    res.render('user/category', pushData)

  } catch (error) {
    console.log(error);
  }
}


const getAllProducts = async (req, res) => {
  try {
    const productObj = await Product.find().populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const { sizeData, colorData, categoryData, brandData } = await fetchData()
    let userData = {}
    if (req.session.userData) {
      userData = await User.findById({ "_id": req.session.userData._id });
    }

    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData, userData
    }

    res.render('user/allProducts', pushData)

  } catch (error) {
    console.log(error);
  }
}


const getColorWithSize = async(req,res)=>{
  try {
    const {colorId, productId} = req.query;
    let sizeId = []
    const productData = await Product.findOne({"_id":productId});
    productData.Versions.forEach((version)=>{
      if(version.Color.equals(colorId)){
        sizeId.push(version.Size)
      }
    })

    res.json({sizeId})
  } catch (error) {
    console.log(error);
  }
}


const getSizeWithQuantity = async(req,res)=>{
  try {
    const {colorId, sizeId, productId} = req.query;

    const productData = await Product.findOne({"_id":productId});
    productData.Versions.forEach((version)=>{
      if(version.Color.equals(colorId) && version.Size.equals(sizeId)){
        const quantity = version.Quantity
        res.json({quantity})
      }
    })

  } catch (error) {
    console.log(error);
  }
}

const getSearchProduct = async (req, res) => {
  try {
    const keyword = req.query.keyword.trim();
    let userData = {};
    const productObj = await Product.find({ "Name": { $regex: new RegExp(`^${keyword}`, 'i') } }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] })


      const {sizeData,colorData,categoryData,brandData} = await fetchData()
      if(req.session.userData){
        userData = await User.findById({"_id":req.session.userData._id});
      }
    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData, userData, keyword
    }

    res.render('user/allProducts',pushData)


  } catch (error) {
    console.log(error);
  }

}


module.exports = {

  getProduct,
  getLoadHomeProduct,
  postProductReview,
  getCategory,
  getAllProducts,
  getColorWithSize,
  getSizeWithQuantity,
  getSearchProduct,

}