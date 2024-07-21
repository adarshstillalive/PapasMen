const axios = require('axios');
const Order = require('../model/orderModel')

async function convert(price) {
  const host = 'api.frankfurter.app';

  try {
    const response = await axios.get(`https://${host}/latest?amount=${price}&from=INR&to=USD`);
    const data = response.data;
    return data.rates.USD;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error; // Ensure the error is propagated
  }
}

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

  const items = await Promise.all(orderObj.Products.map(async (item) => {
    const convertedPrice = await convert(item.Product.Price);
    return {
      name: item.Product.Name,
      quantity: item.Quantity,
      unit_amount: {
        currency_code: 'USD',
        value: convertedPrice.toFixed(2) 
      },
      returned: false
    };
  }));

  const deliveryCharge = await convert(70);

  const itemTotal = items.reduce((acc, curr) => acc += parseFloat(curr.unit_amount.value * curr.quantity), 0);

  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        items: items,
        amount: {
          currency_code: 'USD',
          value: (itemTotal + deliveryCharge).toFixed(2), // Convert to string with two decimal places
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: itemTotal.toFixed(2)
            },
            shipping: {
              currency_code: 'USD',
              value: deliveryCharge.toFixed(2)
            }
          }
        }
      }
    ],
    application_context: {
      return_url: 'https://papasmen.wildsurf.net/paypal/orderComplete',
      cancel_url: 'https://papasmen.wildsurf.net/profile/orders',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      brand_name: 'PapasMen'
    }
  };


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