const express = require('express');
const userRoute = express(); // Use express.Router() for a sub-router
const session = require('express-session');
const flash = require('connect-flash');
const Auth = require('../middlewares/userAuth');
const Swal = require('sweetalert2')
const multer = require('multer')
const passport = require('passport');
require('../others/passport')

const authController = require('../controller/userControllers/authController');
const cartController = require('../controller/userControllers/cartController');
const productController = require('../controller/userControllers/productController');
const profileController = require('../controller/userControllers/profileController');
const sortingController = require('../controller/userControllers/sortingController')

const upload = multer({ dest: 'uploads/' });


// Session middleware
userRoute.use(session({
  secret: 'your_strong_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Flash middleware
userRoute.use(flash());

userRoute.set('view engine', 'ejs');
userRoute.set('views', './views/user');

// Middleware to serve static files
userRoute.use('/uploads', express.static('uploads'));

// Passport middleware
userRoute.use(passport.initialize());
userRoute.use(passport.session())

// Middleware to make flash messages available in views
userRoute.use((req, res, next) => {
  res.locals.success_messages = req.flash('success');
  res.locals.error_messages = req.flash('error');
  next();
});

//User Routes
userRoute.get('/', authController.getHome);
userRoute.get('/signin', Auth.notUser, authController.getSignin);
userRoute.post('/signin', Auth.notUser, authController.postSignin);
userRoute.get('/signup', Auth.notUser, authController.getSignup);
userRoute.post('/signup', Auth.notUser, authController.postSignup);
userRoute.post('/signup/sendOtp', Auth.notUser, authController.postSendOtp);
userRoute.post('/signup/validateOtp', Auth.notUser, upload.none(), authController.postValidateOtp);
userRoute.get('/signout',authController.getSignout);
userRoute.get('/forgotPassword',Auth.notUser,authController.getForgotPassword);
userRoute.post('/forgotPassword',Auth.notUser,authController.postForgotPassword);
userRoute.post('/forgotPassword/sendOtp', Auth.notUser, authController.postForgotSendOtp);
userRoute.get('/auth/google/success', authController.getAuthSuccess);
userRoute.get('/auth/google/failure', authController.getAuthFailure);
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
userRoute.get('/product', productController.getProduct);
userRoute.get('/profile',Auth.isUser,profileController.getProfile);
userRoute.get('/profile/orders',Auth.isUser,profileController.getOrders);
userRoute.get('/profile/address',Auth.isUser, profileController.getAddress);
userRoute.post('/profile/editAddress',Auth.isUser, profileController.postEditAddress);
userRoute.post('/profile/addAddress',Auth.isUser, profileController.postAddAddress);
userRoute.get('/profile/deleteAddress',Auth.isUser,profileController.getDeleteAddress);
userRoute.get('/category',productController.getCategory)
userRoute.get('/category/sort',sortingController.getSortCategory)
userRoute.get('/cart',Auth.isUser,cartController.getCart)
userRoute.post('/cart/addToCart',Auth.isUser,cartController.postAddToCart)
userRoute.get('/cart/checkout',Auth.isUser,cartController.getCheckout)



// Auth Callback
userRoute.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/google/success',
    failureRedirect: '/auth/google/failure'
  })
)







module.exports = userRoute;
