const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')
const Order = require('../../model/orderModel')


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
    const orderObj = await Order.find().populate('UserId')
    const adminName = req.session.adminData.Name
    addProductMsg = req.flash('msg');
    const pushData = {
      orderObj,adminName,addProductMsg
    }
    res.render('orders',pushData)
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
    res.render('editOrder',pushData)
  } catch (error) {
    console.log(error);
  }
}

const postUpdateOrderStatus = async(req,res)=>{
  try {
    const {orderStatus,orderId} = req.body;
    const updateStatus = await Order.updateOne({"_id":orderId},{$set:{"Orderstatus":orderStatus}});

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