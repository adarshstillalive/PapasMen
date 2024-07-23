const User = require('../../model/userModel');
const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')
const Order = require('../../model/orderModel')

const bcrypt = require('bcrypt')


const dashboard = async (req, res) => {
  try {
    //Top 10 products
    const topProductsPipeline = [
      { 
        $match: { 
          Orderstatus: { $ne: 'Returned' } 
        } 
      },
      { 
        $unwind: '$Products' 
      },
      {
        $group: {
          _id: '$Products.Product',
          totalQuantity: { $sum: '$Products.Quantity' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'Product'
        }
      },
      {
        $addFields: {
          Product: {
            $cond: {
              if: { $eq: [{ $size: '$Product' }, 0] },
              then: { Name: 'Unknown Product' },
              else: { $arrayElemAt: ['$Product', 0] }
            }
          }
        }
      },
      { 
        $sort: { totalQuantity: -1 } 
      },
      { 
        $limit: 10 
      }
    ];

    //Top 10 categories

    const topCategoriesPipeline = [
      {
        $match: { Orderstatus: { $ne: 'Returned' } }
      },
      {
        $unwind: "$Products"
      },
      {
        $lookup: {
          from: 'products',
          localField: 'Products.Product',
          foreignField: '_id',
          as: 'Product'
        }
      },
      {
        $unwind: "$Product"
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'Product.Category',
          foreignField: '_id',
          as: 'Category'
        }
      },
      {
        $unwind: "$Category"
      },
      {
        $group: {
          _id: "$Category._id",
          categoryName: { $first: "$Category.Name" }, 
          totalQuantity: { $sum: "$Products.Quantity" }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ];

    // Top 10 brands

    const topBrandsPipeline = [
      {
        $match: { Orderstatus: { $ne: 'Returned' } }
      },
      {
        $unwind:"$Products"
      },
      {
        $lookup:{from:'products',localField:'Products.Product',foreignField:'_id',as:'Product'}
      },
      {
        $unwind:'$Product'
      },
      {
        $lookup:{from:'brands',localField:'Product.Brand',foreignField:'_id',as:'Brand'}
      },
      {
        $unwind:"$Brand"
      },
      {
        $group:{_id:"$Brand._id",totalQuantity:{$sum:"$Products.Quantity"},brandName:{$first:"$Brand.Name"}}
      },
      {
        $sort:{totalQuantity:-1}
      },
      {
        $limit:10
      }
    ];

    const [topProducts, topCategories, topBrands, orderObj, totalUsers] = await Promise.all([
      Order.aggregate(topProductsPipeline),
      Order.aggregate(topCategoriesPipeline),
      Order.aggregate(topBrandsPipeline),
      Order.find(),
      User.find({"isAdmin":0}).countDocuments()
    ])
    

    const totalSalesCount = orderObj.reduce((acc,curr)=>{
      if(curr.Orderstatus==='Delivered'){
        acc+=1
      }
      return acc
    },0);

    const totalSalesAmount = orderObj.reduce((acc,curr)=>{
      if(curr.Orderstatus==='Delivered'){
        acc+=curr.TotalAmount
      }return acc
    },0)

    const totalReturned = orderObj.reduce((acc,curr)=>{
      acc+=curr.Products.reduce((acc1,curr1)=>{
        if(curr1.Returned){
          acc1+=1
        }return acc1
      },0)
      return acc
    },0)



    const pushData = {
      adminName: req.session.adminData.Name,
      topProducts,topCategories,topBrands,orderObj,totalSalesCount, totalSalesAmount, totalReturned, totalUsers
    }
    res.render('admin/dashboard', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDashboardChart = async(req,res)=>{
  try {

    const {timeframe} = req.params;
    switch(timeframe){
      case 'Daily':
        condition = [{$match:{Orderstatus:'Delivered'}},{$group:{_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },saleCount:{$sum:1}}},{$sort:{_id:1}}]
        break;
      case 'Weekly':
        condition = [{$match:{Orderstatus:'Delivered'}},{$group:{_id:  {year: { $isoWeekYear: "$createdAt" },week: { $isoWeek: "$createdAt" }},saleCount:{$sum:1}}},{$sort: { "_id.year": 1, "_id.week": 1 }}]
        break;
      case 'Monthly':
        condition = [
          { $match: { Orderstatus: 'Delivered' } },
          { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, saleCount: { $sum: 1 } } },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ];
        break;
      case 'Yearly':
        condition = [
          { $match: { Orderstatus: 'Delivered' } },
          { $group: { _id: { year: { $year: "$createdAt" } }, saleCount: { $sum: 1 } } },
          { $sort: { "_id.year": 1 } }
        ];
        break;
      }

    const chartData = await Order.aggregate(condition);


    // Function to get the start date of the ISO week
    const getISOWeekStartDate = (year, week) => {
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dow = simple.getDay();
      const ISOWeekStart = simple;
      if (dow <= 4) {
        ISOWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      return ISOWeekStart;
    };

    // Format the data for Chart.js
    const labels = chartData.map(item => {
      switch (timeframe) {
        case 'Daily':
          return item._id;
        case 'Weekly':
          const startDate = getISOWeekStartDate(item._id.year, item._id.week);
          return startDate.toISOString().split('T')[0];
        case 'Monthly':
          return `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
        case 'Yearly':
          return item._id.year.toString();
      }
    });

    const data = chartData.map(item => item.saleCount);

    res.json({
      labels: labels,
      datasets: [{
        label: `${timeframe} sales`,
        data: data,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    });
  } catch (error) {
    console.log(error);
  }
}

const getLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin/signin')
  } catch (error) {
    console.log(error)
  }
}

const getLogin = async (req, res) => {
  try {
    const loginMessage = req.flash('msg')
    res.render('admin/adminLogin', { loginMessage })
  } catch (error) {
    console.log(error)
  }
}

const postLogin = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    const adminData = await User.findOne({ "Email": Email });
    if (adminData && adminData.isAdmin === 1) {
      const checkPassword = await bcrypt.compare(Password, adminData.Password)
      if (checkPassword) {
        req.session.isAdmin = true;
        req.session.adminData = adminData
        res.redirect('/admin')
      } else {
        req.flash('msg', 'Password mismatch')
        res.redirect('/admin/signin')
      }
    } else {
      req.flash('msg', 'Enter valid Email')
      res.redirect('/admin/signin')
    }
  } catch (error) {
    console.log(error)
  }
}


module.exports = {

  dashboard,
  getDashboardChart,
  getLogout,
  getLogin,
  postLogin,
}