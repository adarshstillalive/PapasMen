const express = require('express');
const userRoute = express(); // Use express.Router() for a sub-router
const session = require('express-session');
const flash = require('connect-flash');
const Auth = require('../middlewares/userAuth');
const multer = require('multer')
const passport = require('passport');
require('../others/passport')

const userController = require('../controller/userController');

const upload = multer({ dest: 'uploads/' });


// // Middleware to parse JSON and URL-encoded payloads
// userRoute.use(express.json());
// userRoute.use(express.urlencoded({ extended: true }));

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
userRoute.get('/', userController.getHome);
userRoute.get('/signin', Auth.notUser, userController.getSignin);
userRoute.post('/signin', Auth.notUser, userController.postSignin);
userRoute.get('/signup', Auth.notUser, userController.getSignup);
userRoute.post('/signup', Auth.notUser, userController.postSignup);
userRoute.post('/signup/sendOtp', Auth.notUser, userController.postSendOtp);
userRoute.post('/signup/validateOtp', Auth.notUser, upload.none(), userController.postValidateOtp);
userRoute.get('/signout',userController.getSignout);
userRoute.get('/forgotPassword',Auth.notUser,userController.getForgotPassword);
userRoute.post('/forgotPassword',Auth.notUser,userController.postForgotPassword);
userRoute.post('/forgotPassword/sendOtp', Auth.notUser, userController.postForgotSendOtp);
userRoute.get('/auth/google/success', userController.getAuthSuccess);
userRoute.get('/auth/google/failure', userController.getAuthFailure);
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
userRoute.get('/product', userController.getProduct);
userRoute.get('/profile',Auth.isUser,userController.getProfile);
userRoute.get('/profile/orders',Auth.isUser,userController.getOrders);
userRoute.get('/profile/address',Auth.isUser, userController.getAddress);
userRoute.post('/profile/editAddress',Auth.isUser, userController.postEditAddress);
userRoute.post('/profile/addAddress',Auth.isUser, userController.postAddAddress);
userRoute.get('/profile/deleteAddress',Auth.isUser,userController.getDeleteAddress);
userRoute.get('/category',userController.getCategory)
userRoute.get('/cart',Auth.isUser,userController.getCart)
userRoute.post('/cart/addToCart',Auth.isUser,userController.getAddToCart)
userRoute.get('/cart/checkout',Auth.isUser,userController.getCheckout)



// Auth Callback
userRoute.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/google/success',
    failureRedirect: '/auth/google/failure'
  })
)







module.exports = userRoute;
