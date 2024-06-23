const User = require('../model/userModel')
const Category = require('../model/categoryModel')
const Product = require('../model/productModel')
const Brand = require('../model/brandModel')
const Size = require('../model/sizeModel')
const Color = require('../model/colorModel')
const bcrypt = require('bcrypt')

const fs = require('fs');
const path = require('path');

const dashboard = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name
    }
    res.render('dashboard', pushData)
  } catch (error) {
    console.log(error)
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
    res.render('adminLogin', { loginMessage })
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

const getUsers = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      userObj: await User.find({})
    }
    res.render('users', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const updateData = await User.updateOne({ "_id": userId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/users')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const updateData = await User.updateOne({ "_id": userId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/users')
    }
  } catch (error) {
    console.log(error)
  }
}
const getCategories = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      categoryObj: await Category.find({}).limit(10),
      addCategoryMsg: req.flash('msg')
    }
    res.render('category', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const updateData = await Category.updateOne({ "_id": categoryId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/categories')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const updateData = await Category.updateOne({ "_id": categoryId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/categories')
    }
  } catch (error) {
    console.log(error)
  }
}

const getEditCategory = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      categoryObj: await Category.findOne({ "_id": req.query.id }),
      addCategoryMsg: req.flash('msg')
    }
    res.render('editCategory', pushData)

  } catch (error) {
    console.log(error)
  }
}

const postEditCategory = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const categoryExist = await Category.find({ "Name": Name.trim() });
    if (categoryExist.length > 1) {
      req.flash('msg', 'Category already exists')
      res.redirect(`/admin/categories/editCategory?id=${req.body._id}`)
    } else {

      const updateCategory = await Category.updateOne({ "_id": req.body._id }, { $set: { "Name": Name.trim(), "isActive": isActive } })
      if (updateCategory) {
        req.flash('msg', 'Category updated');
        res.redirect('/admin/categories')
      } else {
        req.flash('msg', 'Error, Try again');
        res.redirect('/admin/categories/editCategory');
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getAddCategory = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addCategoryMsg: req.flash('msg')
    }
    res.render('addcategory', pushData)
  } catch (error) {
    console.log(error)
  }
}
const postAddCategory = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const categoryData = await Category.findOne({ "Name": Name.trim() });
    if (categoryData) {
      req.flash('msg', 'Category exists')
      res.redirect('/admin/categories/addCategory')
    } else {
      const addData = await Category.create({ "Name": Name.trim(), "isActive": isActive })
      if (addData) {
        req.flash('msg', 'Category added successfully');
        res.redirect('/admin/categories')
      } else {
        req.flash('msg', 'Category adding failed');
        res.redirect('/admin/categories/addCategory')
      }
    }
  } catch (error) {
    console.log(error)
  }
}
const getBrands = async (req, res) => {
  try {

    const pushData = {
      adminName: req.session.adminData.Name,
      brandObj: await Brand.find({}).limit(10),
      addBrandMsg: req.flash('msg')
    }
    res.render('brand', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteBrand = async (req, res) => {
  try {
    const brandId = req.query.id;
    const updateData = await Brand.updateOne({ "_id": brandId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/brands')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockBrand = async (req, res) => {
  try {
    const brandId = req.query.id;
    const updateData = await Brand.updateOne({ "_id": brandId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/brands')
    }
  } catch (error) {
    console.log(error)
  }
}

const getEditBrand = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      brandObj: await Brand.findOne({ "_id": req.query.id }),
      addBrandMsg: req.flash('msg')
    }
    res.render('editBrand', pushData)

  } catch (error) {
    console.log(error)
  }
}

const postEditBrand = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const brandExist = await Brand.find({ "Name": Name.trim() });
    if (brandExist.length > 1) {
      req.flash('msg', 'Brand name already Exist');
      res.redirect(`/admin/brands/editBrand?id=${req.body._id}`)
    } else {

      const updateBrand = await Brand.updateOne({ "_id": req.body._id }, { $set: { "Name": Name.trim(), "isActive": isActive } })
      if (updateBrand) {
        req.flash('msg', 'Brand updated');
        res.redirect('/admin/brands')
      } else {
        req.flash('msg', 'Error, Try again');
        res.redirect('/admin/brands/editBrand');
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const getAddBrand = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addBrandMsg: req.flash('msg')
    }
    res.render('addBrand', pushData)
  } catch (error) {
    console.log(error)
  }
}
const postAddBrand = async (req, res) => {
  try {
    const { Name, isActive } = req.body;
    const brandData = await Brand.findOne({ "Name": Name.trim() });
    if (brandData) {
      req.flash('msg', 'Brand exists')
      res.redirect('/admin/brands/addBrand')
    } else {
      const addData = await Brand.create({ "Name": Name.trim(), "isActive": isActive })
      if (addData) {
        req.flash('msg', 'Brand added successfully');
        res.redirect('/admin/brands')
      } else {
        req.flash('msg', 'Brand adding failed');
        res.redirect('/admin/brands/addBrand')
      }
    }
    console.log(Name, isActive)
  } catch (error) {
    console.log(error)
  }
}

const getProducts = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addProductMsg: req.flash('msg'),
      productObj: await Product.find({}).populate('Brand').populate('Category').limit(10)
    }

    res.render('products', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getDeleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const updateData = await Product.updateOne({ "_id": productId }, { $set: { "isActive": "false" } });
    if (updateData) {
      res.redirect('/admin/products')
    }
  } catch (error) {
    console.log(error)
  }
}

const getUnBlockProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const updateData = await Product.updateOne({ "_id": productId }, { $set: { "isActive": "true" } });
    if (updateData) {
      res.redirect('/admin/products')
    }
  } catch (error) {
    console.log(error)
  }
}

