const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Order = require('../../model/orderModel')
const Wallet = require('../../model/walletModel')

// Function

async function fetchData(id){
  const dataCollection = [Size.find(),Color.find(),Category.find(),Brand.find(),User.findById({"_id":id})]
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
    res.render('user/userProfile', pushData)
  } catch (error) {
    console.log(error);
  }
}


const getOrders = async (req, res) => {
  try {

    const {sizeData,colorData,categoryData,brandData,userData} =await fetchData(req.session.userData._id)
    const orderData = await Order.find({"UserId":req.session.userData._id});


    const pushData = {
      userData,
      sizeData,
      colorData,
      categoryData,
      brandData,
      orderData,
    }
    res.render('user/userOrders', pushData)
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
    res.render('user/userAddress', pushData)
  } catch (error) {
    console.log(error);
  }
}

const putEditAddress = async (req, res) => {
  try {
    const {index,route,Fname,Lname,Housename,City,State,Pincode,Phone} = req.body;

    const userData = await User.findOne({ "_id": req.session.userData._id });

    const updateData = {
      "Fname": Fname,
      "Lname": Lname,
      "Housename": Housename,
      "City": City,
      "State": State,
      "Pincode": Pincode,
      "Phone": Phone
    }

    userData.Address[index] = updateData;
    const result = await userData.save();
    
    if (result) {
      res.redirect(`${route}`)
    } else {
      res.redirect(`${route}`)
    }


  } catch (error) {
    console.log(error);
  }
}


const postAddAddress = async (req, res) => {
  try {
    const {Fname,Lname,Housename,City,State,Pincode,Phone,route} = req.body
    const updateData = await User.updateOne({ "_id": req.session.userData._id }, {
      $push: {
        Address: {
          $each: [{
            "Fname": Fname,
            "Lname": Lname,
            "Housename": Housename,
            "City": City,
            "State": State,
            "Pincode": Pincode,
            "Phone": Phone
          }]
        }
      }
    });

    console.log(updateData);
    if (updateData) {
      res.redirect(`${route}`)
    } else {
      res.redirect(`${route}`)
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

const getWallet = async(req,res)=>{
  try {
    const {sizeData,colorData,categoryData,brandData,userData} =await fetchData(req.session.userData._id)
    const walletData = await Wallet.findOne({"UserId":req.session.userData._id});

    const pushData = {
      userData,
      sizeData,
      colorData,
      categoryData,
      brandData,
      walletData
    }

    res.render('user/userWallet',pushData)

  } catch (error) {
    console.log(error);
  }
}


module.exports = {

  getProfile,
  getOrders,
  getAddress,
  putEditAddress,
  postAddAddress,
  getDeleteAddress,
  getWallet,

}