const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Order = require('../../model/orderModel')
const Wallet = require('../../model/walletModel')
const Coupon = require('../../model/couponModel')
const UserAuth = require('../../model/userAuthModel')
const Paypal = require('../../others/paypal')

const PDFDocument = require('pdfkit')


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
    const userData = await User.findById({ "_id": req.session.userData._id }).populate({path:'Cart',populate:{path:'Product',ref:'Product'}});
    const { checkoutAddress, orderNotes, totalAmount, paymentMethod } = req.body;
    let coupon = '';

    // Handle coupon logic
    if (req.session.coupon) {
      const fetchCoupon = await Coupon.findOne({ "Name": req.session.coupon });
      if (fetchCoupon) {
        coupon = fetchCoupon.Name;
        await fetchCoupon.save();
      }
    }

    // Fetch address
    const addressDoc = await User.findOne(
      { 'Address._id': checkoutAddress },
      { 'Address.$': 1 }
    );
    const address = addressDoc.Address[0];

    // Map products from user cart
    const products = userData.Cart.map(item => ({
      Product: item.Product,
      Version: item.Version,
      Quantity: item.Quantity,
      Price: item.Product.Price
    }));

    // Check and update product quantities
    for (const cartItem of userData.Cart) {
      const product = await Product.findById(cartItem.Product);
      if (product) {
        const version = product.Versions.id(cartItem.Version);
        if (version) {
          version.Quantity -= cartItem.Quantity;
          if (version.Quantity < 0) {
            throw new Error('Insufficient stock for product version');
          }
        } else {
          throw new Error('Version not found for product');
        }
        await product.save();
      } else {
        throw new Error('Product not found');
      }
    }

    // Create order based on payment method
    const newOrder = new Order({
      "UserId": userData._id,
      "Products": products,
      "Address": [address],
      "TotalAmount": totalAmount,
      "PaymentMethod": paymentMethod,
      "OrderNotes": orderNotes,
      "OrderId": orderId,
      "Coupon": coupon,
    });

    if (paymentMethod === 'Cash On Delivery') {
      await newOrder.save();
      userData.Cart = [];
      await userData.save();
      res.redirect(`/orderDetails?id=${orderId}`);
    } else if (paymentMethod === 'Paypal') {
      newOrder.Orderstatus = 'Payment failed'; // Setting initial status
      await newOrder.save();
      userData.Cart = [];
      await userData.save();
      req.session.orderId = orderId;
      const url = await Paypal.paypalCreateOrder(orderId);
      res.redirect(url);
    } else if (paymentMethod === 'Wallet') {
      const updateWallet = await Wallet.updateOne(
        { "UserId": req.session.userData._id },
        {
          $inc: { "Balance": -totalAmount }, // Decrement the balance
          $push: {
            "Transaction": {
              Type: 'Debit',
              Amount: totalAmount,
              Date: new Date(), // Record the date of the transaction
            },
          },
        },
      );

      if (updateWallet.modifiedCount > 0) {
        await newOrder.save();
        userData.Cart = [];
        await userData.save();
        res.redirect(`/orderDetails?id=${orderId}`);
      } else {
        throw new Error('Failed to update wallet');
      }
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your order.');
  }
};

const getPaypalPayment = async(req,res)=>{
  try {
    const {orderId} = req.query;
    req.session.orderId = orderId;
    const url = await Paypal.paypalCreateOrder(orderId);
    res.redirect(url);
  } catch (error) {
    console.log(error);
  }
}


const postCancelOrder = async (req, res) => {
  try {
    const { orderId, cancellingReason } = req.body;

    const orderData = await Order.findOne({ "OrderId": orderId })
    
    orderData.Products.forEach(async (product)=>{
     await Product.updateOne({"Versions._id":product.Version},{$inc:{"Versions.$.Quantity":product.Quantity}})
    })

    if (orderData.PaymentMethod === 'Paypal' || orderData.PaymentMethod === 'Wallet' && orderData.Orderstatus !== 'Payment failed') {
      const updateWallet = await Wallet.updateOne(
        { "UserId": req.session.userData._id },
        {
          $inc: { "Balance": orderData.TotalAmount }, // Increment the balance
          $push: {
            "Transaction": {
              Type: 'Refund',
              Amount: orderData.TotalAmount,
              Date: new Date() // Record the date of the transaction
            }
          }
        },
        { upsert: true }
      );
      if (updateWallet.modifiedCount>0) {
        orderData.cancellingReason = cancellingReason;
        orderData.Orderstatus = 'Cancelled';
        orderData.CancelledDate = Date.now()
        await orderData.save();
        res.redirect(`/orderDetails?id=${orderId}`)
      }
    } else {
      orderData.cancellingReason = cancellingReason;
      orderData.Orderstatus = 'Cancelled';
      orderData.CancelledDate = Date.now()
      await orderData.save();
      res.redirect(`/orderDetails?id=${orderId}`)
    }


  } catch (error) {
    console.log(error);
  }
}

