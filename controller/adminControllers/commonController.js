const User = require('../../model/userModel')

const bcrypt = require('bcrypt')


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


module.exports = {

  dashboard,
  getLogout,
  getLogin,
  postLogin,
}