const Category = require('../model/categoryModel');
const Product = require('../model/productModel');
const mongoose = require('mongoose');


const updateOffer = async (req, res, next) => {
  try {
    const current = new Date();

    // Update offers for categories
    const categoryCheck = await Category.find({ "Offer.End": { $lte: current }, "OfferExpiry": false });

    if (categoryCheck.length > 0) {
      for (const curr of categoryCheck) {
        const productData = await Product.find({ "Category": curr._id });
        for (const product of productData) {
          let MRP = product.MRP;
          let discount = (MRP * curr.Offer.Percentage) / 100;
          product.Price += discount;
          await product.save();
        }
        curr.OfferExpiry = true;
        await curr.save();
      }
    }

    // Update offers for individual products
    const productCheck = await Product.find({ "Offer.End": { $lte: current }, "OfferExpiry": false });

    if (productCheck.length > 0) {
      for (const product of productCheck) {
        let MRP = product.MRP;
        let discount = (MRP * product.Offer.Percentage) / 100;
        product.Price += discount;
        product.OfferExpiry = true;
        await product.save();
      }
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  updateOffer,
};