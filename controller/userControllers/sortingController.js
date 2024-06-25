const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');

const getSortCategory = async (req,res)=>{
  try {
    const sortOption = req.query.id;
    const categoryId = req.query.categoryId;
    let sortCriteria;

    switch (sortOption) {
      case "1":
        // Placeholder for sorting by popularity
        break;
      case "2":
        sortCriteria = {"Versions.Price":1};
        break;
      case "3":
        sortCriteria = {"Versions.Price":-1};
        break;
      case "4":
        // Placeholder for sorting by average ratings
        break;
      case "5":
        sortCriteria = {"updatedAt": 1}
        break;
      case "6":
        sortCriteria = {"updatedAt":-1};
        break;
      case "7":
        sortCriteria = {"Name":1};
        break;
      case "8":
        sortCriteria = {"Name":-1};
        break;
      default:
        // No sorting
    }

    const productObj = await Product.find({"Category":categoryId}).sort(sortCriteria);
    
    res.json(productObj)

  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  getSortCategory,
}