const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Order = require('../../model/orderModel')
const UserAuth = require('../../model/userAuthModel')


function generateOrderId() {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now();

  // Generate a random string of 6 characters (alphanumeric)
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Combine the timestamp and the random string
  const orderId = `ORD-${timestamp}-${randomString}`;

  return orderId;
}

async function fetchData(id) {
  const dataCollection = [Size.find(), Color.find(), Category.find(), Brand.find(), User.findById({ "_id": id })]
  const [sizeData, colorData, categoryData, brandData, userData] = await Promise.all(dataCollection)
  const fetchedData = { sizeData, colorData, categoryData, brandData, userData }
  return fetchedData;
}

async function orderProductData(orderId) {
  try {
    const orderData = await Order.findOne({ "OrderId": orderId })
      .populate({
        path: 'Products.Product',
        model: 'Product',
        populate: [
          { path: 'Brand', model: 'Brand' },
          { path: 'Category', model: 'Category' },
          { path: 'Versions.Color', model: 'Color' },
          { path: 'Versions.Size', model: 'Size' }
        ]
      });

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


const postCreateOrder = async (req, res) => {
  try {
    const orderId = generateOrderId();
    const userData = await User.findById({ "_id": req.session.userData._id });
    const { checkoutAddress, orderNotes, totalAmount, paymentMethod } = req.body;

    const addressDoc = await User.findOne(
      { 'Address._id': checkoutAddress },
      { 'Address.$': 1 }
    );
    const address = addressDoc.Address[0];

    const products = userData.Cart.map(item => ({
      Product: item.Product,
      Version: item.Version,
      Quantity: item.Quantity,
    }));

    if (paymentMethod === 'COD') {
      for (const cartItem of userData.Cart) {
        const product = await Product.findById(cartItem.Product);
        if (product) {
          const version = product.Versions.id(cartItem.Version);
          if (version) {
            version.Quantity -= cartItem.Quantity;
            if (version.Quantity < 0) {
              throw new Error('Insufficient stock for product version');
            } else {
              const newOrder = new Order({
                "UserId": userData._id,
                "Products": products,
                "Address": [address],
                "TotalAmount": totalAmount,
                "OrderNotes": orderNotes,
                "OrderId": orderId
              });

              const result = await newOrder.save();

              if (result) {
                userData.Cart = [];
                await userData.save();
                res.redirect(`/orderDetails?id=${orderId}`);
              }
            }
          } else {
            throw new Error('Version not found for product');
          }

          await product.save();
        } else {
          throw new Error('Product not found');
        }
      }


    }
  } catch (error) {
    console.log(error);
  }
}

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.id;
    const orderData = await orderProductData(orderId);
    const { sizeData, colorData, categoryData, brandData, userData } = await fetchData(req.session.userData._id)
    const pushData = {
      orderData,
      sizeData,
      colorData,
      categoryData,
      brandData,
      userData,
    }

    res.render('orderComplete', pushData);

  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  postCreateOrder,
  getOrderDetails,
}