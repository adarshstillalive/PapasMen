const Category = require('../../model/categoryModel')
const Product = require('../../model/productModel')
const Brand = require('../../model/brandModel')
const Size = require('../../model/sizeModel')
const Color = require('../../model/colorModel')

const fs = require('fs');
const path = require('path');


const getProducts = async (req, res) => {
  try {
    let page = 1;
    const limit = 6
    if(req.query.page){
      page = req.query.page;
    }
    const totalCount = await Product.find().countDocuments();
    const totalPage = Math.ceil(totalCount/limit)
    const productObj = await Product.find().populate('Brand').populate('Category').limit(limit).skip((page-1)*limit)
    const pushData = {
      adminName: req.session.adminData.Name,
      addProductMsg: req.flash('msg'),
      productObj, totalPage,page
    }

    res.render('admin/products', pushData)
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

    const fetchArray = [Category.find(), Brand.find(), Color.find(), Size.find()];
    const [categoriesData, brandsData, colorsData, sizesData] = await Promise.all(fetchArray)

    const pushData = {
      adminName: req.session.adminData.Name,
      productObj: await Product.findOne({ "_id": req.query.id }).populate('Brand').populate('Category')
        .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] }),
      categoriesData,
      brandsData,
      colorsData,
      sizesData,
      addProductMsg: req.flash('msg')
    }
    // console.log(pushData.productObj)
    res.render('admin/editProduct', pushData)
  } catch (error) {
    console.log(error)
  }
}


const postEditProduct = async (req, res) => {
  try {
    const parseProductData = (body) => {
      const existingVersions = [];
      const newVersions = [];
      const deletedVersions = body.deletedVersions ? body.deletedVersions.split(',') : [];

      // Extract existingVersions and newVersions from body
      for (const key in body) {
        if (key.startsWith('existingVersions[')) {
          const match = key.match(/existingVersions\[(\d+)\]\.(\w+)/);
          if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            if (!existingVersions[index]) {
              existingVersions[index] = {};
            }
            existingVersions[index][field] = body[key];
          }
        } else if (key.startsWith('newVersions[')) {
          const match = key.match(/newVersions\[(\d+)\]\.(\w+)/);
          if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            if (!newVersions[index]) {
              newVersions[index] = {};
            }
            newVersions[index][field] = body[key];
          }
        }
      }

      return {
        existingVersions: existingVersions.filter(Boolean),
        newVersions: newVersions.filter(Boolean),
        deletedVersions,
      };
    };
    const {productId,Name,BrandId,CategoryId,Description,removedImages} = req.body
    const {existingVersions,newVersions,deletedVersions} = parseProductData(req.body);


    const product = await Product.findOne({"_id":productId});

     // Handle image removal
    if (removedImages && Array.isArray(removedImages)) {
      removedImages.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        product.Image = product.Image.filter(img => img !== imagePath);
      });
    }

    // Handle new image uploads
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        product.Image.push('uploads/' + file.filename);
      });
    }

    // Remove deleted versions
    product.Versions = product.Versions.filter(version => 
      !deletedVersions.includes(version._id.toString())
    );

    // Update existing versions
    existingVersions.forEach(ev => {
      const version = product.Versions.id(ev._id);
      if (version) {
        version.Color = ev.Color;
        version.Size = ev.Size;
        version.Quantity = ev.Quantity;
        version.Price = ev.Price;
      }
    });

    // Add new versions
    newVersions.forEach(nv => {
      product.Versions.push({
        Color: nv.Color,
        Size: nv.Size,
        Quantity: nv.Quantity,
        Price: nv.Price
      });
    });


    // Update product details
    product.Name = Name.trim();
    product.Brand = BrandId.trim();
    product.Category = CategoryId.trim();
    product.Description = Description.trim();

    // Save the updated product
    const savedProduct = await product.save();

    if (savedProduct) {
      req.flash('msg', 'Product Edited Successfully');
      res.status(200).json({ success: true });
    } else {
      req.flash('msg', 'Product Editing failed');
      res.status(400).json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const getAddProduct = async (req, res) => {
  try {

    const fetchArray = [Category.find(), Brand.find(), Color.find(), Size.find()];
    const [categoriesData, brandsData, colorsData, sizesData] = await Promise.all(fetchArray)

    const pushData = {
      adminName: req.session.adminData.Name,
      addProductMsg: req.flash('msg'),
      categoriesData,
      brandsData,
      colorsData,
      sizesData
    }
    res.render('admin/addProduct', pushData)
  } catch (error) {
    console.log(error)
  }
}

const postAddProduct = async (req, res) => {
  try {

    const versions = [];
    const {Name,BrandId,CategoryId,Description} = req.body;
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
      Name: Name.trim(),
      Brand: BrandId.trim(),
      Category: CategoryId.trim(),
      Description: Description.trim(),
      Image: imageUrls,
      Versions: versions
    }

    const product = new Product(productList);
    const saveProduct = await product.save();

    if (saveProduct) {
      req.flash('msg', 'Product added');
      res.status(200).json({ success: true })
    } else {
      req.flash('msg', 'Product creation failed');
      res.status(200).json({ success: false })
    }

  } catch (error) {
    console.log(error)
  }
}


module.exports = {

  getProducts,
  getDeleteProduct,
  getUnBlockProduct,
  getEditProduct,
  postEditProduct,
  getAddProduct,
  postAddProduct,
}