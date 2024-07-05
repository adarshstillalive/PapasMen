const User = require('../../model/userModel')
const UserAuth = require('../../model/userAuthModel')

const fs = require('fs');
const path = require('path');


const getUsers = async (req, res) => {
  try {

    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }
    const totalCount = await User.find().countDocuments();
    const totalPage = Math.ceil(totalCount/limit)
    const userObj = await User.find().limit(limit).skip((page-1)*limit)

    const pushData = {
      adminName: req.session.adminData.Name,
      userObj,totalPage,page,
    }
    res.render('admin/users', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const updateData = await User.updateOne({ "_id": userId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/users')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const updateData = await User.updateOne({ "_id": userId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/users')
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
  getUsers,
  getDeleteUser,
  getUnBlockUser,
}
