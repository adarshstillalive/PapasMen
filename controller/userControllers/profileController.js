const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const UserAuth = require('../../model/userAuthModel')

// Function

async function fetchData(id){
  const dataCollection = [Size.find(),Color.find(),Category.find(),Brand.find(),User.findOne({"_id":id})]
  const [sizeData,colorData,categoryData,brandData,userData] = await Promise.all(dataCollection)
  const fetchedData = {sizeData,colorData,categoryData,brandData,userData}
  return fetchedData;
}


const getProfile = async (req, res) => {
  try {

    const {sizeData,colorData,categoryData,brandData,userData} =await fetchData(req.session.userData._id)

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

    const {sizeData,colorData,categoryData,brandData,userData} =await fetchData(req.session.userData._id)

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

    const {sizeData,colorData,categoryData,brandData,userData} =await fetchData(req.session.userData._id)

    const pushData = {
      userData,
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


module.exports = {

  getProfile,
  getOrders,
  getAddress,
  postEditAddress,
  postAddAddress,
  getDeleteAddress,

}