const postReturnOrder = async (req, res) => {
  try {
    let { orderId, returningReason, returnedProducts } = req.body;
    returnedProducts = Array.isArray(returnedProducts) ? returnedProducts : [returnedProducts];
    
    const orderData = await Order.findOne({ "OrderId": orderId })
    let returnProductAmount = 0;
    for (const product of orderData.Products) {

      for (const returnedProduct of returnedProducts) {
        if (product._id.equals(returnedProduct)) {
          await Product.updateOne(
            { "Versions._id": product.Version },
            { $inc: { "Versions.$.Quantity": product.Quantity } }
          );
          returnProductAmount += (product.Price * product.Quantity);
          product.Returned = true;
        }
      }
    }orderData.TotalAmount -=returnProductAmount;

    if (orderData.Orderstatus === 'Delivered' || orderData.Orderstatus === 'Returned') {
      const updateWallet = await Wallet.updateOne(
        { "UserId": req.session.userData._id },
        {
          $inc: { "Balance": returnProductAmount }, // Increment the balance
          $push: {
            "Transaction": {
              Type: 'Refund',
              Amount: returnProductAmount,
              Date: new Date() // Record the date of the transaction
            }
          }
        },
        { upsert: true }
      );
      if (updateWallet.modifiedCount>0) {
        orderData.ReturningReason = returningReason;
        orderData.Orderstatus = 'Returned';
        orderData.ReturnedDate = Date.now()
        await orderData.save();
        res.redirect(`/orderDetails?id=${orderId}`)
      }
    }else {
      orderData.ReturningReason = returningReason;
      orderData.Orderstatus = 'Returned';
      orderData.CancelledDate = Date.now()
      await orderData.save();
      res.redirect(`/orderDetails?id=${orderId}`)
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

    res.render('user/orderComplete', pushData);

  } catch (error) {
    console.log(error);
  }
}


const getInvoice = async(req,res)=>{
  try {
    const { orderId } = req.query; // Assuming you're passing the order ID as a parameter

    // Fetch the specific order from MongoDB
    const order = await Order.findOne({ "OrderId": orderId })
      .populate('UserId')
      .populate({ path: 'Products', populate:{path:'Product',ref:'Product'} });

      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Order-${order.OrderId}.pdf`);
  
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);
  
  
      // // Add the checkmark and "Order Data" title
      // drawCircle(doc.page.width / 2, 70, 25, '#D4AF37');
      // doc.fill('white').fontSize(24).text('✓', doc.page.width / 2 - 7, 58);
      // doc.moveDown();
      doc
      .image("public/images/logo.png", 50, 45, { width: 120 })
      doc.fill('black').fontSize(20).text('Order Data', { align: 'center' });
      doc.moveDown();
  
      // Add the order details table
      doc.fontSize(10).font('Helvetica');
      const tableTop = 150;
      const tableLeft = 50;
      const tableWidth = doc.page.width - 100;
      const tableHeight = 70;
  
      doc.rect(tableLeft, tableTop, tableWidth, tableHeight).stroke();
      doc.moveTo(tableLeft, tableTop + 25).lineTo(tableLeft + tableWidth, tableTop + 25).stroke();
  
      const colWidth = tableWidth / 3;
      [ 'Date','Order Number', 'Payment Method'].forEach((header, i) => {
        doc.text(header, tableLeft + i * colWidth + 5, tableTop + 10);
      });
  
      [ new Date(order.createdAt).toISOString().split('T')[0],order.OrderId,
       order.PaymentMethod].forEach((value, i) => {
        doc.text(value, tableLeft + i * colWidth + 5, tableTop + 35);
      });
  
      // Add the "ORDER STATUS" and "ORDER DETAILS" sections
      doc.fontSize(12).text(`ORDER STATUS : `, 50, 250, { continued: true })
        .fillColor('green').text('ORDER PLACED')
        .fillColor('black');
      doc.text('ORDER DETAILS', 50, 270);
  
      // Add the product details
      doc.fontSize(10);
      doc.text('PRODUCT', 50, 300);
      doc.text('SUBTOTAL', 450, 300);
  
      let yPosition = 320;
      order.Products.forEach(product => {
        doc.text(`${product.Product.Name} x ${product.Quantity}`, 50, yPosition);
        doc.text(`Rs. ${(product.Product.Price * product.Quantity).toFixed(2)}`, 450, yPosition);
        yPosition += 30;
      });
  
      // Add the totals
      const drawLine = (y) => doc.moveTo(50, y).lineTo(500, y).stroke();
  
      yPosition += 10;
      drawLine(yPosition);
      yPosition += 10;
  
      doc.text('SUBTOTAL', 50, yPosition);
      doc.text(`Rs. ${(order.TotalAmount - 70).toFixed(2)}`, 450, yPosition);
  
      yPosition += 20;
      doc.text('COUPON', 50, yPosition);
      doc.text(order.Coupon || 'NIL', 450, yPosition);
  
      yPosition += 20;
      doc.text('DELIVERY', 50, yPosition);
      doc.text('Rs. 70', 450, yPosition);
  
      yPosition += 20;
      drawLine(yPosition);
      yPosition += 10;
  
      doc.fontSize(12).text('TOTAL', 50, yPosition);
      doc.text(`Rs. ${order.TotalAmount.toFixed(2)}`, 450, yPosition);
  
      // Draw a box around ORDER STATUS and below
      const boxTop = 240;
      const boxHeight = yPosition - boxTop + 30;
      doc.rect(40, boxTop, doc.page.width - 80, boxHeight).stroke();
  
      doc.end();
  } catch (error) {
    console.log(error);
  }
}



const paypalOrderComplete = async (req, res) => {
  try {

    const result = await Paypal.capturePayment(req.query.token);
    const orderData = await Order.updateOne({ "OrderId": req.session.orderId }, { $set: { "Orderstatus": 'Order Placed' } })
    if (orderData) {

      res.redirect(`/orderDetails?id=${req.session.orderId}`);

      req.session.orderId = '';
    }

  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  postCreateOrder,
  getPaypalPayment,
  postCancelOrder,
  postReturnOrder,
  getOrderDetails,
  getInvoice,
  paypalOrderComplete,
}