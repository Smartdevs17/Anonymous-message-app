//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require("mongoose-findorcreate");
const LocalStrategy = require('passport-local').Strategy;
// const flash = require("connect-flash");


const app = express();
// app.use(flash());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public/"));


app.use(session({
    secret: "My little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-smartdev:segun17@7@cluster0.sa5wf.mongodb.net/userDB",{useNewUrlParser: true,useUnifiedTopology:  true,useFindAndModify: true,useCreateIndex: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    secret: String,
    phone: String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//       console.log(profile);
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

app.get("/",function (req,res) {
    res.render("home");
});

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));

// app.get('/auth/google/secrets', 
//   passport.authenticate("google", { failureRedirect: "/login" }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect("/secrets");
//   });

app.get("/register",function (req,res) {
    res.render("register");
});

app.get("/login",function (req,res) {
    res.render("login");
});

app.get("/secrets",function (req,res) {
  User.find({"secret": {$ne: null}},function (err, foundUsers) {
      if(err){
          console.log(err);
      }else{
          if(foundUsers){
              res.render("secrets",{usersWithSecrets: foundUsers});
          }
      }
      
  })
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.get("/submit",function (req,res) {
     if(req.isAuthenticated()){
       res.render("submit");
   }else{
       res.redirect("/login");
   }
});

app.post("/submit",function (req,res) {
    const submittedSecret = (req.body.secret).trim();

    User.findById(req.user.id,function (err,foundUser) {
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });
});


app.post("/register",function (req,res) {
    User.register(
        {username: (req.body.username).trim(),email: req.body.email,phone: req.body.phone},
        (req.body.password).trim(),
        
        function (err,user) {
       if(err) {
           console.log(err);
           res.redirect("/register");
       }else{
           passport.authenticate("local")(req,res,function () {
               res.redirect("/secrets");
           });
       }
    });
});



app.post("/login",function (req,res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        phone: req.body.phone
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local",{sucessRedirect: "/secrets",failureRedirect: "/login"});
            // passport.authenticate("local")(req,res,function () {
            //     res.redirect("/secrets");
            // });
        }
    });
});




let port = process.env.PORT;
if(port == null || port==""){
    port = 3000
};

app.listen(port,function (req,res) {
    console.log("Server has Started on successfully");
});


