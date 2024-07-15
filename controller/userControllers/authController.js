const User = require('../../model/userModel')
const Brand = require('../../model/brandModel');
const Category = require('../../model/categoryModel');
const Product = require('../../model/productModel');
const Color = require('../../model/colorModel');
const Size = require('../../model/sizeModel');
const Referral = require('../../model/referralModel')
const Wallet = require('../../model/walletModel')
const UserAuth = require('../../model/userAuthModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
require('dotenv').config()


// Functions
function generateReferralCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let referralCode = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  return referralCode;
}


const getHome = async (req, res) => {
  try {
    const productObj = await Product.find({ "isActive": true }).populate('Brand').populate('Category')
      .populate({ path: 'Versions', populate: [{ path: 'Color', ref: 'Color' }, { path: 'Size', ref: 'Size' }] })
    let userData;
    if (req.session.userData) {
      userData = await User.findById({ "_id": req.session.userData._id })
    }

    const fetchArray = [Size.find(), Color.find(), Category.find(), Brand.find()]
    const [sizeData, colorData, categoryData, brandData] = await Promise.all(fetchArray)

    const pushData = {
      loginMessage: req.flash('msg'),
      productObj, sizeData, colorData, categoryData, brandData, userData
    }
    res.render('user/userHome', pushData)
  } catch (error) {
    console.log(error)
  }
}

const getSignin = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg'),
      userData: req.session.userData
    }
    res.render('user/userLogin', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postSignin = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    const searchUser = await User.findOne({ "Email": Email })
    if (searchUser && !searchUser.isAdmin) {

      const passwordMatch = await bcrypt.compare(Password, searchUser.Password);
      if (passwordMatch && searchUser.isActive) {
        req.session.userData = searchUser;
        req.session.save()
        res.redirect('/')
      } else if (passwordMatch && !searchUser.isActive) {
        req.flash('msg', 'User blocked by the Admin')
        res.redirect('/signin')
      } else {
        req.flash('msg', 'Wrong Password')
        res.redirect('/signin')
      }
    } else {
      req.flash('msg', `User doesn't exist`)
      res.redirect('/signin')
    }

  } catch (err) {
    console.log(err)
  }
}

const getSignup = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg'),
      userData: req.session.userData
    }
    res.render('user/userSignup', pushData)
  } catch (error) {
    console.log(error);
  }
}

const postSignup = async (req, res) => {
  try {

    const { Name, Email, Contact, ReferralId, Password } = req.body;
    const capsReferralId = ReferralId.toUpperCase()
    const docCount = await User.find().countDocuments();
    const referralPart1 = generateReferralCode(5);
    const referralCode = String(`${referralPart1}${docCount + 1}`);
    let userData;
    const checkEmail = await User.findOne({ "Email": Email });
    if (checkEmail) {
      req.flash('msg', 'User exists');
      res.redirect('/signup')
    } else {
      hashedPassword = await bcrypt.hash(Password, 10)
      if (capsReferralId) {
        const userReferralCheck = await User.findOne({ "Referral": capsReferralId });
        const referralCheck = await Referral.findOne();
        if (userReferralCheck && referralCheck.isActive) {
          const updateWallet = await Wallet.updateOne(
            { "UserId": userReferralCheck._id },
            {
              $inc: { "Balance": referralCheck.Amount }, // Increment the balance
              $push: {
                "Transaction": {
                  Type: 'Referral',
                  Amount: referralCheck.Amount,
                  Date: new Date() // Record the date of the transaction
                }
              }
            },
            { upsert: true }
          )


          userData = await User.create({ "Email": Email, "Name": Name, "Contact": Contact, "Referral": referralCode, "Referred": capsReferralId, "Password": hashedPassword })
        }
      } else {
        userData = await User.create({ "Email": Email, "Name": Name, "Contact": Contact, "Referral": referralCode, "Password": hashedPassword })
      }

      if (userData) {
        req.session.userData = userData
        res.status(200).redirect('/')
      }
    }
  } catch (err) {
    console.log(err)
  }
}

