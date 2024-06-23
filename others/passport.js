const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;;

passport.serializeUser((user,done)=>{
  done(null,user)
})

passport.deserializeUser((user,done)=>{
  done(null,user)
})

passport.use(new GoogleStrategy({
  clientID:process.env.OAUTH_CLIENT_ID,
  clientSecret:process.env.OAUTH_CLIENT_SECRET,
  callbackURL:"http://localhost:8080/auth/google/callback",
  passReqToCallback:true,
},
function(request,accessToken,refreshToken,profile,done){
  return done(null,profile)
}
))

module.exports = passport