const express = require('express');
const adminRoute = express(); // Use express.Router() for routing
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const Auth = require('../middlewares/adminAuth');
const commonController = require('../controller/adminControllers/commonController');
const userController = require('../controller/adminControllers/userController');
const brandController = require('../controller/adminControllers/brandController');
const categoryController = require('../controller/adminControllers/categoryController');
const productController = require('../controller/adminControllers/productController');
const orderController = require('../controller/adminControllers/orderController');


// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, 'uploads'); // relative path for the destination folder
  },
  filename: function (req, file, cb) {
    const name = Date.now()+''+file.originalname
    return cb(null, name); // file name for the uploaded file
  }
});


const upload = multer({ storage: storage });

// Session and flash middleware
adminRoute.use(session({
  secret: 'dammn',
  resave: false,
  saveUninitialized: true,
}));

adminRoute.use(flash());

// view engine and views path
adminRoute.set('view engine', 'ejs');
adminRoute.set('views', 'views/admin');

// Static file serving
adminRoute.use('/uploads', express.static('uploads'));

// Defined routes
adminRoute.get('/', Auth.isAdmin, commonController.dashboard);
adminRoute.get('/signout', Auth.isAdmin, commonController.getLogout);
adminRoute.get('/signin', Auth.notAdmin, commonController.getLogin);
adminRoute.post('/signin', Auth.notAdmin, commonController.postLogin);
adminRoute.get('/users', Auth.isAdmin, userController.getUsers);
adminRoute.get('/users/delete', Auth.isAdmin, userController.getDeleteUser);
adminRoute.get('/users/unblock', Auth.isAdmin, userController.getUnBlockUser);

adminRoute.get('/orders',Auth.isAdmin,orderController.getOrders);
adminRoute.get('/viewOrder',Auth.isAdmin,orderController.getViewOrder);
adminRoute.post('/updateOrderStatus',Auth.isAdmin,orderController.postUpdateOrderStatus);

adminRoute.get('/categories', Auth.isAdmin, categoryController.getCategories);
adminRoute.get('/categories/delete', Auth.isAdmin, categoryController.getDeleteCategory);
adminRoute.get('/categories/unblock', Auth.isAdmin, categoryController.getUnBlockCategory);
adminRoute.get('/categories/editCategory', Auth.isAdmin, categoryController.getEditCategory);
adminRoute.post('/categories/editCategory', Auth.isAdmin, categoryController.postEditCategory);
adminRoute.get('/categories/addCategory', Auth.isAdmin, categoryController.getAddCategory);
adminRoute.post('/categories/addCategory', Auth.isAdmin, categoryController.postAddCategory);

adminRoute.get('/brands', Auth.isAdmin, brandController.getBrands);
adminRoute.get('/brands/delete', Auth.isAdmin, brandController.getDeleteBrand);
adminRoute.get('/brands/unblock', Auth.isAdmin, brandController.getUnBlockBrand);
adminRoute.get('/brands/editBrand', Auth.isAdmin, brandController.getEditBrand);
adminRoute.post('/brands/editBrand', Auth.isAdmin, brandController.postEditBrand);
adminRoute.get('/brands/addBrand', Auth.isAdmin, brandController.getAddBrand);
adminRoute.post('/brands/addBrand', Auth.isAdmin, brandController.postAddBrand);

adminRoute.get('/products', Auth.isAdmin, productController.getProducts);
adminRoute.get('/products/delete', Auth.isAdmin, productController.getDeleteProduct);
adminRoute.get('/products/unblock', Auth.isAdmin, productController.getUnBlockProduct);
adminRoute.get('/products/editProduct', Auth.isAdmin, productController.getEditProduct);
adminRoute.post('/products/editProduct', Auth.isAdmin,upload.array('Image',5), productController.postEditProduct);
adminRoute.get('/products/addProduct', Auth.isAdmin, productController.getAddProduct);
adminRoute.post('/products/addProduct', Auth.isAdmin, upload.array('Image', 5), productController.postAddProduct);


module.exports = adminRoute;
