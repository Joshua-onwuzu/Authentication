//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const _ = require("lodash");
const mongoose= require("mongoose");
const encrypt =  require("mongoose-encryption")

const app = express()
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/UsersDB",{useNewUrlParser : true, useUnifiedTopology:true});



// Encrypting the database password field 




const userSchema = new mongoose.Schema({
    email : String,
    password : String
})

userSchema.plugin(encrypt, {secret:process.env.SECRET, encryptedFields : ["password"]})



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
                if (data.password === password){
                    res.render("secrets")
                }
                else {
                    res.send("Wrong password")
                }
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

    const newUser  =  new User({
        email :  username,
        password : password
    })
    //     newUser.save((err)=>{
    //     if(!err){
    //         res.render("secrets")
    //     }else{
    //         console.log(err)
    //     }
    // })
    User.findOne({email : username} ,(err, data)=>{
        if(!data){
            newUser.save((err)=>{
                if(!err){
                    res.render("secrets")
                }else{
                    console.log(err)
                }
            })
        } else {
            res.send("Please use another email address, the one you use has already been stored in our database")
        }
    })
})







app.listen("3000", ()=>{
    console.log("Server is up and running")
})