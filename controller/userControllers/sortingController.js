const mongoose = require('mongoose')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');


const getSortCategory = async (req, res) => {
  try {
    const sortBy = req.query.id;
    const conditionValue = req.query.conditionValue
    const brands = req.query.brands ? req.query.brands.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const colors = req.query.colors ? req.query.colors.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const sizes = req.query.sizes ? req.query.sizes.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const { page = 1, limit = 6 } = req.query;

    let sortCriteria;

    switch (sortBy) {
      case "1":
        // Placeholder for sorting by popularity
        break;
      case "2":
        sortCriteria = { "Price": 1 };
        break;
      case "3":
        sortCriteria = { "Price": -1 };
        break;
      case "4":
        // Placeholder for sorting by average ratings
        break;
      case "5":
        sortCriteria = { "updatedAt": 1 };
        break;
      case "6":
        sortCriteria = { "updatedAt": -1 };
        break;
      case "7":
        sortCriteria = { "Name": 1 };
        break;
      case "8":
        sortCriteria = { "Name": -1 };
        break;
      default:
        sortCriteria = {}; // No sorting
    }

    const filterCriteria = {};

    if (brands.length > 0) {
      filterCriteria['Brand'] = { $in: brands.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (colors.length > 0 || sizes.length > 0) {
      filterCriteria['Versions'] = { $elemMatch: {} };

      if (colors.length > 0) {
        filterCriteria['Versions'].$elemMatch['Color'] = { $in: colors.map(id => new mongoose.Types.ObjectId(id)) };
      }

      if (sizes.length > 0) {
        filterCriteria['Versions'].$elemMatch['Size'] = { $in: sizes.map(id => new mongoose.Types.ObjectId(id)) };
      }
    }
    
      filterCriteria['Category'] = conditionValue;
     
    

    const productObj = await Product.find(filterCriteria)
      .sort(sortCriteria)
      .populate('Brand')
      .populate('Category')
      .populate({
        path: 'Versions',
        populate: [
          { path: 'Color', ref: 'Color' },
          { path: 'Size', ref: 'Size' }
        ]
      });

    const start = (page - 1) * limit;
    const paginatedProducts = productObj.slice(start, start + limit);

    res.json({ products: paginatedProducts, total: productObj.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



const getSortProducts = async (req, res) => {
  try {
    const sortBy = req.query.id;
    const conditionValue = req.query.conditionValue ? req.query.conditionValue.split(',') : [];
    const categories = req.query.categories ? req.query.categories.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const brands = req.query.brands ? req.query.brands.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const colors = req.query.colors ? req.query.colors.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const sizes = req.query.sizes ? req.query.sizes.split(',').filter(mongoose.Types.ObjectId.isValid) : [];
    const { page = 1, limit = 6 } = req.query;

    let sortCriteria;

    switch (sortBy) {
      case "1":
        // Placeholder for sorting by popularity
        break;
      case "2":
        sortCriteria = { "Price": 1 };
        break;
      case "3":
        sortCriteria = { "Price": -1 };
        break;
      case "4":
        // Placeholder for sorting by average ratings
        break;
      case "5":
        sortCriteria = { "updatedAt": 1 };
        break;
      case "6":
        sortCriteria = { "updatedAt": -1 };
        break;
      case "7":
        sortCriteria = { "Name": 1 };
        break;
      case "8":
        sortCriteria = { "Name": -1 };
        break;
      default:
        sortCriteria = {}; // No sorting
    }

    const filterCriteria = {};

    if (categories.length > 0) {
      filterCriteria['Category'] = { $in: categories.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (brands.length > 0) {
      filterCriteria['Brand'] = { $in: brands.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (colors.length > 0 || sizes.length > 0) {
      filterCriteria['Versions'] = { $elemMatch: {} };

      if (colors.length > 0) {
        filterCriteria['Versions'].$elemMatch['Color'] = { $in: colors.map(id => new mongoose.Types.ObjectId(id)) };
      }

      if (sizes.length > 0) {
        filterCriteria['Versions'].$elemMatch['Size'] = { $in: sizes.map(id => new mongoose.Types.ObjectId(id)) };
      }
    }

    if (conditionValue.length > 0 && conditionValue[0]!=='undefined') {
      filterCriteria['Name'] = { $regex: new RegExp(`^${conditionValue.join('|')}`, 'i') };
    }

    const productObj = await Product.find(filterCriteria)
      .sort(sortCriteria)
      .populate('Brand')
      .populate('Category')
      .populate({
        path: 'Versions',
        populate: [
          { path: 'Color', ref: 'Color' },
          { path: 'Size', ref: 'Size' }
        ]
      });

    const start = (page - 1) * limit;
    const paginatedProducts = productObj.slice(start, start + limit);

    res.json({ products: paginatedProducts, total: productObj.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};





module.exports = {
  getSortCategory,
  getSortProducts,
}