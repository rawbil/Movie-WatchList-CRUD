const express = require("express");
const route = express.Router();
const userModel = require("../models/adminModel");
const movieModel = require("../models/movieModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require('jsonwebtoken');
//authMiddleware
const authMiddleware = require('../auth/authMiddleware');


//GET /login
route.get("/login", async (req, res) => {
  try {
    const locals = {
      login: "Already have an account?",
      register: "Don't have an account?",
    };
    res.render("admin/login", { locals });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
});

//POST /login
route.post("/login", async (req, res) => {
  try {
    const {username, password} = req.body;
    const user = await userModel.findOne({username});
    if(!user) {
        return res.json({success: false, message: "Invalid username"})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
        return res.json({success: false, message: "Invalid password"})
    }
    //res.json({success: true, user})
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET);
    res.cookie('token', token);
    res.redirect('/dashboard')

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
});

//POST /register
route.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (
      username.trim() === "" ||
      password.trim() === "" ||
      email.trim() === ""
    ) {
      return res.json({
        success: false,
        message: "Please fill in all the fields",
      });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email format" });
    }

    if(!validator.isStrongPassword(password)) {
        return res.json({success: false, message: "Invalid password format"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = await userModel.create({
        username,
        password: hashedPassword,
        email
    })
    res.json({success: true, data})
  } catch (error) {
    if(error.code === 11000) {
        return res.json({success: false, message: "User already exists"})
    }
    res.json({success: false, message: "Server Error"})
  }
});

//GET /dashboard
route.get('/dashboard', authMiddleware, async(req, res) => {
    try {
        res.render('/admin/dashboard')
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Error"});
    }
})

module.exports = route;
