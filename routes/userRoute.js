const express = require('express');
const userRoute = express.Router(); // Use express.Router() for a sub-router
const session = require('express-session');
const flash = require('connect-flash');
const Auth = require('../middlewares/userAuth');
const OfferCheck = require('../middlewares/offerExpiry');
const Checkout = require('../middlewares/checkCart')
const multer = require('multer')
const methodOverride = require('method-override')
const passport = require('passport');
require('../others/passport')

const authController = require('../controller/userControllers/authController');
const cartController = require('../controller/userControllers/cartController');
const productController = require('../controller/userControllers/productController');
const profileController = require('../controller/userControllers/profileController');
const sortingController = require('../controller/userControllers/sortingController')
const orderController = require('../controller/userControllers/orderController')
const wishlistController = require('../controller/userControllers/wishlistController')

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

// userRoute.set('view engine', 'ejs');
// userRoute.set('views', './views/user');

// Middleware to serve static files
userRoute.use('/uploads', express.static('uploads'));


userRoute.use(methodOverride('_method'))

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
userRoute.get('/', OfferCheck.updateOffer, authController.getHome);
userRoute.get('/signin', Auth.notUser, authController.getSignin);
userRoute.post('/signin', Auth.notUser, authController.postSignin);
userRoute.get('/signup', Auth.notUser, authController.getSignup);
userRoute.post('/signup', Auth.notUser, authController.postSignup);
userRoute.post('/signup/sendOtp', Auth.notUser, authController.postSendOtp);
userRoute.post('/signup/validateOtp', Auth.notUser, upload.none(), authController.postValidateOtp);
userRoute.get('/signout',authController.getSignout);
userRoute.get('/referralCheck',authController.getReferralCheck)

userRoute.get('/forgotPassword',Auth.notUser,authController.getForgotPassword);
userRoute.put('/forgotPassword',Auth.notUser,authController.putForgotPassword);
userRoute.post('/forgotPassword/sendOtp', Auth.notUser, authController.postForgotSendOtp);

userRoute.get('/auth/google/success', authController.getAuthSuccess);
userRoute.get('/auth/google/failure', authController.getAuthFailure);
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

userRoute.get('/product', OfferCheck.updateOffer, productController.getProduct);
userRoute.get('/product/loadHomeProduct', OfferCheck.updateOffer, productController.getLoadHomeProduct);
userRoute.post('/product/review',Auth.isUser, productController.postProductReview)
userRoute.get('/product/color',productController.getColorWithSize);
userRoute.get('/product/size',productController.getSizeWithQuantity);
userRoute.get('/searchProduct', OfferCheck.updateOffer, productController.getSearchProduct)


userRoute.get('/profile',Auth.isUser,profileController.getProfile);
userRoute.get('/profile/orders',Auth.isUser,profileController.getOrders);
userRoute.get('/profile/address',Auth.isUser, profileController.getAddress);
userRoute.put('/profile/editAddress',Auth.isUser, profileController.putEditAddress);
userRoute.post('/profile/addAddress',Auth.isUser, profileController.postAddAddress);
userRoute.get('/profile/deleteAddress',Auth.isUser,profileController.getDeleteAddress);
userRoute.get('/profile/wallet',Auth.isUser,profileController.getWallet)

userRoute.get('/category', OfferCheck.updateOffer, productController.getCategory)
userRoute.get('/allProducts', OfferCheck.updateOffer, productController.getAllProducts)
userRoute.get('/sortCategory', OfferCheck.updateOffer, sortingController.getSortCategory)
userRoute.get('/sortProducts', OfferCheck.updateOffer, sortingController.getSortProducts)

userRoute.get('/cart',Auth.isUser, OfferCheck.updateOffer, cartController.getCart)
userRoute.post('/cart',Auth.isUser,cartController.postCart)
userRoute.post('/cart/addToCart',Auth.isUser,cartController.postAddToCart)
userRoute.get('/cart/removeProduct',Auth.isUser,cartController.getRemoveProduct)
userRoute.get('/cart/checkout',Auth.isUser, Checkout.checkCart,cartController.getCheckout)
userRoute.post('/cart/applyCoupon',Auth.isUser, upload.none(),cartController.postApplyCoupon)
userRoute.get('/cart/removeCoupon',Auth.isUser, upload.none(),cartController.getRemoveCoupon);
userRoute.get('/cart/quantityCheck',Auth.isUser, cartController.getQuantityCheck)

userRoute.post('/createOrder',Auth.isUser,orderController.postCreateOrder)
userRoute.get('/paypalPayment',Auth.isUser,orderController.getPaypalPayment)
userRoute.post('/cancelOrder',Auth.isUser,orderController.postCancelOrder)
userRoute.post('/returnOrder',Auth.isUser,orderController.postReturnOrder)
userRoute.get('/orderDetails',Auth.isUser,orderController.getOrderDetails)
userRoute.get('/orderDetails/invoice',Auth.isUser,orderController.getInvoice)
userRoute.get('/paypal/orderComplete',Auth.isUser,orderController.paypalOrderComplete)

userRoute.get('/wishlist', Auth.isUser, OfferCheck.updateOffer, wishlistController.getWishlist)
userRoute.post('/wishlist/addToWishlist',upload.none(), wishlistController.postAddToWishlist)
userRoute.get('/wishlist/removeProduct',Auth.isUser, OfferCheck.updateOffer, wishlistController.getRemoveFromWishlist)




// Auth Callback
userRoute.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/google/success',
    failureRedirect: '/auth/google/failure'
  })
)







module.exports = userRoute;
