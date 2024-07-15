const Coupon = require('../../model/couponModel')


const getCoupon = async(req,res)=>{
  try {
    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }

    const totalCount = await Coupon.find().countDocuments()
    const totalPage = Math.ceil(totalCount/limit)
    const couponObj = await Coupon.find().limit(limit).skip((page - 1) * limit).sort({"createdAt":-1});

    const pushData = {
      adminName: req.session.adminData.Name,
      couponObj,totalPage,page,
      addCouponMsg: req.flash('msg')
    }
    res.render('admin/coupon', pushData)

  } catch (error) {
    console.log(error);
  }
}

const getAddCoupon = async(req,res)=>{
  try {
    const couponData = await Coupon.findOne({"_id":req.query.id});
    const adminName = req.session.adminData.Name;
    const pushData = {
      couponData,
      adminName,
      addCouponMsg: req.flash('msg')
    }

    res.render('admin/addCoupon',pushData)
  } catch (error) {
    console.log(error);
  }
}

const postAddCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { Name, Description, End, Value,MinPurchase, _id } = req.body;
    let flag = false;
    const setData = {
      Name:Name.toUpperCase(),
      Description,
      End,
      Value,
      MinPurchase,
    };

    if (_id) {
      const updateCoupon = await Coupon.updateOne({ "_id": _id }, { $set: setData });
      if (updateCoupon.modifiedCount > 0) {
        flag = true;
      }
    } else {
      const createCoupon = await Coupon.create(setData);
      if (createCoupon) {
        flag = true;
      }
    }

    if (flag) {
      req.flash('msg', 'Coupon added successfully');
      res.redirect('/admin/coupon');
    } else {
      req.flash('msg', 'Coupon adding failed');
      res.redirect('/admin/coupon/addCoupon');
    }
  } catch (error) {
    console.error("Error in postAddCoupon:", error);
    req.flash('msg', 'An error occurred while processing the request');
    res.redirect('/admin/coupon/addCoupon');
  }
};

const getDeleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    const deleteCoupon = await Coupon.deleteOne({ _id: couponId });
    if(deleteCoupon.deletedCount>0){
      req.flash('msg','Coupon deleted');
      res.redirect('/admin/coupon')
    }else{
      req.flash('msg','Deletion failed, Try again');
      res.redirect('/admin/coupon')
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}


module.exports = {
  getCoupon,
  getAddCoupon,
  postAddCoupon,
  getDeleteCoupon,

}