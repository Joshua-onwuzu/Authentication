//jshint esversion:6

// Dependencies
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose= require("mongoose");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose =  require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


// Package  Configuration
const app = express()
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



app.use(session({
    secret: 'penticosta is real',
    resave: false,
    saveUninitialized: false,
  }))
app.use(passport.initialize());
app.use(passport.session());


  


mongoose.connect("mongodb://localhost:27017/UsersDB",{useNewUrlParser : true, useUnifiedTopology:true});
mongoose.set("useCreateIndex", true)
const saltRounds = 5;
const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    googleId : String,
    secret : String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());









// Implementing Google Oauth 

passport.serializeUser((user, done)=>{
    done(null,user.id);
})
passport.deserializeUser((id, done)=>{
    User.findById(id).then((user)=>{
        done(null,user.id)
    })
})
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/wuzu",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
))

// Request Handlers

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google",passport.authenticate('google', { scope: ['profile']}));

app.get('/auth/google/wuzu', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route("/register")
.get((req, res)=>{
    res.render("register");
})
.post((req, res)=>{
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register")
         } else {
             passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
             })

             }
         })

      });


app.route("/login")
.get((req, res)=>{
    res.render("login");
})
 .post((req, res)=>{
    const newUser = User({
        username : req.body.username,
        password : req.body.password
    })

    req.login(newUser, (err)=>{
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets")
            })
        }
    })

})

app.get("/logout",(req, res)=>{
    req.logout();
    res.redirect("/")
})

app.get("/secrets", (req, res)=>{
//  if (req.isAuthenticated()){
//      res.render("secrets");
//  }else{
//      res.redirect("/login")
//  }
   User.find({"secret" : {$ne : null}},(err, data)=>{
    if (!err){
        if (data){
            res.render("secrets", {userSecrets : data})
        }
        else{
            console.log(" i didnt find any data")
        }
        
    }  else {
        console.log(err)
    } 
   })
   
}) 

app.get("/submit", (req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login")
    }
})
app.post("/submit", (req, res)=>{
    const submittedSecret = req.body.secret;
    User.findById (req.user, (err,data)=>{
        if (!err){
            data.secret = submittedSecret;
            data.save(() =>{
                res.redirect("/secrets")
            })
        }
    })
})
app.listen("3000", ()=>{
    console.log("Server is up and running")
})