const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const UserAuth = require('../../model/userAuthModel')

// Functions
async function fetchData(){
  const dataCollection = [Size.find(),Color.find(),Category.find(),Brand.find()]
  const [sizeData,colorData,categoryData,brandData] = await Promise.all(dataCollection)
  const fetchedData = {sizeData,colorData,categoryData,brandData}
  return fetchedData;
}


const getProduct = async (req, res) => {
  try {
    const productId = req.query.id;

    const productData = await Product.findOne({ "_id": productId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const productObj = await Product.find({ "Category": productData.Category }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const {sizeData,colorData,categoryData,brandData} =await fetchData()
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

const getCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const productObj = await Product.find({ "Category": categoryId }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] });

    const {sizeData,colorData,categoryData,brandData} =await fetchData()
    const userData = {}
    if(req.session.userData){
      userData = await User.find({"_id":req.session.userData._id});
    }

    const pushData = {
      productObj, sizeData, colorData, categoryData, brandData,userData
    }

    res.render('category', pushData)

  } catch (error) {
    console.log(error);
  }
}


module.exports = {

  getProduct,
  getCategory,

}