const postSendOtp = async (req, res) => {
  try {
    console.log(req.body.Email)
    if (!req.session.Email) {
      req.session.Email = req.body.Email
    }
    console.log(req.session.Email);
    const checkEmail = await User.findOne({ "Email": req.session.Email });
    if (checkEmail) {
      req.flash('msg', 'Email already exists')
      res.json({ success: false, message: 'User already exists.' });

      return;
    } else {
      const randomOtp = Math.floor(1000 + Math.random() * 9000)
      console.log(randomOtp)
      req.session.otp = randomOtp;
      req.session.save()

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'papasmenauth@gmail.com',
          clientId: process.env.NODEMAILER_CLIENT_ID,
          clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
          refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
        }
      });


      const mailOptions = {
        from: 'papasmenauth@gmail.com',
        to: req.session.Email,
        subject: 'Hello, PapasMenAuth Mail',
        text: `Your verification OTP is ${randomOtp}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email: ' + error);
        } else {
          console.log('Email sent: ' + info.response);
        }

      });
    }



  } catch (error) {
    console.log(error)
  }
}

const postValidateOtp = async (req, res) => {
  try {
    let enteredOtp = String(req.body.otp1) + String(req.body.otp2) + String(req.body.otp3) + String(req.body.otp4)
    const storedOtp = req.session.otp;
    enteredOtp = Number(enteredOtp);
    if (!enteredOtp || !storedOtp || enteredOtp !== storedOtp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    } else {
      console.log('Validated');
      res.json({ success: true })
    }

    // OTP is valid, clear the stored OTP and send a success response
    delete req.session.otp;


  } catch (error) {
    console.log(error)
  }
}

const getSignout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/signin')
  } catch (error) {
    console.log(error);
  }
}

const getReferralCheck = async (req, res) => {
  try {
    const { referralInput } = req.query;
    const referralSearch = await User.findOne({ "Referral": referralInput });

    if (referralSearch) {
      res.json({ success: true })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    console.log(error);
  }
}

const getForgotPassword = async (req, res) => {
  try {
    const pushData = {
      loginMessage: req.flash('msg')
    }
    res.render('user/forgotPassword', pushData)
  } catch (error) {
    console.log(error);
  }
}

const putForgotPassword = async (req, res) => {
  try {
    console.log(req.body.Email, req.body.Password)
    const { Email, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    const updateData = await User.updateOne({ "Email": Email }, { $set: { "Password": hashedPassword } });
    if (updateData) {
      res.redirect('/signin')
    } else {
      req.flash('msg', 'Something happened. Try again')
      res.redirect('forgotPassword')
    }
  } catch (error) {
    console.log(error);
  }
}

const postForgotSendOtp = async (req, res) => {
  try {
    console.log(req.body.Email)
    if (!req.session.Email) {
      req.session.Email = req.body.Email
    }
    console.log(req.session.Email);
    const checkEmail = await User.findOne({ "Email": req.session.Email });

    const randomOtp = Math.floor(1000 + Math.random() * 9000)
    console.log(randomOtp)
    req.session.otp = randomOtp;
    req.session.save()

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'papasmenauth@gmail.com',
        clientId: process.env.NODEMAILER_CLIENT_ID,
        clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
        refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
      }
    });


    const mailOptions = {
      from: 'papasmenauth@gmail.com',
      to: req.session.Email,
      subject: 'Hello, PapasMenAuth Mail',
      text: `Your verification OTP is ${randomOtp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email: ' + error);
      } else {
        console.log('Email sent: ' + info.response);
      }

    });

  } catch (error) {
    console.log(error);
  }
}

const getAuthSuccess = async (req, res) => {
  try {

    const userData = await User.findOne({ 'Email': req.user.email });

    if (userData) {
      req.session.userData = userData;
      res.redirect('/')
    } else {
      const userAuthData = await UserAuth.updateOne({ "Name": req.user.displayName }, { $set: { "Email": req.user.email } }, { upsert: true });

      if (userAuthData) {
        req.session.userData = userAuthData;
        res.redirect('/')
      } else {
        req.flash('msg', 'Error in google authentication')
        res.redirect('/signin')
      }
    }

  } catch (error) {
    console.log(error);
  }
};

const getAuthFailure = async (req, res) => {
  try {
    req.flash('msg', 'Authentication failed, try again.');
    res.redirect('/signin');
  } catch (error) {
    console.log(error);
  }
};

module.exports = {

  getHome,
  getSignin,
  postSignin,
  getSignup,
  postSignup,
  postSendOtp,
  postValidateOtp,
  getSignout,
  getReferralCheck,
  getForgotPassword,
  putForgotPassword,
  postForgotSendOtp,
  getAuthSuccess,
  getAuthFailure,

}