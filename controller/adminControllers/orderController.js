const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')
const Order = require('../../model/orderModel')
const User = require('../../model/userModel')


async function orderProductData(orderId) {
  try {
    const orderData = await Order.findOne({ "_id": orderId })
      .populate({
        path: 'Products.Product',
        model: 'Product',
        populate: [
          { path: 'Brand', model: 'Brand' },
          { path: 'Category', model: 'Category' },
          { path: 'Versions.Color', model: 'Color' },
          { path: 'Versions.Size', model: 'Size' }
        ]
      }).populate('UserId');

    const orderProductData = {
      ...orderData.toObject(),  // Preserve all other fields from orderData
      Products: await Promise.all(orderData.Products.map(async (orderItem) => {
        const product = orderItem.Product;
        const versionId = orderItem.Version;

        // Find the specific version in product's Versions array
        const version = product.Versions.find(v => v._id.equals(versionId));

        if (version) {
          // Populate Color and Size in the found version
          const populatedVersion = await Product.populate(version, [
            { path: 'Color', model: 'Color' },
            { path: 'Size', model: 'Size' }
          ]);

          // Return the order item with populated version
          return {
            ...orderItem.toObject(),  // Convert Mongoose document to plain object
            Version: populatedVersion
          };
        }

        return orderItem.toObject();
      }))
    };

    return orderProductData;
  } catch (error) {
    console.error('Error fetching order product data:', error);
    throw error;
  }
}


const getOrders = async (req,res)=>{
  try {

    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
      console.log(page);
    }
    const totalCount = await Order.find().countDocuments();
    const totalPage = Math.ceil(totalCount/limit)

    const orderObj = await Order.find().populate('UserId').limit(limit).skip((page-1)*limit).sort({"createdAt":-1})
    const adminName = req.session.adminData.Name
    addProductMsg = req.flash('msg');
    const pushData = {
      orderObj,adminName,addProductMsg, totalPage,page
    }
    res.render('admin/orders',pushData)
  } catch (error) {
    console.log(error);
  }
}

const getViewOrder = async(req,res)=>{
  try {
    const orderData = await orderProductData(req.query.id);
    const adminName = req.session.adminData.Name
    addProductMsg = req.flash('msg');
    const pushData = {
      orderData,adminName,addProductMsg
    }
    res.render('admin/editOrder',pushData)
  } catch (error) {
    console.log(error);
  }
}

const postUpdateOrderStatus = async(req,res)=>{
  try {
    const {orderStatus,orderId} = req.body;
    let values;
    switch(orderStatus){

      case 'Order Placed':
        values = {"Orderstatus":orderStatus};
        break;
      case 'Shipped':
        values = {"Orderstatus":orderStatus, "ShippedDate": Date.now()};
        break;
      case 'Delivered':
        values = {"Orderstatus":orderStatus, "DeliveredDate": Date.now()};
        break;
      case 'Cancelled':
        values = {"Orderstatus":orderStatus, "CancelledDate": Date.now()};
        break;
      case 'Returned':
        values = {"Orderstatus":orderStatus, "ReturnedDate": Date.now()};
        break;

      default :
        values = {"Orderstatus":orderStatus};
        break;
    }
    if(orderStatus==='Delivered'){
      const orderData = await Order.findOne({"_id":orderId});
      const userData = await User.findOne({"_id":orderData.UserId});
      for (let product of orderData.Products) {
        if (userData.PurchasedProducts && !userData.PurchasedProducts.some(p => p.ProductId.equals(product.Product))) {
          userData.PurchasedProducts.push({ "ProductId": product.Product });
        }
      }await userData.save()
    }

    const updateStatus = await Order.updateOne({"_id":orderId},{$set:values});

    if(updateStatus){
      req.flash('msg','Status updated');
      res.redirect(`/admin/viewOrder?id=${orderId}`)
    }else{
      req.flash('msg','Status updation failed');
      res.redirect(`/admin/viewOrder?id=${orderId}`)
    }
  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  getOrders,
  getViewOrder,
  postUpdateOrderStatus,
}