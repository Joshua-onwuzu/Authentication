//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const _ = require("lodash");
const mongoose= require("mongoose");
// const encrypt =  require("mongoose-encryption")
// const md5 = require("md5");

const bcrypt = require("bcrypt");

const app = express()
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/UsersDB",{useNewUrlParser : true, useUnifiedTopology:true});


const saltRounds = 5;



// Encrypting the database password field 




const userSchema = new mongoose.Schema({
    email : String,
    password : String
})

// userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields : ["password"]})



const User = mongoose.model("User", userSchema);




app.get("/", (req, res)=>{
    res.render("home");
});

app.route("/login")
.get((req, res)=>{
    res.render("login");
})
.post((req, res)=>{
    const username = req.body.username
    const password = req.body.password
    User.findOne({email : username},(err, data)=>{
        if(!err){
            if(data){
                bcrypt.compare(password, data.password, function(err, result) {
                    if (result === true){
                        res.render("secrets")
                    }
                    else {
                        res.send("Wrong password")
                    }
                });

            } else {
                res.send("Wrong Email")
            }

        } else {
            console.log(err)
        }
    })
})




app.route("/register")
.get((req, res)=>{
    res.render("register");
})
.post((req, res)=>{
    const username = req.body.username
    const password = req.body.password


    bcrypt.hash(password, saltRounds, function(err, hash) {
        // Store hash in your password DB.

        if (!err){
            const newUser  =  new User({
                email :  username,
                password : hash
            })
            newUser.save((err)=>{
                if(!err){
                    res.render("secrets")
                }else{
                    console.log(err)
                }
        })
        }else {
            console.log(err)
        }

    });



    })









app.listen("3000", ()=>{
    console.log("Server is up and running")
})