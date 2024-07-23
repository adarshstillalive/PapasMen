const Brand = require('../../model/brandModel')

const fs = require('fs');
const path = require('path');


const getBrands = async (req, res) => {
  try {
    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }
    const totalCount = await Brand.find().countDocuments();
    const totalPage = Math.ceil(totalCount/limit)
    const brandObj = await Brand.find().limit(limit).skip((page-1)*limit)

    const pushData = {
      adminName: req.session.adminData.Name,
      brandObj,totalPage,page,
      addBrandMsg: req.flash('msg')
    }
    res.render('admin/brand', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteBrand = async (req, res) => {
  try {
    const brandId = req.query.id;
    const updateData = await Brand.updateOne({ "_id": brandId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/brands')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockBrand = async (req, res) => {
  try {
    const brandId = req.query.id;
    const updateData = await Brand.updateOne({ "_id": brandId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/brands')
    }
  } catch (error) {
    console.log(error)
  }
}

const getEditBrand = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      brandObj: await Brand.findOne({ "_id": req.query.id }),
      addBrandMsg: req.flash('msg')
    }
    res.render('admin/editBrand', pushData)

  } catch (error) {
    console.log(error)
  }
}

const postEditBrand = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const brandExist = await Brand.find({ "Name": Name.trim() });
    if (brandExist.length > 1) {
      req.flash('msg', 'Brand name already Exist');
      res.redirect(`/admin/brands/editBrand?id=${req.body._id}`)
    } else {

      const updateBrand = await Brand.updateOne({ "_id": req.body._id }, { $set: { "Name": Name.trim(), "isActive": isActive } })
      if (updateBrand) {
        req.flash('msg', 'Brand updated');
        res.redirect('/admin/brands')
      } else {
        req.flash('msg', 'Error, Try again');
        res.redirect('/admin/brands/editBrand');
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getAddBrand = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addBrandMsg: req.flash('msg')
    }
    res.render('admin/addBrand', pushData)
  } catch (error) {
    console.log(error)
  }
}
const postAddBrand = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const brandData = await Brand.findOne({ "Name":{ $regex: new RegExp(`^${Name.trim()}$`, 'i') }});
    if (brandData) {
      req.flash('msg', 'Brand exists')
      res.redirect('/admin/brands/addBrand')
    } else {
      const addData = await Brand.create({ "Name": Name.trim(), "isActive": isActive })
      if (addData) {
        req.flash('msg', 'Brand added successfully');
        res.redirect('/admin/brands')
      } else {
        req.flash('msg', 'Brand adding failed');
        res.redirect('/admin/brands/addBrand')
      }
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {

  getBrands,
  getDeleteBrand,
  getUnBlockBrand,
  getEditBrand,
  postEditBrand,
  getAddBrand,
  postAddBrand,
}