const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')
const Order = require('../../model/orderModel')

const fs = require("fs");
const PDFDocument = require("../../others/invoice");

const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sales Report');


const getSales = async (req, res) => {
  try {
    const adminName = req.session.adminData.Name
    addSalesMsg = req.flash('msg');
    if (!req.query) {
      const pushData = {
        adminName,
        addSalesMsg,
      }
      res.render('admin/sales', pushData)
    } else {
      const { startDate, endDate } = req.query;
      const orderObj = await Order.find({ $and: [{ "createdAt": { $gte: startDate } }, { "createdAt": { $lte: endDate } }, { "Orderstatus": "Delivered" }] })
        .populate('UserId').populate({ path: 'Products', populate: { path: 'Product', ref: 'Product' } }).sort({ "createdAt": -1 });

      const pushData = {
        adminName,
        addSalesMsg,
        orderObj,
        startDate,
        endDate
      }
      res.render('admin/sales', pushData)
    }


  } catch (error) {
    console.log(error);
  }
}

const getPdfDownload = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch orders based on date range and other criteria
    const orderObj = await Order.find({
      $and: [
        { "createdAt": { $gte: startDate } },
        { "createdAt": { $lte: endDate } },
        { "Orderstatus":  "Delivered"  }
      ]
    })
      .populate('UserId')
      .populate({ path: 'Products', populate: { path: 'Product', ref: 'Product' } })
      .sort({ "createdAt": -1 });

    // Set response headers to force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="SalesReport.pdf"');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Add logo and heading to the PDF document
    doc
      .image("public/images/logo.png", 50, 45, { width: 120 })
      .fillColor("#444444")
      .fontSize(20)
      .text("Sales Report", { align: 'center' })
      .moveDown()
      .fontSize(10)
      .text("PapasMen", { align: 'center' })
      .text("Silic city, 603001", { align: 'center' })
      .moveDown();


    // Calculate summary values
    const overallSalesCount = orderObj.length;
    const overallOrderAmount = orderObj.reduce((acc,curr)=>acc+=curr.TotalAmount,0)
    const overallDiscount = orderObj.reduce((acc, curr) => {
      const totalMRP = curr.Products.reduce((acc1, curr1) => {
        const mrp = parseFloat(curr1.Product.MRP);
        const quantity = parseInt(curr1.Quantity);
        return acc1 + (mrp * quantity);
      }, 0);
      const totalAmount = parseFloat(curr.TotalAmount);
      const deliveryCharge = 70; // Assuming a fixed delivery charge
      if (totalMRP > 0 && !isNaN(totalAmount)) {
        const discountPercentage = (((totalMRP - totalAmount + deliveryCharge) * 100) / totalMRP).toFixed(2);
        return acc + parseFloat(discountPercentage);
      }
      return acc;
    }, 0).toFixed(2)

    // Draw summary blocks
    const blockWidth = 160;
    const blockHeight = 80;
    const startY = 150;
    
    // Function to draw a summary block
    const drawSummaryBlock = (x, label, value) => {
      doc
        .rect(x, startY, blockWidth, blockHeight)
        .stroke()
        .fontSize(16)
        .text(value, x, startY + 20, { width: blockWidth, align: 'center' })
        .fontSize(12)
        .text(label, x, startY + 50, { width: blockWidth, align: 'center' });
    };

    drawSummaryBlock(50, "Overall sales count", overallSalesCount);
    drawSummaryBlock(220, "Overall order amount", overallOrderAmount);
    drawSummaryBlock(390, "Overall discount", `${overallDiscount}%`);

    // Move down after summary blocks
    doc.moveDown(3);

    // Prepare table headers and rows
    const headers = ["Date", "Order ID", "Product", "Quantity", "Coupon", "Discount", "Total"];
    const rows = [];

    // Loop through each order and populate rows
    orderObj.forEach(orderData => {
      const products = orderData.Products.map(product => product.Product.Name).join(", ");
      const quantities = orderData.Products.map(product => product.Quantity).join(", ");
      const discount = (
        (
          (
            orderData.Products.reduce((acc, curr) => acc += (curr.Product.MRP * curr.Quantity), 0) -
            orderData.TotalAmount + 70
          ) * 100
        ) / orderData.Products.reduce((acc, curr) => acc += (curr.Product.MRP * curr.Quantity), 0)
      ).toFixed(2);

      rows.push([
        new Date(orderData.createdAt).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' }),
        orderData.OrderId,
        products,
        quantities,
        orderData.Coupon || 'NIL',
        discount + '%',
        orderData.TotalAmount.toFixed(2)
      ]);
    });

    // Calculate table width and position
    const tableWidth = 500;
    const startX = (doc.page.width - tableWidth) / 2;

    // Draw the table
    doc.moveDown().table({
      headers,
      rows
    }, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
      prepareRow: (row, i) => doc.font('Helvetica').fontSize(8),
      width: tableWidth,
      x: startX,
      headerColor: '#F6F6F6',
      columnSpacing: 5,
      padding: 5,
      hideFirstBorder: true, // Remove the top border of the first row
    });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Error generating or downloading PDF:', error);
    res.status(500).send('Internal Server Error');
  }
};


const getExcelDownload = async(req,res)=>{
  try {
    const { startDate, endDate } = req.query;

    // Fetch orders based on date range and other criteria
    const orderObj = await Order.find({
      $and: [
        { "createdAt": { $gte: startDate } },
        { "createdAt": { $lte: endDate } },
        { "Orderstatus":  "Delivered"  }
      ]
    })
      .populate('UserId')
      .populate({ path: 'Products', populate: { path: 'Product', ref: 'Product' } })
      .sort({ "createdAt": -1 });

      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Product', key: 'product', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Coupon', key: 'coupon', width: 15 },
        { header: 'Discount', key: 'discount', width: 10 },
        { header: 'Total', key: 'total', width: 15 }
      ];

      // Add rows
      orderObj.forEach(orderData => {
        const products = orderData.Products.map(product => product.Product.Name).join(", ");
        const quantities = orderData.Products.map(product => product.Quantity).join(", ");
        const discount = (
          (
            (
              orderData.Products.reduce((acc, curr) => acc += (curr.Product.MRP * curr.Quantity), 0) -
              orderData.TotalAmount + 70
            ) * 100
          ) / orderData.Products.reduce((acc, curr) => acc += (curr.Product.MRP * curr.Quantity), 0)
        ).toFixed(2);

        worksheet.addRow({
          date: new Date(orderData.createdAt).toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' }),
          orderId: orderData.OrderId,
          product: products,
          quantity: quantities,
          coupon: orderData.Coupon || 'NIL',
          discount: discount + '%',
          total: orderData.TotalAmount.toFixed(2)
        });
      });

      // Set response headers to force download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="SalesReport.xlsx"');

      // Write the workbook to the response
      await workbook.xlsx.write(res);
      res.end();
    
  } catch (error) {
    console.log(error);
  }
}



module.exports = {
  getSales,
  getPdfDownload,
  getExcelDownload,
}