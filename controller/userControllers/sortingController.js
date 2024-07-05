const mongoose = require('mongoose')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');


const getSortCategory = async (req, res) => {
  try {
    const sortBy = req.query.id;
    const conditionValue = req.query.conditionValue ? req.query.conditionValue.split(',') : [];
    const { page = 1, limit = 6 } = req.query;
    
    // Filter valid ObjectIDs
    const validObjectIds = conditionValue.filter(value => mongoose.Types.ObjectId.isValid(value));
    
    let sortCriteria;
    let productObj;

    switch (sortBy) {
      case "1":
        // Placeholder for sorting by popularity
        break;
      case "2":
        sortCriteria = { "Versions.Price": 1 };
        break;
      case "3":
        sortCriteria = { "Versions.Price": -1 };
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
        // No sorting
    }

    if (validObjectIds.length > 0) {
      productObj = await Product.find({ "Category": { $in: validObjectIds } })
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
    } else {
      productObj = await Product.find({ "Name": { $regex: new RegExp(`^${conditionValue.join('|')}`, 'i') } })
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
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedProducts = productObj.slice(start, end);

    res.json({ products: paginatedProducts, total: productObj.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



module.exports = {
  getSortCategory,
}