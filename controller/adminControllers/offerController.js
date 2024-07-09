const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')

const fs = require('fs');
const path = require('path');
const { log } = require('console')


const getProductOffer = async(req,res)=>{
  try {
    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }

    const productObj = await Product.find()
    const totalCount = productObj.reduce((acc, curr)=>{
      acc+=curr.Offer.length
    },0)
    const totalPage = Math.ceil(totalCount/limit)
    const productOfferObj = await Product.find({
      'Offer.OfferName': { $exists: true }
    }).limit(limit).skip((page - 1) * limit);

    const pushData = {
      adminName: req.session.adminData.Name,
      productObj,totalPage,page,productOfferObj,
      addOfferMsg: req.flash('msg')
    }
    res.render('admin/productOffer', pushData)
  } catch (error) {
    console.log(error);
  }
}


const getCategoryOffer = async(req,res)=>{
  try {
    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }

    const categoryObj = await Category.find()
    const totalCount = categoryObj.reduce((acc, curr)=>{
      acc+=curr.Offer.length
    },0)
    const totalPage = Math.ceil(totalCount/limit)

    const categoryOfferObj = await Category.find({
      'Offer.OfferName': { $exists: true }
    }).limit(limit).skip((page - 1) * limit);

    const pushData = {
      adminName: req.session.adminData.Name,
      categoryObj,totalPage,page,categoryOfferObj,
      addOfferMsg: req.flash('msg')
    }
    res.render('admin/categoryOffer', pushData)
  } catch (error) {
    console.log(error);
  }
}


const getAddProductOffer = async(req,res)=>{
  try {
    const productData = await Product.findOne({"_id":req.query.id});
    const adminName = req.session.adminData.Name;
    const pushData = {
      productData,
      adminName,
      addOfferMsg: req.flash('msg')
    }

    res.render('admin/addProductOffer',pushData)
  } catch (error) {
    console.log(error);
  }
}

const postAddProductOffer = async(req,res)=>{
  try {
    const {OfferName, Description, Start, End, Percentage, _id} = req.body;
    const productData = await Product.findById(_id);
    if(Percentage>0){
    let MRP = productData.MRP;
    let discount = (MRP * Percentage)/100;
    productData.Price = productData.MRP;
    productData.Price-=discount;
  }else{
    productData.Price = productData.MRP
  }
  await productData.save()
    const newOffer = {
      OfferName,
      Description,
      Start,
      End,
      Percentage,
    }
    const updateProduct = await Product.updateOne({"_id":req.body._id},{$set:{"Offer":newOffer}});
    if(updateProduct.matchedCount > 0){
      req.flash('msg','Offer added successfully');
      res.redirect('/admin//offer/productOffer')
    }else{
      req.flash('msg','Error occured, Try again');
      res.redirect('/admin//offer/productOffer')
    }
    
  } catch (error) {
    console.log(error);
  }
}


const getAddCategoryOffer = async(req,res)=>{
  try {
    const categoryData = await Category.findOne({"_id":req.query.id});
    const adminName = req.session.adminData.Name;
    const pushData = {
      categoryData,
      adminName,
      addOfferMsg: req.flash('msg')
    }

    res.render('admin/addCategoryOffer',pushData)
  } catch (error) {
    console.log(error);
  }
}

const postAddCategoryOffer = async(req,res)=>{
  try {
    const {OfferName, Description, Start, End, Percentage, _id} = req.body;
    if(Percentage>0){
    const productObj = await Product.find({"Category":_id});

    productObj.forEach(async (curr) => {
      let MRP = curr.MRP;
      let discount = (MRP * Percentage) / 100;
      curr.Price = curr.MRP;
      curr.Price -= discount;
      await curr.save();
    });
  }else{
    const productObj = await Product.find({"Category":_id});

    productObj.forEach(async (curr) => {
      
      curr.Price = curr.MRP;
      await curr.save();

  })
}


    const newOffer = {
      OfferName,
      Description,
      Start,
      End,
      Percentage,
    }
    const updateCategory = await Category.updateOne({"_id":req.body._id},{$set:{"Offer":newOffer}});
    if(updateCategory.matchedCount > 0){
      req.flash('msg','Offer added successfully');
      res.redirect('/admin//offer/categoryOffer')
    }else{
      req.flash('msg','Error occured, Try again');
      res.redirect('/admin//offer/categoryOffer')
    }

  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  getProductOffer,
  getCategoryOffer,
  getAddProductOffer,
  postAddProductOffer,
  getAddCategoryOffer,
  postAddCategoryOffer,
}