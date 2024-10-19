const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')

const fs = require('fs');
const path = require('path');


const getCategories = async (req, res) => {
  try {

    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }
    const totalCount = await Category.find().countDocuments();
    const totalPage = Math.ceil(totalCount/limit)
    const categoryObj = await Category.find().limit(limit).skip((page-1)*limit)

    const pushData = {
      adminName: req.session.adminData.Name,
      categoryObj,totalPage,page,
      addCategoryMsg: req.flash('msg')
    }
    res.render('admin/category', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    await Product.updateMany({ "Category": categoryId }, { $set: { "isActive": "false" } });
    const updateData = await Category.updateOne({ "_id": categoryId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/categories')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    await Product.updateMany({ "Category": categoryId }, { $set: { "isActive": "true" } });
    const updateData = await Category.updateOne({ "_id": categoryId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/categories')
    }
  } catch (error) {
    console.log(error)
  }
}

const getEditCategory = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      categoryObj: await Category.findOne({ "_id": req.query.id }),
      addCategoryMsg: req.flash('msg')
    }
    res.render('admin/editCategory', pushData)

  } catch (error) {
    console.log(error)
  }
}

const postEditCategory = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const categoryExist = await Category.find({ "Name": Name.trim() });
    if (categoryExist.length > 1) {
      req.flash('msg', 'Category already exists')
      res.redirect(`/admin/categories/editCategory?id=${req.body._id}`)
    } else {

      const updateCategory = await Category.updateOne({ "_id": req.body._id }, { $set: { "Name": Name.trim(), "isActive": isActive } })
      if (updateCategory) {
        req.flash('msg', 'Category updated');
        res.redirect('/admin/categories')
      } else {
        req.flash('msg', 'Error, Try again');
        res.redirect('/admin/categories/editCategory');
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getAddCategory = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addCategoryMsg: req.flash('msg')
    }
    res.render('admin/addCategory', pushData)
  } catch (error) {
    console.log(error)
  }
}
const postAddCategory = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const categoryData = await Category.findOne({ "Name": { $regex: new RegExp(`^${Name.trim()}$`, 'i') }});
    if (categoryData) {
      req.flash('msg', 'Category exists')
      res.redirect('/admin/categories/addCategory')
    } else {
      const addData = await Category.create({ "Name": Name.trim(), "isActive": isActive })
      if (addData) {
        req.flash('msg', 'Category added successfully');
        res.redirect('/admin/categories')
      } else {
        req.flash('msg', 'Category adding failed');
        res.redirect('/admin/categories/addCategory')
      }
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {

  getCategories,
  getDeleteCategory,
  getUnBlockCategory,
  getEditCategory,
  postEditCategory,
  getAddCategory,
  postAddCategory,
}