const getEditProduct = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      productObj: await Product.findOne({"_id": req.query.id }).populate('Brand').populate('Category')
      .populate({path:'Versions',populate:[{path:'Color',ref:'Color'},{path:'Size',ref:'Size'}]}),
      categoriesData: await Category.find(),
      brandsData: await Brand.find(),
      colorsData: await Color.find(),
      sizesData: await Size.find(),
      addProductMsg: req.flash('msg')
    }
    // console.log(pushData.productObj)
    res.render('editProduct', pushData)
  } catch (error) {
    console.log(error)
  }
}




const postEditProduct = async (req, res) => {
  try {
    console.log(req.body, req.files);

    const { productId, removedVersions,existingVersions, removedImages } = req.body;

    // Fetch the existing product
    const product = await Product.findOne({ "_id": productId });

    // Handle version removal
    if (removedVersions) {
      const removePromises = removedVersions.map(async objectId => {
        return await Product.updateOne(
          { "_id": productId },
          { $pull: { "Versions": { "_id": objectId } } }
        );
      });

      await Promise.all(removePromises)
        .then(results => {
          console.log('Removed successfully', results);
        })
        .catch(err => {
          console.log(err);
        });
    }

    // Handle image removal
    if (removedImages) {
      removedImages.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Delete the file from the server
        }
        // Remove the image path from the product's image array
        product.Image = product.Image.filter(img => img !== imagePath);
      });
    }

    // Handle new image uploads
    if (req.files) {
      req.files.forEach(file => {
        product.Image.push('uploads/' + file.filename);
      });
    }


    // Iterate through req.body to find versions data
    const versions = req.body['Versions[${versionCount}].ColorName'].map((colorName, index) => ({
      Color: req.body['Versions[${versionCount}].Color'][index],

      Size: req.body['Versions[${versionCount}].Size'][index],
      Quantity:Number(req.body['Versions[${versionCount}].Quantity'][index]),
      Price:Number(req.body['Versions[${versionCount}].Price'][index]),
    }));
    console.log('check here');
    console.log(versions);

    // Handle version updates and additions
    existingVersions.forEach((versionId,index) => {
      const dbVersion = product.Versions.find(
        version => version._id.toString() === versionId
      );
      console.log(dbVersion);

      if (dbVersion) {
        // Check if any field has been updated
        let isUpdated = false;
        ['Color', 'Size', 'Quantity', 'Price'].forEach(field => {
          if (dbVersion[field] !== versions[index][field]) {
            dbVersion[field] = versions[index][field];
            isUpdated = true;
          }
        });

        if (isUpdated) {
          console.log(`Version  updated.`);
        }
      } else {
        // Add new version

        product.Versions.push(versions);
        console.log(`New version added:`, versions);
      }
    });

    // Update product details
    product.Name = req.body.Name.trim();
    product.Brand = req.body.BrandId.trim();
    product.Category = req.body.CategoryId.trim();
    product.Description = req.body.Description.trim();

    // Save the updated product
    const saveProduct = await product.save();

    if (saveProduct) {
      req.flash('msg', 'Product Edited');
      res.status(200).json({ success: true });
    } else {
      req.flash('msg', 'Product Editing failed');
      res.status(200).json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};




const getAddProduct = async (req, res) => {
  try {
    const pushData = {
      adminName: req.session.adminData.Name,
      addProductMsg: req.flash('msg'),
      categoriesData: await Category.find(),
      brandsData: await Brand.find(),
      colorsData: await Color.find(),
      sizesData: await Size.find()
    }
    res.render('addProduct', pushData)
  } catch (error) {
    console.log(error)
  }
}

const postAddProduct = async (req, res) => {
  try {

    const versions = [];

    // Iterate through req.body to find versions data
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('Versions[')) {
        const match = key.match(/\[(\d+)\]\.(Color|Size|Quantity|Price)$/);
        if (match) {
          const index = match[1];
          const field = match[2];
          if (!versions[index]) {
            versions[index] = {};
          }
          versions[index][field] = req.body[key];
        }
      }
    });
    console.log(versions);
    // Image uploads
    const imageObjects = req.files.map(async (file) => {
      console.log(file);
      const imagePath = `uploads/${file.filename}`;
      return imagePath

    })

    const imageUrls = await Promise.all(imageObjects);

    const productList = {
      Name: req.body.Name.trim(),
      Brand: req.body.BrandId.trim(),
      Category: req.body.CategoryId.trim(),
      Description: req.body.Description.trim(),
      Image: imageUrls,
      Versions:versions
    }

    const product = new Product(productList);
    const saveProduct = await product.save();

    if (saveProduct) {
      req.flash('msg', 'Product added');
      res.status(200).json({success:true})
    } else {
      req.flash('msg', 'Product creation failed');
      res.status(200).json({success:false})
    }

  } catch (error) {
    console.log(error)
  }
}




module.exports = {
  dashboard,
  getLogout,
  getLogin,
  postLogin,
  getUsers,
  getDeleteUser,
  getUnBlockUser,
  getCategories,
  getDeleteCategory,
  getUnBlockCategory,
  getEditCategory,
  postEditCategory,
  getAddCategory,
  postAddCategory,
  getBrands,
  getDeleteBrand,
  getUnBlockBrand,
  getEditBrand,
  postEditBrand,
  getAddBrand,
  postAddBrand,
  getProducts,
  getDeleteProduct,
  getUnBlockProduct,
  getEditProduct,
  postEditProduct,
  getAddProduct,
  postAddProduct,

}