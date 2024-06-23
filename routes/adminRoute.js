const express = require('express');
const adminRoute = express(); // Use express.Router() for routing
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const Auth = require('../middlewares/adminAuth');
const adminController = require('../controller/adminController');


// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, 'uploads'); // Correct relative path for the destination folder
  },
  filename: function (req, file, cb) {
    const name = Date.now()+''+file.originalname
    return cb(null, name); // Define the file name for the uploaded file
  }
});


const upload = multer({ storage: storage });

// Set up session and flash middleware
adminRoute.use(session({
  secret: 'dammn',
  resave: false,
  saveUninitialized: true,
}));

adminRoute.use(flash());

// Set view engine and views path
adminRoute.set('view engine', 'ejs');
adminRoute.set('views', 'views/admin');

// Set up static file serving
adminRoute.use('/uploads', express.static('uploads'));

// Define routes
adminRoute.get('/', Auth.isAdmin, adminController.dashboard);
adminRoute.get('/signout', Auth.isAdmin, adminController.getLogout);
adminRoute.get('/signin', Auth.notAdmin, adminController.getLogin);
adminRoute.post('/signin', Auth.notAdmin, adminController.postLogin);
adminRoute.get('/users', Auth.isAdmin, adminController.getUsers);
adminRoute.get('/users/delete', Auth.isAdmin, adminController.getDeleteUser);
adminRoute.get('/users/unblock', Auth.isAdmin, adminController.getUnBlockUser);
adminRoute.get('/categories', Auth.isAdmin, adminController.getCategories);
adminRoute.get('/categories/delete', Auth.isAdmin, adminController.getDeleteCategory);
adminRoute.get('/categories/unblock', Auth.isAdmin, adminController.getUnBlockCategory);
adminRoute.get('/categories/editCategory', Auth.isAdmin, adminController.getEditCategory);
adminRoute.post('/categories/editCategory', Auth.isAdmin, adminController.postEditCategory);
adminRoute.get('/categories/addCategory', Auth.isAdmin, adminController.getAddCategory);
adminRoute.post('/categories/addCategory', Auth.isAdmin, adminController.postAddCategory);
adminRoute.get('/brands', Auth.isAdmin, adminController.getBrands);
adminRoute.get('/brands/delete', Auth.isAdmin, adminController.getDeleteBrand);
adminRoute.get('/brands/unblock', Auth.isAdmin, adminController.getUnBlockBrand);
adminRoute.get('/brands/editBrand', Auth.isAdmin, adminController.getEditBrand);
adminRoute.post('/brands/editBrand', Auth.isAdmin, adminController.postEditBrand);
adminRoute.get('/brands/addBrand', Auth.isAdmin, adminController.getAddBrand);
adminRoute.post('/brands/addBrand', Auth.isAdmin, adminController.postAddBrand);
adminRoute.get('/products', Auth.isAdmin, adminController.getProducts);
adminRoute.get('/products/delete', Auth.isAdmin, adminController.getDeleteProduct);
adminRoute.get('/products/unblock', Auth.isAdmin, adminController.getUnBlockProduct);
adminRoute.get('/products/editProduct', Auth.isAdmin, adminController.getEditProduct);
adminRoute.post('/products/editProduct', Auth.isAdmin,upload.array('Image',5), adminController.postEditProduct);
adminRoute.get('/products/addProduct', Auth.isAdmin, adminController.getAddProduct);
adminRoute.post('/products/addProduct', Auth.isAdmin, upload.array('Image', 5), adminController.postAddProduct);

module.exports = adminRoute;
