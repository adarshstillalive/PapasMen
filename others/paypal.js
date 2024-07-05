const axios = require('axios');
const Order = require('../model/orderModel')

async function GenerateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
    method: 'POST',
    data: 'grant_type=client_credentials',
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET
    }

  })
  return response.data.access_token
}

async function paypalCreateOrder(orderId) {
  
  const accessToken = await GenerateAccessToken();

  const orderObj = await Order.findOne({ "OrderId": orderId }).populate('Products.Product')

  const items = orderObj.Products.map((item) => ({
    name: item.Product.Name,
    quantity: item.Quantity,
    unit_amount: {
      currency_code: 'USD',
      value: item.Product.Versions[0].Price
    }
  }))



  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        items: items,

        amount: {
          currency_code: 'USD',
          value: items.reduce((acc,curr)=> acc+=curr.unit_amount.value,0),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: items.reduce((acc,curr)=> acc+=curr.unit_amount.value,0)
            }
          }
        }
      }
    ],

    application_context: {
      return_url: 'http://localhost:8080/paypal/orderComplete',
      cancel_url: 'http://localhost:8080/cart/checkout',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      brand_name: 'PapasMen'
    }
  }


  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    data: JSON.stringify(orderData)
  })

  return response.data.links.find(link => link.rel === 'approve').href
}

async function capturePayment(orderId){
  console.log(orderId);
  const accessToken = await GenerateAccessToken();
  const response = axios({
    url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
    method: 'post',
    headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    }
  })
  return response.data
}



module.exports = {
  paypalCreateOrder,
  capturePayment,
}